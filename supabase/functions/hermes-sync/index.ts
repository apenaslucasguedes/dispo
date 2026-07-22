import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = { "content-type": "application/json" };
const allowedSteps = new Set(["h_entrada","h_brief","h_ferramenta","h_pesquisa","h_diagnostico","h_caminhos","h_auditorias","h_decisoes","h_verbal","h_criterios","h_direcao","h_handoff"]);
const reply = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: cors });

function timingSafeEqual(a: string, b: string) {
  const aa = new TextEncoder().encode(a); const bb = new TextEncoder().encode(b);
  if (aa.length !== bb.length) return false;
  let diff = 0; for (let i = 0; i < aa.length; i++) diff |= aa[i] ^ bb[i];
  return diff === 0;
}

function validate(payload: any) {
  if (!payload || payload.provider !== "hermes" || !payload.projectSlug || !payload.brandName) return "invalid identity";
  if (!Array.isArray(payload.steps) || payload.steps.length < 1 || payload.steps.length > 12) return "invalid steps";
  for (const step of payload.steps) {
    if (!allowedSteps.has(step.key) || typeof step.displayMarkdown !== "string" || !step.technicalMetadata) return `invalid step ${step?.key || "unknown"}`;
  }
  return null;
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

Deno.serve(async (req) => {
  if (req.method !== "POST") return reply(405, { error: "method_not_allowed" });
  const expected = Deno.env.get("HERMES_SYNC_SECRET") || "";
  const supplied = req.headers.get("x-hermes-secret") || "";
  if (!expected || !timingSafeEqual(expected, supplied)) return reply(401, { error: "unauthorized" });
  let body: any; try { body = await req.json(); } catch { return reply(400, { error: "invalid_json" }); }
  const payload = body.payload || body; const error = validate(payload); if (error) return reply(400, { error });

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  let briefingId = body.briefingId || payload.briefingId;
  if (!briefingId) {
    const { data, error: findError } = await supabase.from("briefings").select("id,client_name,result").limit(500);
    if (findError) return reply(500, { error: "lookup_failed" });
    const slugMatch = (data || []).filter(row => row.result?.hermes?.projectSlug === payload.projectSlug);
    const identityTerms = payload.brandName.toLocaleLowerCase("pt-BR").split(/\s+/).filter((term: string) => term.length > 3).slice(0, 2);
    const contentMatches = (data || []).filter(row => {
      const searchable = JSON.stringify({ client_name: row.client_name, result: row.result }).toLocaleLowerCase("pt-BR");
      return identityTerms.every((term: string) => searchable.includes(term));
    });
    const matches = slugMatch.length ? slugMatch : contentMatches;
    if (matches.length !== 1) return reply(409, { error: "briefing_identity_not_unique", matches: matches.length });
    briefingId = matches[0].id;
  }
  const { data: row, error: readError } = await supabase.from("briefings").select("id,result").eq("id", briefingId).single();
  if (readError || !row) return reply(404, { error: "briefing_not_found" });
  const current = row.result?.hermes || null;
  if (current?.projectSlug && current.projectSlug !== payload.projectSlug) return reply(409, { error: "project_identity_mismatch" });
  if (payload.idempotencyKey && current?.lastIdempotencyKey === payload.idempotencyKey) return reply(200, { synced: true, idempotent: true, briefingId, steps: payload.steps.length, updatedAt: current.updatedAt });
  const hermes = merge(current, payload); hermes.lastIdempotencyKey = payload.idempotencyKey || null;
  const { error: rpcError } = await supabase.rpc("upsert_briefing_hermes", { p_briefing_id: briefingId, p_hermes: hermes, p_expected_updated_at: current?.updatedAt || "__absent__" });
  if (rpcError) return reply(409, { error: "sync_conflict" });
  return reply(200, { synced: true, idempotent: false, briefingId, steps: payload.steps.length, updatedAt: hermes.updatedAt });
});
