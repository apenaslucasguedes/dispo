const $ = id => document.getElementById(id);
let client;
let briefings = [];
let activeId = null;
let channel;
let copyTargets = [];

const RESULT_SECTIONS = [
  ["modeloEscolhido", "Modelo mental escolhido"],
  ["caminhos", "Caminhos gerados"],
  ["autocritica", "Autocrítica"],
  ["caminhoFinal", "Caminho final"],
  ["persona", "Persona de redação"],
  ["referenciasVisuais", "Referências visuais"],
  ["promptImagem", "Prompt de imagem"],
];

// Mesmo pipeline da edge function (supabase/functions/process-briefing), só que
// aqui vira uma sequência de prompts pra colar manualmente num GPT qualquer,
// sem depender de cota de API.
const MODELOS_MENTAIS = `
- Jobs to be Done: o que o cliente está "contratando" o produto/serviço para fazer
- Primeiros princípios: quebrar o problema em verdades básicas e reconstruir dali
- Golden Circle (Simon Sinek): por quê -> como -> o quê
- Blue Ocean Strategy: onde criar espaço de mercado não disputado
- Behavioral design / gatilhos comportamentais: o que motiva a ação do público
`.trim();

const VICIOS_IA = `
- Evite frases de efeito genéricas ("no mundo dinâmico de hoje...")
- Evite excesso de adjetivos vazios (incrível, revolucionário, único)
- Evite listas artificiais quando um parágrafo corrido é mais natural
- Prefira afirmações concretas e específicas a generalidades
- Evite repetir a pergunta do usuário como abertura da resposta
`.trim();

function formatBriefingText(answers) {
  return Object.entries(answers || {}).map(([q, a]) => `P: ${q}\nR: ${a}`).join("\n\n");
}

const MANUAL_STEPS = [
  {
    key: "modeloEscolhido", title: "1. Modelo mental escolhido",
    build: ctx => ({
      system: `Você analisa briefings de projeto e escolhe, entre os modelos mentais abaixo, o que melhor se aplica ao caso. Responda com o nome do modelo escolhido e 2-3 frases explicando por quê.\n\nModelos mentais disponíveis:\n${MODELOS_MENTAIS}`,
      user: ctx.briefingText,
    }),
  },
  {
    key: "caminhos", title: "2. Caminhos estratégicos",
    build: ctx => ({
      system: "Você é um estrategista de projeto. A partir do briefing e do modelo mental escolhido, gere de 3 a 5 caminhos estratégicos distintos e viáveis. Para cada caminho, dê um nome curto e 2-3 frases de justificativa.",
      user: `Briefing:\n${ctx.briefingText}\n\nModelo mental escolhido:\n${ctx.modeloEscolhido}`,
    }),
  },
  {
    key: "autocritica", title: "3. Autocrítica dos caminhos",
    build: ctx => ({
      system: "Você é um crítico exigente. Avalie os caminhos estratégicos abaixo: aponte fraquezas, riscos e sobreposições. Diga quais caminhos são fracos e por quê.",
      user: ctx.caminhos,
    }),
  },
  {
    key: "caminhoFinal", title: "4. Caminho final refinado",
    build: ctx => ({
      system: "Com base nos caminhos propostos e na autocrítica recebida, escolha o melhor caminho (ou combine elementos de mais de um) e descreva-o de forma refinada e acionável, em um parágrafo.",
      user: `Caminhos:\n${ctx.caminhos}\n\nAutocrítica:\n${ctx.autocritica}`,
    }),
  },
  {
    key: "persona", title: "5. Persona de redação",
    build: ctx => ({
      system: `Crie uma persona de redator(a): tom de voz, vocabulário típico e o que evitar, para escrever os textos deste projeto. Baseie-se no caminho estratégico escolhido. Siga rigorosamente estas regras de estilo (vícios de linguagem de IA a evitar):\n${VICIOS_IA}`,
      user: ctx.caminhoFinal,
    }),
  },
  {
    key: "referenciasVisuais", title: "6. Referências visuais",
    build: ctx => ({
      system: "Você é um diretor de arte. A partir do briefing e do caminho estratégico escolhido, proponha referências visuais (estilos, paletas, texturas, exemplos de mercado) e explique como a equipe de design poderia usar essas referências.",
      user: `Briefing:\n${ctx.briefingText}\n\nCaminho estratégico:\n${ctx.caminhoFinal}`,
    }),
  },
  {
    key: "promptImagem", title: "7. Prompt de imagem",
    build: ctx => ({
      system: "Escreva um prompt pronto para gerar uma imagem em uma ferramenta de IA (ex: Midjourney, DALL-E, Nano Banana), em inglês, detalhado e específico, com base nas referências visuais abaixo. Também escreva 1-2 frases em português explicando a intenção da imagem.",
      user: ctx.referenciasVisuais,
    }),
  },
];

function manualDraftKey(id) { return `manualDraft:${id}`; }
function loadManualDraft(id) {
  try { return JSON.parse(localStorage.getItem(manualDraftKey(id))) || {}; } catch { return {}; }
}
function saveManualDraft(id, draft) { localStorage.setItem(manualDraftKey(id), JSON.stringify(draft)); }
function clearManualDraft(id) { localStorage.removeItem(manualDraftKey(id)); }

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

function nl2br(value) { return escapeHtml(value).replace(/\n/g, "<br>"); }

function slugify(value) {
  return String(value || "briefing")
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function getClient() {
  if (client) return client;
  if (!window.SUPABASE_URL || window.SUPABASE_URL.includes("SEU-PROJETO")) {
    $("loginError").textContent = "Configure supabase-config.js com os dados do seu projeto.";
    return null;
  }
  client = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
  return client;
}

async function login() {
  const supabase = getClient();
  if (!supabase) return;
  $("loginError").textContent = "";
  const { error } = await supabase.auth.signInWithPassword({
    email: $("loginEmail").value.trim(),
    password: $("loginPassword").value,
  });
  if (error) { $("loginError").textContent = "E-mail ou senha inválidos."; return; }
  showHub();
}

async function logout() {
  await client.auth.signOut();
  location.reload();
}

const STATUS_LABELS = { recebido: "Recebido", processando: "Processando", pronto: "Pronto", erro: "Erro" };

function renderList() {
  $("briefingList").innerHTML = briefings.map(b => `
    <button class="briefing-item ${b.id === activeId ? "active" : ""}" data-id="${b.id}">
      <small>${new Date(b.created_at).toLocaleString("pt-BR")}</small>
      <strong>${escapeHtml(b.client_name || "Briefing sem nome")}</strong>
      <span class="status-badge status-${b.status}">${STATUS_LABELS[b.status] || b.status}</span>
    </button>
  `).join("") || `<p class="empty-state">Nenhum briefing recebido ainda.</p>`;
  document.querySelectorAll(".briefing-item").forEach(el => el.addEventListener("click", () => {
    activeId = el.dataset.id;
    renderList();
    renderDetail();
  }));
}

function buildMarkdown(b) {
  const lines = [];
  lines.push(`# Briefing: ${b.client_name || "Sem nome"}`);
  lines.push(`_Recebido em ${new Date(b.created_at).toLocaleString("pt-BR")}, status: ${STATUS_LABELS[b.status] || b.status}_`);
  lines.push("");
  lines.push("## Respostas do briefing");
  lines.push("");
  Object.entries(b.answers || {}).forEach(([q, a]) => {
    lines.push(`**${q}**`);
    lines.push(String(a));
    lines.push("");
  });
  if (b.status === "pronto" && b.result) {
    RESULT_SECTIONS.forEach(([key, title]) => {
      const content = b.result[key];
      if (!content) return;
      lines.push(`## ${title}`);
      lines.push("");
      lines.push(String(content));
      lines.push("");
    });
  } else if (b.status === "erro") {
    lines.push("## Erro no processamento");
    lines.push("");
    lines.push(String(b.error || ""));
  }
  return lines.join("\n").trim() + "\n";
}

function downloadFile(filename, content, mime) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

async function copyText(text, label) {
  try {
    await navigator.clipboard.writeText(text);
    toast(label ? `${label} copiado` : "Copiado");
  } catch {
    toast("Não foi possível copiar");
  }
}

function exportMarkdown() {
  const b = briefings.find(x => x.id === activeId);
  if (!b) return;
  downloadFile(`briefing-${slugify(b.client_name) || b.id.slice(0, 8)}.md`, buildMarkdown(b), "text/markdown");
  toast("Markdown exportado");
}

function copyMarkdown() {
  const b = briefings.find(x => x.id === activeId);
  if (!b) return;
  copyText(buildMarkdown(b), "Markdown");
}

function buildPrintHtml(b) {
  const answersHtml = Object.entries(b.answers || {}).map(([q, a]) => `
    <div class="print-qa"><strong>${escapeHtml(q)}</strong><p>${nl2br(a)}</p></div>
  `).join("");

  let resultHtml = "";
  if (b.status === "pronto" && b.result) {
    resultHtml = RESULT_SECTIONS
      .filter(([key]) => b.result[key])
      .map(([key, title]) => `<div class="print-section"><h2>${title}</h2><p>${nl2br(b.result[key])}</p></div>`)
      .join("");
  }

  return `
    <header class="print-header">
      <img src="logo-dispo.svg" alt="Dispo">
      <div>
        <p class="print-eyebrow">Briefing de marca</p>
        <h1>${escapeHtml(b.client_name || "Sem nome")}</h1>
        <p class="print-meta">${new Date(b.created_at).toLocaleString("pt-BR")}</p>
      </div>
    </header>
    <section class="print-block">
      <p class="print-block-title">Respostas do briefing</p>
      ${answersHtml}
    </section>
    ${resultHtml}
  `;
}

function exportPdf() {
  const b = briefings.find(x => x.id === activeId);
  if (!b) return;
  $("printArea").innerHTML = buildPrintHtml(b);
  window.print();
}

function sectionBlock(title, content, index) {
  copyTargets[index] = content;
  return `
    <div class="detail-section">
      <div class="detail-section-head">
        <h3>${title}</h3>
        <button class="copy-button" type="button" data-copy-index="${index}">Copiar</button>
      </div>
      <p class="section-text">${nl2br(content)}</p>
    </div>
  `;
}

function renderManualWizard(b) {
  const draft = loadManualDraft(b.id);
  const values = draft.values || {};
  const briefingText = formatBriefingText(b.answers);
  const ctx = { briefingText, ...values };
  const stepIndex = MANUAL_STEPS.findIndex(s => !values[s.key]);
  const doneCount = MANUAL_STEPS.length - (stepIndex === -1 ? 0 : MANUAL_STEPS.length - stepIndex);
  const doneList = MANUAL_STEPS.filter(s => values[s.key])
    .map(s => `<li><strong>${s.title}</strong> — resposta colada</li>`).join("");

  let bodyHtml;
  if (stepIndex === -1) {
    bodyHtml = `
      <p class="manual-hint">Todos os passos foram preenchidos. Salve para gravar esse resultado no briefing, do mesmo jeito que o processamento automático faria.</p>
      <div class="manual-actions">
        <button class="ghost-button" id="manualSaveButton" type="button">Salvar resultado no briefing</button>
        <button class="text-button" id="manualBackButton" type="button">Refazer último passo</button>
      </div>
    `;
  } else {
    const step = MANUAL_STEPS[stepIndex];
    const { system, user } = step.build(ctx);
    const fullPrompt = `${system}\n\n---\n\n${user}`;
    const copyIndex = copyTargets.length;
    copyTargets[copyIndex] = fullPrompt;
    bodyHtml = `
      <p class="manual-hint">Copie o prompt abaixo, cole no seu GPT, e cole a resposta dele no campo abaixo.</p>
      <div class="manual-prompt-box"><p class="manual-prompt-text">${nl2br(fullPrompt)}</p></div>
      <div class="manual-actions">
        <button class="copy-button" type="button" data-copy-index="${copyIndex}">Copiar prompt</button>
        ${stepIndex > 0 ? `<button class="text-button" id="manualBackButton" type="button">Voltar ao passo anterior</button>` : ""}
      </div>
      <label class="manual-response-label">Resposta do GPT
        <textarea id="manualResponseInput" rows="6" placeholder="Cole aqui a resposta..."></textarea>
      </label>
      <div class="manual-actions">
        <button class="ghost-button" id="manualNextButton" type="button">Salvar resposta e gerar próximo prompt</button>
      </div>
    `;
  }

  return `
    <div class="detail-section manual-wizard">
      <div class="detail-section-head">
        <h3>Gerar manualmente (sem IA automática)</h3>
        <span class="manual-progress">${doneCount} / ${MANUAL_STEPS.length}</span>
      </div>
      ${doneList ? `<ul class="manual-done-list">${doneList}</ul>` : ""}
      ${bodyHtml}
    </div>
  `;
}

function manualSaveStep(id) {
  const draft = loadManualDraft(id);
  const values = draft.values || {};
  const stepIndex = MANUAL_STEPS.findIndex(s => !values[s.key]);
  if (stepIndex === -1) return;
  const response = $("manualResponseInput").value.trim();
  if (!response) { toast("Cole a resposta antes de continuar"); return; }
  values[MANUAL_STEPS[stepIndex].key] = response;
  saveManualDraft(id, { values });
  renderDetail();
}

function manualGoBack(id) {
  const draft = loadManualDraft(id);
  const values = draft.values || {};
  for (let i = MANUAL_STEPS.length - 1; i >= 0; i--) {
    if (values[MANUAL_STEPS[i].key]) { delete values[MANUAL_STEPS[i].key]; break; }
  }
  saveManualDraft(id, { values });
  renderDetail();
}

async function manualSaveResult(id) {
  const draft = loadManualDraft(id);
  const values = draft.values || {};
  const result = {};
  MANUAL_STEPS.forEach(s => { if (values[s.key]) result[s.key] = values[s.key]; });
  const { error } = await client.from("briefings").update({ status: "pronto", result, error: null }).eq("id", id);
  if (error) { toast("Erro ao salvar resultado"); return; }
  clearManualDraft(id);
  toast("Resultado salvo no briefing");
  await loadBriefings();
}

function renderDetail() {
  const b = briefings.find(x => x.id === activeId);
  const detail = $("briefingDetail");
  if (!b) { detail.innerHTML = `<p class="empty-state">Selecione um briefing na lista ao lado.</p>`; return; }

  copyTargets = [];
  const answersEntries = Object.entries(b.answers || {});
  const answersText = answersEntries.map(([q, a]) => `${q}\n${a}`).join("\n\n");
  const answersHtml = `<div class="answers-grid">${answersEntries.map(([q, a]) => `
    <div class="qa"><strong>${escapeHtml(q)}</strong><span>${escapeHtml(a)}</span></div>
  `).join("")}</div>`;

  let resultHtml = "";
  if (b.status === "processando") resultHtml = `<p class="empty-state">Processando com IA...</p>`;
  else if (b.status === "erro") resultHtml = `<p class="empty-state">Erro no processamento: ${escapeHtml(b.error || "")}</p>`;
  else if (b.status === "pronto" && b.result) {
    resultHtml = RESULT_SECTIONS
      .filter(([key]) => b.result[key])
      .map(([key, title], i) => sectionBlock(title, b.result[key], i + 1))
      .join("");
  }
  const manualHtml = b.status === "pronto" ? "" : renderManualWizard(b);

  detail.innerHTML = `
    <div class="detail-header">
      <div>
        <p class="eyebrow">${new Date(b.created_at).toLocaleString("pt-BR")}</p>
        <h2>${escapeHtml(b.client_name || "Briefing sem nome")}</h2>
        <p class="detail-meta"><span class="status-badge status-${b.status}">${STATUS_LABELS[b.status] || b.status}</span></p>
      </div>
      <div class="detail-toolbar">
        <button class="ghost-button" id="copyMarkdownButton" type="button">Copiar Markdown</button>
        <button class="ghost-button" id="exportMarkdownButton" type="button">Baixar .md</button>
        <button class="ghost-button" id="exportPdfButton" type="button">Exportar PDF</button>
      </div>
    </div>
    <div class="detail-section">
      <div class="detail-section-head">
        <h3>Respostas do briefing</h3>
        <button class="copy-button" type="button" data-copy-index="0">Copiar</button>
      </div>
      ${answersHtml}
    </div>
    ${resultHtml}
    ${manualHtml}
  `;
  copyTargets[0] = answersText;

  $("copyMarkdownButton").addEventListener("click", copyMarkdown);
  $("exportMarkdownButton").addEventListener("click", exportMarkdown);
  $("exportPdfButton").addEventListener("click", exportPdf);
  detail.querySelectorAll("[data-copy-index]").forEach(btn => {
    btn.addEventListener("click", () => copyText(copyTargets[Number(btn.dataset.copyIndex)] || ""));
  });
  const manualNextButton = $("manualNextButton");
  if (manualNextButton) manualNextButton.addEventListener("click", () => manualSaveStep(b.id));
  const manualBackButton = $("manualBackButton");
  if (manualBackButton) manualBackButton.addEventListener("click", () => manualGoBack(b.id));
  const manualSaveButton = $("manualSaveButton");
  if (manualSaveButton) manualSaveButton.addEventListener("click", () => manualSaveResult(b.id));
}

function parseBriefingMarkdown(text) {
  const titleMatch = text.match(/^#\s*Briefing:\s*(.+)$/m);
  const clientName = titleMatch ? titleMatch[1].trim() : null;
  const sectionMatch = text.match(/##\s*Respostas do briefing\s*\n([\s\S]*?)(?:\n##\s|$)/);
  const answers = {};
  if (sectionMatch) {
    const entries = sectionMatch[1].trim().split(/\n(?=\*\*.+?\*\*\s*\n)/);
    entries.forEach(entry => {
      const m = entry.match(/^\*\*(.+?)\*\*\s*\n([\s\S]*)$/);
      if (!m) return;
      const question = m[1].trim();
      const answer = m[2].trim();
      if (question && answer) answers[question] = answer;
    });
  }
  return { clientName: clientName && clientName !== "Sem nome" ? clientName : null, answers };
}

async function importMarkdownFile(file) {
  const text = await file.text();
  const { clientName, answers } = parseBriefingMarkdown(text);
  if (!Object.keys(answers).length) { toast("Não foi possível ler respostas do arquivo"); return; }
  const { error } = await client.from("briefings").insert({ answers, client_name: clientName });
  if (error) { toast("Erro ao importar briefing"); return; }
  toast("Briefing importado");
}

async function loadBriefings() {
  const { data, error } = await client.from("briefings").select("*").order("created_at", { ascending: false });
  if (error) return;
  briefings = data;
  if (!activeId && briefings[0]) activeId = briefings[0].id;
  renderList();
  renderDetail();
}

function subscribeRealtime() {
  channel = client
    .channel("briefings-changes")
    .on("postgres_changes", { event: "*", schema: "public", table: "briefings" }, loadBriefings)
    .subscribe();
}

async function showHub() {
  document.body.dataset.view = "hub";
  $("loginScreen").style.display = "none";
  $("hubScreen").style.display = "block";
  await loadBriefings();
  subscribeRealtime();
}

function toast(message) {
  $("toast").textContent = message;
  $("toast").classList.add("show");
  clearTimeout(toast._t);
  toast._t = setTimeout(() => $("toast").classList.remove("show"), 1800);
}

(async function init() {
  const supabase = getClient();
  if (!supabase) return;
  const { data: { session } } = await supabase.auth.getSession();
  if (session) showHub();
})();

$("loginButton").addEventListener("click", login);
$("loginPassword").addEventListener("keydown", e => { if (e.key === "Enter") login(); });
$("logoutButton").addEventListener("click", logout);
$("importButton").addEventListener("click", () => $("importFileInput").click());
$("importFileInput").addEventListener("change", async () => {
  const file = $("importFileInput").files[0];
  if (file) await importMarkdownFile(file);
  $("importFileInput").value = "";
});
