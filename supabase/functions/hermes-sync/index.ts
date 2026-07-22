import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = { "content-type": "application/json" };
const allowedSteps = new Set(["h_entrada","h_brief","h_ferramenta","h_pesquisa","h_diagnostico","h_caminhos","h_auditorias","h_decisoes","h_verbal","h_criterios","h_direcao","h_handoff"]);
const allowedStatuses = new Set(["sem_conteudo","rascunho","aprovado","aprovado_com_ressalvas","revisar","rejeitado","pulada","bloqueado","erro"]);
const secretKey = /^(?:api[_-]?key|access[_-]?token|authorization|client[_-]?secret|password|private[_-]?key|secret|service[_-]?role)$/i;
const secretValue = /-----BEGIN .*PRIVATE KEY-----|\beyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b|\b(?:sk-ant-|sk-|ghp_|github_pat_)[A-Za-z0-9_-]{16,}\b|SUPABASE_SERVICE_ROLE_KEY|\bservice_role\b/i;
const reply = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: cors });

function timingSafeEqual(a: string, b: string) {
  const aa = new TextEncoder().encode(a); const bb = new TextEncoder().encode(b);
  if (aa.length !== bb.length) return false;
  let diff = 0; for (let i = 0; i < aa.length; i++) diff |= aa[i] ^ bb[i];
  return diff === 0;
}

function validate(payload: any) {
  if (!payload || payload.provider !== "hermes" || !payload.projectSlug || !payload.brandName || payload.projectSlug.length > 240 || payload.brandName.length > 240 || String(payload.cardTitle || '').length > 240) return "invalid identity";
  if (!Array.isArray(payload.steps) || payload.steps.length < 1 || payload.steps.length > 12) return "invalid steps";
  if (new Set(payload.steps.map((step: any) => step?.key)).size !== payload.steps.length) return "duplicate steps";
  for (const step of payload.steps) {
    if (!allowedSteps.has(step.key) || typeof step.displayMarkdown !== "string" || step.displayMarkdown.length > 500000 || !step.technicalMetadata || typeof step.technicalMetadata !== "object" || Array.isArray(step.technicalMetadata) || !allowedStatuses.has(step.status || "rascunho")) return `invalid step ${step?.key || "unknown"}`;
  }
  return null;
}

function hasSecret(value: any, key = ""): boolean {
  if (secretKey.test(key)) return true;
  if (Array.isArray(value)) return value.some(item => hasSecret(item));
  if (value && typeof value === "object") return Object.entries(value).some(([childKey, child]) => hasSecret(child, childKey));
  return typeof value === "string" && secretValue.test(value);
}

function merge(existing: any, payload: any) {
  const now = new Date().toISOString(); const old = existing || {}; const steps = { ...(old.steps || {}) };
  for (const incoming of payload.steps) {
    const prev = steps[incoming.key] || {};
    const generated = incoming.displayMarkdown;
    const oldGenerated = prev.generatedMarkdown || prev.content || "";
    const edited = prev.editedMarkdown || (prev.hasHumanEdit ? prev.displayMarkdown : "") || "";
    const hasHumanEdit = !!(prev.hasHumanEdit || edited);
    steps[incoming.key] = {
      ...prev,
      generatedMarkdown: generated,
      editedMarkdown: hasHumanEdit ? edited : "",
      displayMarkdown: hasHumanEdit ? edited : generated,
      content: hasHumanEdit ? edited : generated,
      hasHumanEdit,
      newVersionAvailable: hasHumanEdit && oldGenerated !== generated,
      technicalMetadata: incoming.technicalMetadata,
      artifacts: incoming.technicalMetadata.artifacts || incoming.artifacts || [],
      status: prev.status && prev.status !== "sem_conteudo" ? prev.status : (incoming.status || "rascunho"),
      notes: prev.notes || "", importedAt: now,
      history: Array.isArray(prev.history) ? prev.history : [],
    };
  }
  return {
    ...old, provider: "hermes", projectSlug: payload.projectSlug, brandName: payload.brandName,
    cardTitle: payload.cardTitle, status: old.status || payload.overallStatus || "pronto_para_revisao",
    importedAt: old.importedAt || now, updatedAt: now, steps,
    history: [...(Array.isArray(old.history) ? old.history : []), { action: "automatic_sync", at: now, idempotencyKey: payload.idempotencyKey || null }],
  };
}

function withoutHermes(result: any) {
  const copy = { ...(result || {}) };
  delete copy.hermes;
  return copy;
}

function verification(result: any, beforeResult: any, payload: any) {
  const hermes = result?.hermes;
  const verifiedStepCount = hermes?.steps && typeof hermes.steps === "object" ? Object.keys(hermes.steps).length : 0;
  const verifiedContentMatches = payload.steps.every((step: any) => hermes?.steps?.[step.key]?.generatedMarkdown === step.displayMarkdown);
  return {
    verifiedStepCount,
    verifiedContentMatches,
    verifiedCardTitle: hermes?.cardTitle || null,
    verifiedProjectSlug: hermes?.projectSlug || null,
    unrelatedResultPreserved: JSON.stringify(withoutHermes(result)) === JSON.stringify(withoutHermes(beforeResult)),
  };
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return reply(405, { error: "method_not_allowed" });
  if (Number(req.headers.get("content-length") || 0) > 5 * 1024 * 1024) return reply(413, { error: "payload_too_large" });
  const expected = Deno.env.get("HERMES_SYNC_SECRET") || "";
  const supplied = req.headers.get("x-hermes-secret") || "";
  if (!expected || !timingSafeEqual(expected, supplied)) return reply(401, { error: "unauthorized" });
  let body: any; try { body = await req.json(); } catch { return reply(400, { error: "invalid_json" }); }
  const payload = body.payload || body; const error = validate(payload); if (error) return reply(400, { error });
  if (hasSecret(payload)) return reply(400, { error: "payload_security_violation" });

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  let briefingId = body.briefingId || payload.briefingId;
  if (!briefingId) return reply(400, { error: "briefing_id_required" });
  if (body.briefingId && payload.briefingId && body.briefingId !== payload.briefingId) return reply(409, { error: "briefing_identity_mismatch" });
  const { data: row, error: readError } = await supabase.from("briefings").select("id,result").eq("id", briefingId).single();
  if (readError || !row) return reply(404, { error: "briefing_not_found" });
  const current = row.result?.hermes || null;
  if (current?.projectSlug && current.projectSlug !== payload.projectSlug) return reply(409, { error: "project_identity_mismatch" });
  if (payload.idempotencyKey && current?.lastIdempotencyKey === payload.idempotencyKey) return reply(200, { synced: true, idempotent: true, briefingId, steps: payload.steps.length, updatedAt: current.updatedAt, ...verification(row.result, row.result, payload) });
  const hermes = merge(current, payload); hermes.lastIdempotencyKey = payload.idempotencyKey || null;
  const { error: rpcError } = await supabase.rpc("upsert_briefing_hermes", { p_briefing_id: briefingId, p_hermes: hermes, p_expected_updated_at: current?.updatedAt || "__absent__" });
  if (rpcError) return reply(409, { error: "sync_conflict" });
  const { data: verifiedRow, error: verifyError } = await supabase.from("briefings").select("result").eq("id", briefingId).single();
  if (verifyError || !verifiedRow) return reply(500, { error: "verification_failed" });
  const proof = verification(verifiedRow.result, row.result, payload);
  if (proof.verifiedStepCount !== payload.steps.length || !proof.verifiedContentMatches || proof.verifiedProjectSlug !== payload.projectSlug || !proof.unrelatedResultPreserved) return reply(500, { error: "verification_failed" });
  return reply(200, { synced: true, idempotent: false, briefingId, steps: payload.steps.length, updatedAt: hermes.updatedAt, ...proof });
});
