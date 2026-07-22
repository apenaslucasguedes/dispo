const $ = id => document.getElementById(id);
let client;
let briefings = [];
let activeId = null;
let activeProvider = "native";
let channel;
let copyTargets = [];
let libraryMarkdown = "";      // Biblioteca Estratégica em Markdown, pronta pra colar
let libraryMeta = { count: 0, version: "—" };
let answersModalText = "";      // texto plano das respostas, pro botão "Copiar" do modal
const openSteps = new Set();    // etapas expandidas no painel (por stepKey)

const ICON_EDIT = `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M13.5 3.5l3 3L6 17H3v-3L13.5 3.5z"/></svg>`;
const ICON_DELETE = `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6h12M8 6V4h4v2M6 6l1 10h6l1-10"/></svg>`;
const ICON_CHEVRON = `<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 4.5L6 8l3.5-3.5"/></svg>`;
const ICON_CHECK = `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8.3l3.3 3.3L13 4.5"/></svg>`;
const ICON_FLAG = `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 14V2"/><path d="M4 3h8l-2 3 2 3H4"/></svg>`;
const ICON_REJECT = `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4l8 8M12 4l-8 8"/></svg>`;
const ICON_SKIP = `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v10"/><path d="M6.3 8l6-4.3v8.6z"/></svg>`;
const ICON_DRAFT = `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="8" cy="8" r="5.8" stroke-dasharray="2.4 2.6"/></svg>`;
const ICON_COPY = `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="5.5" y="5.5" width="8" height="8" rx="1.5"/><path d="M10.5 5.5V4a1.5 1.5 0 0 0-1.5-1.5H4A1.5 1.5 0 0 0 2.5 4v5A1.5 1.5 0 0 0 4 10.5h1.5"/></svg>`;
const ICON_DUPLICATE = `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="7" y="7" width="9" height="9" rx="2"/><path d="M13 7V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/></svg>`;

// Ícones das IAs de estratégia (toggle no card, sem texto)
const ICON_AI_CLAUDE = `<svg viewBox="0 0 20 20" fill="currentColor"><path d="M10 1.2l1.35 5.05L15.1 2.5l-2.05 4.55L18.8 5l-4.05 3.9 5.25 1.1-5.25 1.1L18.8 15l-5.75-1.55L15.1 18l-3.75-3.75L10 19.8l-1.35-5.55L4.9 18l2.05-4.55L1.2 15l4.05-3.9L0 10l5.25-1.1L1.2 5l5.75 2.05L4.9 2.5l3.75 3.75z"/></svg>`;
const ICON_AI_GPT = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><ellipse cx="12" cy="12" rx="10" ry="4"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(120 12 12)"/></svg>`;

// IAs de estratégia (uma por briefing) e ferramentas de imagem (uma por unidade)
const STRATEGY_AIS = [
  { id: "claude", label: "Claude", icon: ICON_AI_CLAUDE },
  { id: "gpt",    label: "GPT",    icon: ICON_AI_GPT },
];
const IMAGE_TOOLS = [
  { id: "gpt",        label: "GPT",       color: "#10a37f", mono: "G" },
  { id: "gemini",     label: "Gemini",    color: "#4285f4", mono: "◆" },
  { id: "midjourney", label: "MidJourney", color: "#111111", mono: "MJ" },
  { id: "flux",       label: "Flux",      color: "#7c3aed", mono: "Fx" },
  { id: "leonardo",   label: "Leonardo",  color: "#f59e0b", mono: "L" },
  { id: "sd",         label: "SD / Dream", color: "#e11d6b", mono: "SD" },
];

// ---------------------------------------------------------------------------
// Estados de aprovação por etapa (documento, seção 4.6)
// ---------------------------------------------------------------------------
const STEP_STATES = {
  pendente:    { label: "Pendente",     hint: "Ainda não começou" },
  em_execucao: { label: "Em execução",  hint: "Prompt copiado ou em andamento" },
  rascunho:    { label: "Rascunho",     hint: "Resposta colada, não aprovada" },
  aprovado:    { label: "Aprovado",     hint: "Pode alimentar a próxima etapa" },
  revisar:     { label: "Revisar",      hint: "Precisa de ajuste antes de avançar" },
  rejeitado:   { label: "Rejeitado",    hint: "Não deve ser usado" },
  pulada:      { label: "Pulada",       hint: "Etapa omitida com justificativa" },
  erro:        { label: "Erro",         hint: "Falha ou saída inutilizável" },
};

const CONVERSAS = {
  estrategica: "Conversa Estratégica",
  transicao:   "Transição",
  visual:      "Conversa Visual",
  painel:      "Painel",
};

// ---------------------------------------------------------------------------
// PIPELINE — 16 etapas como artefatos aprováveis (documento, seções 2 e 3)
// Cada etapa gera um prompt de 5 blocos (Papel, Tarefa, Contexto, Critérios,
// Saída — seção 4.1). `inputs` define o CONTEXTO ENXUTO: só os artefatos
// aprovados necessários entram, nunca o briefing bruto repetido (regra 4.8).
// ---------------------------------------------------------------------------
const PIPELINE = [
  {
    key: "briefMestre", num: 2, conversa: "estrategica",
    title: "Brief Mestre",
    objetivo: "Normalizar o briefing bruto numa cápsula-base curta e confiável.",
    papel: "Você organiza briefings de marca sem criar estratégia ainda.",
    tarefa: "Transforme o briefing bruto abaixo em um Brief Mestre limpo, separando fato, inferência e dúvida.",
    inputs: ["briefingBruto"],
    criterios: [
      "Separe fatos confirmados, inferências úteis e lacunas de informação.",
      "Não invente dado nem resolva o projeto visualmente.",
      "Linguagem limpa, leitura rápida.",
      "Sirva como fonte principal das próximas etapas.",
    ],
    formato: `# Brief Mestre

## Marca / projeto
## Situação do projeto
## O que precisa nascer ou mudar
## Público principal
## Público secundário
## Problema real percebido
## Objetivo da identidade
## Aplicações prioritárias
## Sinais desejados
## Sinais proibidos
## Referências citadas
## Restrições práticas
## Fatos confirmados
## Inferências úteis
## Lacunas de informação
## Critérios iniciais de aprovação`,
  },
  {
    key: "ferramenta", num: 3, conversa: "estrategica",
    title: "Seleção da ferramenta estratégica",
    objetivo: "Escolher a ferramenta mais útil da Biblioteca Estratégica para o caso.",
    papel: "Você atua como estrategista de marca e escolhe a ferramenta de análise mais útil para este projeto.",
    tarefa: "Analise o Brief Mestre e a Biblioteca Estratégica. Escolha uma ferramenta principal e, se necessário, até duas auxiliares.",
    inputs: ["briefMestre"],
    needsLibrary: true,
    criterios: [
      "Não escolha por familiaridade; escolha por aderência ao problema real.",
      "Use a biblioteca como repertório, não como lista obrigatória.",
      "Cite o nome exato da ferramenta como está na biblioteca.",
      "Explique por que outras opções fortes foram descartadas.",
      "Marque qualquer incerteza.",
    ],
    formato: `# Ferramenta Estratégica Escolhida

## Ferramenta principal
## Por que esta ferramenta serve para o caso
## O que ela ajuda a revelar
## Ferramentas auxiliares, se houver
## Ferramentas fortes descartadas
## Risco de usar a ferramenta errada
## Como esta escolha orienta as próximas etapas`,
  },
  {
    key: "pesquisa", num: 4, conversa: "estrategica",
    title: "Pesquisa contextual",
    objetivo: "Acrescentar contexto externo útil sem virar volume morto.",
    papel: "Você é um pesquisador de categoria e cultura de marca.",
    tarefa: "Organize repertório sobre categoria, concorrência, códigos, riscos e oportunidades para este projeto.",
    inputs: ["briefMestre", "ferramenta"],
    criterios: [
      "A pesquisa muda ou confirma alguma decisão.",
      "Diferencie fato, inferência e opinião.",
      "Não vire moodboard genérico.",
      "Registre fonte e data quando houver dado externo.",
      "Aponte riscos práticos para estratégia e criação.",
    ],
    formato: `# Pesquisa Contextual

## Categoria e contexto
## Códigos comuns da categoria
## Códigos saturados ou perigosos
## Oportunidades de diferenciação
## Referências úteis e como usar
## Referências perigosas e por que evitar
## Hipóteses para testar na estratégia
## Fontes consultadas
## Incertezas`,
  },
  {
    key: "diagnostico", num: 5, conversa: "estrategica",
    title: "Diagnóstico estratégico",
    objetivo: "Identificar o problema de marca que a identidade precisa resolver.",
    papel: "Você é um estrategista que usa a ferramenta escolhida para diagnosticar a marca.",
    tarefa: "Formule o diagnóstico estratégico: job central, tensão, oportunidade e critério de reprovação.",
    inputs: ["briefMestre", "ferramenta", "pesquisa"],
    criterios: [
      "Explique por que a marca precisa de identidade.",
      "Não repita o briefing; revele uma tensão clara.",
      "Oriente decisão.",
      "Permita reprovar soluções bonitas mas estrategicamente erradas.",
    ],
    formato: `# Diagnóstico Estratégico

## Problema real
## Job central da marca
## Tensão principal
## Oportunidade estratégica
## Percepção desejada
## Percepção proibida
## Papel da identidade visual
## Critério de reprovação`,
  },
  {
    key: "caminhos", num: 6, conversa: "estrategica",
    title: "Caminhos estratégicos",
    objetivo: "Explorar rotas possíveis antes de escolher a direção final.",
    papel: "Você é um estrategista criativo que abre rotas distintas.",
    tarefa: "Proponha de 3 a 5 caminhos estratégicos realmente diferentes, cada um comparável.",
    inputs: ["diagnostico", "briefMestre", "ferramenta", "pesquisa"],
    criterios: [
      "Os caminhos são realmente diferentes, não variações estéticas.",
      "Cada um tem consequência verbal e visual.",
      "Os riscos estão claros.",
      "Há base para decisão humana.",
    ],
    formato: `# Caminhos Estratégicos

## Caminho 1: Nome
### Tese
### Promessa
### Provas possíveis
### Tom verbal
### Potencial visual
### Risco
### Quando escolher este caminho

(repita o bloco para cada caminho, de 3 a 5 no total)`,
  },
  {
    key: "autocritica", num: 7, conversa: "estrategica",
    title: "Autocrítica e decisão",
    objetivo: "Avaliar os caminhos, evitar escolha fraca e definir a direção final.",
    papel: "Você é um crítico exigente que evita escolhas fracas.",
    tarefa: "Critique cada caminho com rigor e recomende um caminho ou combinação, com renúncia clara.",
    inputs: ["caminhos", "diagnostico", "briefMestre", "pesquisa"],
    criterios: [
      "A decisão tem renúncia clara; não escolhe tudo ao mesmo tempo.",
      "Explica por que o caminho vence.",
      "Aponta risco de execução, clichê e desalinhamento.",
      "Registra o que não deve voltar nas próximas etapas.",
    ],
    formato: `# Autocrítica e Decisão

## Avaliação dos caminhos
## Caminho recomendado
## Por que ele vence
## O que deve ser ajustado
## O que foi descartado
## Riscos que permanecem
## Decisão final aprovada`,
  },
  {
    key: "memo", num: 8, conversa: "estrategica",
    title: "Memo de Decisão",
    objetivo: "Consolidar a direção escolhida num documento pequeno e acionável.",
    papel: "Você consolida decisões estratégicas em documentos estáveis.",
    tarefa: "Transforme o caminho escolhido em um Memo de Decisão com tese, promessa, provas e não-caminhos.",
    inputs: ["autocritica", "diagnostico", "briefMestre", "pesquisa"],
    criterios: [
      "Substitui o briefing bruto como referência de decisão.",
      "Tem tese clara e registra renúncias.",
      "Curto o bastante para usar em prompts seguintes.",
      "Não abre novas rotas desnecessárias.",
    ],
    formato: `# Memo de Decisão

## Tese estratégica
## Promessa central
## Provas que sustentam a promessa
## O que a marca precisa fazer sentir
## O que a marca não pode parecer
## Território verbal
## Território visual inicial
## Não-caminhos
## Riscos de execução
## Critério final de aprovação estratégica`,
  },
  {
    key: "sistemaVerbal", num: 9, conversa: "estrategica",
    title: "Sistema Verbal",
    objetivo: "Definir como a marca fala e escreve antes da criação visual.",
    papel: "Você é um redator-diretor que define voz de marca.",
    tarefa: "Crie um guia verbal prático com tom, vocabulário, ritmo, exemplos e anti-exemplos.",
    inputs: ["memo", "briefMestre"],
    criterios: [
      "Permite escrever textos reais e evita vícios de IA.",
      "Mantém a estratégia reconhecível.",
      "Não vira manifesto abstrato.",
      "Tem exemplos para naming, textos curtos e microcopy.",
    ],
    formato: `# Sistema Verbal

## Persona de redação
## Tom de voz
## Ritmo de frase
## Vocabulário preferido
## Vocabulário a evitar
## Estruturas de frase recomendadas
## Frases exemplo
## Anti-exemplos
## Checklist de revisão textual`,
  },
  {
    key: "criteriosCriativos", num: 10, conversa: "estrategica",
    title: "Critérios Criativos",
    objetivo: "Criar a ponte objetiva entre estratégia, texto e design.",
    papel: "Você traduz estratégia em critérios objetivos de criação.",
    tarefa: "Defina critérios criativos: sinais permitidos/proibidos, contraste, densidade, maturidade e régua de aprovação.",
    inputs: ["memo", "sistemaVerbal", "pesquisa"],
    criterios: [
      "Não gera logo, cor ou mockup; define como julgá-los.",
      "Reduz subjetividade.",
      "Cria uma régua de aprovação visual e verbal.",
    ],
    formato: `# Critérios Criativos

## Função da identidade
## Princípios de criação
## Sinais visuais permitidos
## Sinais visuais proibidos
## Sinais verbais permitidos
## Sinais verbais proibidos
## Aplicações que precisam funcionar primeiro
## Régua de aprovação
## Riscos criativos`,
  },
  {
    key: "sistemaVisual", num: 11, conversa: "estrategica",
    title: "Sistema Visual Direcional",
    objetivo: "Definir a direção visual escrita antes de gerar qualquer imagem.",
    papel: "Você é um diretor de arte que descreve a direção visual em texto.",
    tarefa: "Organize a direção visual em blocos separados (forma, tipografia, cor, composição, grafismo, etc.).",
    inputs: ["criteriosCriativos", "memo", "sistemaVerbal", "pesquisa"],
    criterios: [
      "Específico sem virar prompt gigante.",
      "Não depende de mockup para parecer bom.",
      "Separa unidades visuais e explica como cada uma sustenta a estratégia.",
      "Prepara a conversa visual.",
    ],
    formato: `# Sistema Visual Direcional

## Princípio visual central
## Linguagem de forma
## Tipografia
## Cor
## Materialidade e textura
## Composição e respiro
## Grafismos e símbolos
## Fotografia ou ilustração
## Aplicações prioritárias
## O que evitar
## Critérios para prompts visuais`,
  },
  {
    key: "handoff", num: 12, conversa: "transicao",
    title: "Handoff Visual",
    objetivo: "Criar o pacote enxuto que vai para a conversa visual.",
    papel: "Você condensa decisões aprovadas em uma ficha de contexto enxuta.",
    tarefa: "Condense os artefatos aprovados em um Handoff Visual, removendo ruído e informação não decidida.",
    inputs: ["briefMestre", "memo", "sistemaVerbal", "criteriosCriativos", "sistemaVisual"],
    criterios: [
      "Permite começar a conversa visual sem o briefing bruto.",
      "Contém apenas decisões aprovadas.",
      "Tamanho gerenciável.",
      "Deixa claro que as próximas etapas são unitárias.",
    ],
    formato: `# Handoff Visual

Use este conteúdo como contexto aprovado. Não volte ao briefing bruto.

## Marca / projeto
## Tese estratégica aprovada
## Promessa central
## Público e percepção desejada
## O que não pode parecer
## Tom verbal aprovado
## Critérios criativos
## Direção visual aprovada
## Aplicações prioritárias

## Regras para geração visual
- Gerar uma unidade por vez.
- Não misturar logo, mockup, fotografia e aplicação no mesmo prompt.
- Começar pelo positivo e usar NEGATIVE apenas como guarda-corpo.`,
  },
  // Etapa 13 (Exploração Visual Unitária) é tratada num bloco próprio (unidades).
  {
    key: "convergencia", num: 14, conversa: "visual",
    title: "Convergência do Sistema",
    objetivo: "Unir as unidades visuais aprovadas em uma identidade coerente.",
    papel: "Você é um diretor de arte que unifica um sistema visual.",
    tarefa: "Compare as unidades aprovadas, resolva conflitos e proponha hierarquia de uso.",
    inputs: ["handoff", "visualUnitsResumo"],
    criterios: [
      "O resultado parece uma marca, não uma coleção de imagens boas.",
      "As unidades se reforçam e há hierarquia.",
      "Conflitos estão resolvidos ou marcados.",
      "O sistema pode virar apresentação, manual ou refinamento.",
    ],
    formato: `# Convergência do Sistema

## Princípio unificador
## Elementos aprovados
## Como os elementos se combinam
## Hierarquia de uso
## Conflitos encontrados
## Ajustes necessários
## Aplicações prioritárias para teste
## Pendências antes da apresentação`,
  },
];

const STEP_BY_KEY = Object.fromEntries(PIPELINE.map(s => [s.key, s]));

// Unidades visuais recomendadas (documento, etapa 13)
const VISUAL_UNITS = {
  logo:        { label: "Logo",        ask: "Apenas logo, símbolo ou wordmark em fundo limpo", block: "mockup, embalagem, fachada, objeto, fotografia" },
  tipografia:  { label: "Tipografia",  ask: "Hierarquia tipográfica e exemplos de texto",       block: "mockup, cena, embalagem realista" },
  paleta:      { label: "Paleta",      ask: "Campos de cor, proporção e combinações",           block: "produto final, cena decorativa, excesso de textura" },
  grafismos:   { label: "Grafismos",   ask: "Sistema de linhas, marcas, selos, padrões e ícones", block: "ilustração dominante, mascote, ornamentação excessiva" },
  fotografia:  { label: "Fotografia",  ask: "Direção fotográfica ou moodboard de linguagem",     block: "logo, layout, composição publicitária final" },
  ilustracao:  { label: "Ilustração",  ask: "Estilo ilustrativo e linguagem de traço",          block: "mascote involuntário, excesso narrativo" },
  aplicacao:   { label: "Aplicação",   ask: "Um tipo de aplicação por vez",                     block: "sistema completo em uma tacada" },
  refinamento: { label: "Refinamento", ask: "Ajuste fino de uma unidade já aprovada",           block: "reabrir escopo já decidido" },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
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
function formatBriefingText(answers) {
  return Object.entries(answers || {}).map(([q, a]) => `P: ${q}\nR: ${a}`).join("\n\n");
}
function nowIso() { return new Date().toISOString(); }

// Ordem linear das etapas colapsáveis (para "concluir e abrir a próxima")
const ORDERED_STEP_KEYS = PIPELINE.map(s => s.key);
function openNextStep(key) {
  openSteps.delete(key);
  const i = ORDERED_STEP_KEYS.indexOf(key);
  const next = ORDERED_STEP_KEYS[i + 1];
  if (next) openSteps.add(next);
}

// --- Tooltip flutuante (fixed no body, imune a overflow/clip dos containers) --
let tipEl;
function ensureTip() {
  if (!tipEl) { tipEl = document.createElement("div"); tipEl.className = "tip-float"; document.body.appendChild(tipEl); }
  return tipEl;
}
function showTip(el) {
  const tip = ensureTip();
  tip.textContent = el.getAttribute("data-tooltip");
  tip.classList.add("show");
  const r = el.getBoundingClientRect();
  const tr = tip.getBoundingClientRect();
  let top = r.top - tr.height - 8;
  if (top < 6) top = r.bottom + 8;                       // sem espaço acima → abre abaixo
  let left = r.left + r.width / 2 - tr.width / 2;
  left = Math.max(6, Math.min(left, window.innerWidth - tr.width - 6));
  tip.style.top = `${Math.round(top)}px`;
  tip.style.left = `${Math.round(left)}px`;
}
function hideTip() { if (tipEl) tipEl.classList.remove("show"); }
document.addEventListener("mouseover", e => {
  const t = e.target.closest && e.target.closest("[data-tooltip]");
  if (t) showTip(t);
});
document.addEventListener("mouseout", e => {
  const t = e.target.closest && e.target.closest("[data-tooltip]");
  if (t) hideTip();
});
document.addEventListener("focusin", e => {
  const t = e.target.closest && e.target.closest("[data-tooltip]");
  if (t) showTip(t);
});
document.addEventListener("focusout", hideTip);
window.addEventListener("scroll", hideTip, true);

// --- Pipeline data (armazenado em briefings.result) -------------------------
function getPipeline(b) {
  const r = b && b.result;
  if (r && r.version === 2 && r.steps) return r;
  return { version: 2, steps: {}, visualUnits: [] };
}
function getStep(b, key) {
  const p = getPipeline(b);
  return p.steps[key] || { status: "pendente", response: "", notes: "" };
}

async function savePipeline(b, pipeline) {
  const anyStarted = Object.values(pipeline.steps).some(s => s.status && s.status !== "pendente");
  const dossieDone = pipeline.dossieFinalizado === true;
  const status = dossieDone ? "pronto" : (anyStarted ? "processando" : "recebido");
  const expectedUpdatedAt = (b.result && b.result.updatedAt) || "__absent__";
  const nativePipeline = { ...pipeline, updatedAt: nowIso() };
  delete nativePipeline.hermes;
  const { error } = await client.rpc("upsert_briefing_pipeline", {
    p_briefing_id: b.id,
    p_pipeline: nativePipeline,
    p_status: status,
    p_expected_updated_at: expectedUpdatedAt,
  });
  if (error) {
    toast(error.message && error.message.includes("concurrent update")
      ? "O briefing mudou em outra sessão. Recarregue antes de salvar."
      : "Erro ao salvar");
    return false;
  }
  return true;
}

// --- Construção do contexto e do prompt de 5 blocos -------------------------
function inputLabel(key, b) {
  if (key === "briefingBruto") return "Briefing bruto";
  if (key === "visualUnitsResumo") return "Unidades visuais aprovadas";
  const s = STEP_BY_KEY[key];
  return s ? s.title : key;
}
function inputContent(key, b) {
  if (key === "briefingBruto") return formatBriefingText(b.answers);
  if (key === "visualUnitsResumo") {
    const p = getPipeline(b);
    const approved = (p.visualUnits || []).filter(u => u.status === "aprovado");
    if (!approved.length) return "[⚠ nenhuma unidade visual aprovada ainda]";
    return approved.map(u => {
      const meta = VISUAL_UNITS[u.unitType] || { label: u.unitType };
      return `## ${meta.label}\nPrompt: ${u.promptClean || "—"}\nNEGATIVE: ${u.negative || "—"}\nAvaliação: ${u.notes || "—"}`;
    }).join("\n\n");
  }
  const st = getStep(b, key);
  if (st.status === "aprovado" && st.response) return st.response;
  if (st.response) return `[⚠ ainda não aprovado]\n${st.response}`;
  return `[⚠ ${STEP_BY_KEY[key] ? STEP_BY_KEY[key].title : key} ainda não aprovado]`;
}

// Cada "conversa" acontece num chat único de IA. Etapas da estratégia e a
// transição (Handoff) rodam no MESMO chat; a conversa visual é um chat novo.
// Regra 4.8: dentro do mesmo chat não repetimos artefatos já produzidos —
// só referenciamos. O conteúdo só é embutido quando cruza para outro chat.
const CHAT_OF_CONVERSA = { estrategica: "estrategico", transicao: "estrategico", visual: "visual" };
function chatOfStep(conversa) { return CHAT_OF_CONVERSA[conversa] || null; }
function chatOfInput(key) {
  if (key === "briefingBruto") return "externo";       // veio do formulário, não do chat
  if (key === "visualUnitsResumo") return "visual";
  const s = STEP_BY_KEY[key];
  return s ? chatOfStep(s.conversa) : "externo";
}

function buildPrompt(step, b) {
  const blocks = [];
  blocks.push(`Papel: ${step.papel}`);
  blocks.push(`Tarefa: ${step.tarefa}`);

  const curChat = chatOfStep(step.conversa);
  const contextParts = (step.inputs || []).map(k => {
    const label = inputLabel(k, b);
    // Mesmo chat: já está na conversa, não repetir — apenas referenciar.
    if (curChat && chatOfInput(k) === curChat) {
      return `## ${label}\n[Já produzido nesta conversa. Use a versão que você aprovou acima; não repita o conteúdo.]`;
    }
    return `## ${label}\n${inputContent(k, b)}`;
  });
  if (step.needsLibrary) {
    contextParts.push(`## Biblioteca Estratégica (${libraryMeta.count} ferramentas)\n${libraryMarkdown || "[⚠ biblioteca não carregada]"}`);
  }
  blocks.push(`Contexto:\n${contextParts.join("\n\n")}`);

  const crit = step.criterios.map((c, i) => `${i + 1}. ${c}`).join("\n");
  blocks.push(`Critérios:\n${crit}`);

  blocks.push(`Saída: entregue exatamente no formato abaixo:\n${step.formato}`);
  return blocks.join("\n\n");
}

// ---------------------------------------------------------------------------
// Supabase / auth
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// Biblioteca Estratégica (data/modelos-mentais.json → Markdown)
// ---------------------------------------------------------------------------
const LIBRARY_OVERRIDE_KEY = "strategicLibraryOverride";
async function loadLibrary() {
  const override = localStorage.getItem(LIBRARY_OVERRIDE_KEY);
  if (override) {
    libraryMarkdown = override;
    libraryMeta = { count: (override.match(/^- /gm) || []).length, version: "editada localmente" };
    return;
  }
  try {
    const res = await fetch("data/modelos-mentais.json");
    const data = await res.json();
    const byCat = {};
    data.forEach(m => { (byCat[m.categoria] = byCat[m.categoria] || []).push(m); });
    const lines = [`# Biblioteca Estratégica (${data.length} ferramentas)`, ""];
    Object.entries(byCat).forEach(([cat, items]) => {
      lines.push(`## ${cat}`);
      items.forEach(m => lines.push(`- **${m.nome}**${m.autor ? ` (${m.autor})` : ""}: ${m.descricao}`));
      lines.push("");
    });
    libraryMarkdown = lines.join("\n").trim();
    libraryMeta = { count: data.length, version: "padrão do repositório" };
  } catch {
    libraryMarkdown = "";
    libraryMeta = { count: 0, version: "não carregada" };
  }
}
function openLibraryModal() {
  const overlay = $("libraryModal");
  $("libraryMeta").textContent = `${libraryMeta.count} ferramentas · versão: ${libraryMeta.version}`;
  $("libraryTextarea").value = libraryMarkdown;
  overlay.classList.add("open");
}
function closeLibraryModal() { $("libraryModal").classList.remove("open"); }

// ---------------------------------------------------------------------------
// Modal de respostas do briefing (fechado por padrão, some com o resumo)
// ---------------------------------------------------------------------------
function openAnswersModal(b) {
  const entries = Object.entries(b.answers || {});
  answersModalText = entries.map(([q, a]) => `${q}\n${a}`).join("\n\n");
  $("answersModalMeta").textContent = `${entries.length} pergunta${entries.length === 1 ? "" : "s"} respondida${entries.length === 1 ? "" : "s"}`;
  $("answersModalBody").innerHTML = entries.length
    ? entries.map(([q, a]) => `<div class="qa"><strong>${escapeHtml(q)}</strong><span>${escapeHtml(a)}</span></div>`).join("")
    : `<p class="empty-state small">Nenhuma resposta registrada.</p>`;
  $("answersModal").classList.add("open");
}
function closeAnswersModal() { $("answersModal").classList.remove("open"); }
function saveLibraryEdit() {
  const val = $("libraryTextarea").value.trim();
  localStorage.setItem(LIBRARY_OVERRIDE_KEY, val);
  libraryMarkdown = val;
  libraryMeta = { count: (val.match(/^- /gm) || []).length, version: "editada localmente" };
  $("libraryMeta").textContent = `${libraryMeta.count} ferramentas · versão: ${libraryMeta.version}`;
  toast("Biblioteca salva");
}
async function resetLibrary() {
  localStorage.removeItem(LIBRARY_OVERRIDE_KEY);
  await loadLibrary();
  $("libraryTextarea").value = libraryMarkdown;
  $("libraryMeta").textContent = `${libraryMeta.count} ferramentas · versão: ${libraryMeta.version}`;
  toast("Biblioteca restaurada");
}

// ---------------------------------------------------------------------------
// Lista de briefings
// ---------------------------------------------------------------------------
const STATUS_LABELS = { recebido: "Recebido", processando: "Em andamento", pronto: "Pronto", erro: "Erro" };

function pipelineProgress(b) {
  const p = getPipeline(b);
  const total = PIPELINE.length;
  const done = PIPELINE.filter(s => (p.steps[s.key] || {}).status === "aprovado").length;
  return { done, total };
}

function renderList() {
  $("briefingList").innerHTML = briefings.map(b => {
    const pr = pipelineProgress(b);
    const activeAi = getPipeline(b).aiTool;
    const aiToggle = STRATEGY_AIS.map(a =>
      `<button class="ai-seg ${activeAi === a.id ? "on" : ""}" type="button" data-ai="${a.id}" data-ai-briefing="${b.id}" aria-label="Marcar ${a.label}" data-tooltip="Feito no ${a.label}">${a.icon}</button>`
    ).join("");
    const nativeCard = `
    <div class="briefing-item-wrap">
      <button class="briefing-item ${b.id === activeId && activeProvider === "native" ? "active" : ""}" data-id="${b.id}">
        <small>${new Date(b.created_at).toLocaleString("pt-BR")}</small>
        <strong>${escapeHtml(b.client_name || "Briefing sem nome")}</strong>
        <span class="status-row">
          <span class="status-badge status-${b.status}">${STATUS_LABELS[b.status] || b.status}</span>
          ${b.status !== "recebido" ? `<span class="progress-chip">${pr.done}/${pr.total}</span>` : ""}
        </span>
      </button>
      <div class="item-actions">
        <button class="icon-button" type="button" data-edit-id="${b.id}" aria-label="Editar nome" data-tooltip="Renomear este briefing">${ICON_EDIT}</button>
        <button class="icon-button" type="button" data-duplicate-id="${b.id}" aria-label="Duplicar" data-tooltip="Duplicar este briefing (ex.: rodar a mesma estratégia em outra IA)">${ICON_DUPLICATE}</button>
        <button class="icon-button danger" type="button" data-delete-id="${b.id}" aria-label="Excluir" data-tooltip="Excluir este briefing (não pode ser desfeito)">${ICON_DELETE}</button>
      </div>
      <div class="item-ai">${aiToggle}</div>
    </div>`;
    const h = getHermes(b);
    if (!h) return nativeCard;
    const hp = hermesProgress(b);
    const hs = HERMES_CARD_STATES[h.status] || HERMES_CARD_STATES.recebido;
    const hermesCard = `
    <div class="briefing-item-wrap hermes-list-card">
      <button class="briefing-item ${b.id === activeId && activeProvider === "hermes" ? "active" : ""}" data-hermes-id="${b.id}">
        <small>${new Date(h.updatedAt || h.importedAt || b.created_at).toLocaleString("pt-BR")}</small>
        <strong>${escapeHtml(h.cardTitle || `${h.brandName || b.client_name} - Hermes`)}</strong>
        <span class="status-row">
          <span class="hermes-tag">HERMES</span>
          <span class="status-badge ${hs.css}">${hs.label}</span>
          <span class="progress-chip">${hp.done}/${hp.total}</span>
        </span>
      </button>
    </div>`;
    return nativeCard + hermesCard;
  }).join("") || `<p class="empty-state">Nenhum briefing recebido ainda.</p>`;

  document.querySelectorAll(".briefing-item").forEach(el => el.addEventListener("click", () => {
    activeId = el.dataset.id || el.dataset.hermesId;
    activeProvider = el.dataset.hermesId ? "hermes" : "native";
    renderList();
    renderDetail();
  }));
  document.querySelectorAll("[data-edit-id]").forEach(btn => btn.addEventListener("click", e => {
    e.stopPropagation(); renameBriefing(btn.dataset.editId);
  }));
  document.querySelectorAll("[data-duplicate-id]").forEach(btn => btn.addEventListener("click", e => {
    e.stopPropagation(); duplicateBriefing(btn.dataset.duplicateId);
  }));
  document.querySelectorAll("[data-delete-id]").forEach(btn => btn.addEventListener("click", e => {
    e.stopPropagation(); deleteBriefing(btn.dataset.deleteId);
  }));
  document.querySelectorAll("[data-ai-briefing]").forEach(btn => btn.addEventListener("click", e => {
    e.stopPropagation(); setStrategyAi(btn.dataset.aiBriefing, btn.dataset.ai);
  }));
}

async function duplicateBriefing(id) {
  const b = briefings.find(x => x.id === id);
  if (!b) return;
  const p = getPipeline(b);
  const copy = JSON.parse(JSON.stringify(p));
  delete copy.aiTool;                         // a cópia começa sem IA marcada
  const anyStarted = Object.values(copy.steps || {}).some(s => s.status && s.status !== "pendente");
  const status = copy.dossieFinalizado ? "pronto" : (anyStarted ? "processando" : "recebido");
  const { error } = await client.from("briefings").insert({
    answers: b.answers,
    client_name: `${b.client_name || "Briefing sem nome"} (cópia)`,
    result: copy,
    status,
  });
  if (error) { toast("Erro ao duplicar"); return; }
  toast("Briefing duplicado");
  await loadBriefings();
}

async function setStrategyAi(id, aiId) {
  const b = briefings.find(x => x.id === id);
  if (!b) return;
  const p = getPipeline(b);
  p.aiTool = p.aiTool === aiId ? null : aiId;   // clicar de novo desmarca
  if (await savePipeline(b, p)) await loadBriefings();
}

async function renameBriefing(id) {
  const b = briefings.find(x => x.id === id);
  if (!b) return;
  const next = window.prompt("Novo nome do briefing:", b.client_name || "");
  if (next === null) return;
  const { error } = await client.from("briefings").update({ client_name: next.trim() || null }).eq("id", id);
  if (error) { toast("Erro ao renomear"); return; }
  toast("Nome atualizado");
  await loadBriefings();
}
async function deleteBriefing(id) {
  const b = briefings.find(x => x.id === id);
  if (!b) return;
  if (!window.confirm(`Excluir o briefing "${b.client_name || "sem nome"}"? Essa ação não pode ser desfeita.`)) return;
  const { error } = await client.from("briefings").delete().eq("id", id);
  if (error) { toast("Erro ao excluir"); return; }
  if (activeId === id) activeId = null;
  toast("Briefing excluído");
  await loadBriefings();
}

// ---------------------------------------------------------------------------
// Copiar / exportar
// ---------------------------------------------------------------------------
async function copyText(text, label) {
  try { await navigator.clipboard.writeText(text); toast(label ? `${label} copiado` : "Copiado"); }
  catch { toast("Não foi possível copiar"); }
}
function downloadFile(filename, content, mime) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}

// Dossiê Final (documento, etapa 15)
function buildDossie(b) {
  const p = getPipeline(b);
  const lines = [];
  lines.push(`# Dossiê Final — ${b.client_name || "Sem nome"}`);
  lines.push(`_Recebido em ${new Date(b.created_at).toLocaleString("pt-BR")}_`);
  lines.push("");
  lines.push("## Respostas do briefing");
  Object.entries(b.answers || {}).forEach(([q, a]) => { lines.push(`**${q}**`); lines.push(String(a)); lines.push(""); });
  PIPELINE.forEach(s => {
    const st = p.steps[s.key];
    if (!st || !st.response) return;
    lines.push(`## ${s.num}. ${s.title}  \n_status: ${(STEP_STATES[st.status] || {}).label || st.status}_`);
    lines.push("");
    lines.push(String(st.response));
    if (st.notes) { lines.push(""); lines.push(`> Nota do operador: ${st.notes}`); }
    lines.push("");
  });
  const units = p.visualUnits || [];
  if (units.length) {
    lines.push("## 13. Explorações Visuais Unitárias");
    lines.push("");
    units.forEach(u => {
      const meta = VISUAL_UNITS[u.unitType] || { label: u.unitType };
      lines.push(`### ${meta.label} — ${(STEP_STATES[u.status] || {}).label || u.status}`);
      if (u.promptClean) { lines.push("```prompt"); lines.push(u.promptClean); lines.push("```"); }
      if (u.negative) { lines.push("```prompt"); lines.push(`${u.promptClean || ""}`.trim()); lines.push(`NEGATIVE: ${u.negative}`); lines.push("```"); }
      if (u.imageTool) {
        const t = IMAGE_TOOLS.find(x => x.id === u.imageTool);
        lines.push(`Ferramenta: ${t ? t.label : u.imageTool}`);
      }
      if (u.notes) lines.push(`Avaliação: ${u.notes}`);
      lines.push("");
    });
  }
  return lines.join("\n").trim() + "\n";
}
function exportDossieMd() {
  const b = briefings.find(x => x.id === activeId); if (!b) return;
  downloadFile(`dossie-${slugify(b.client_name) || b.id.slice(0, 8)}.md`, buildDossie(b), "text/markdown");
  toast("Dossiê exportado");
}
function copyDossie() {
  const b = briefings.find(x => x.id === activeId); if (!b) return;
  copyText(buildDossie(b), "Dossiê");
}
async function finalizarDossie() {
  const b = briefings.find(x => x.id === activeId); if (!b) return;
  const p = getPipeline(b);
  p.dossieFinalizado = true;
  if (await savePipeline(b, p)) { toast("Dossiê finalizado"); await loadBriefings(); }
}

function buildPrintHtml(b) {
  const answersHtml = Object.entries(b.answers || {}).map(([q, a]) =>
    `<div class="print-qa"><strong>${escapeHtml(q)}</strong><p>${nl2br(a)}</p></div>`).join("");
  const p = getPipeline(b);
  const stepsHtml = PIPELINE.filter(s => (p.steps[s.key] || {}).response)
    .map(s => `<div class="print-section"><h2>${s.num}. ${s.title}</h2><p>${nl2br(p.steps[s.key].response)}</p></div>`)
    .join("");
  return `
    <header class="print-header">
      <img src="logo-dispo.svg" alt="Dispo">
      <div>
        <p class="print-eyebrow">Dossiê de marca</p>
        <h1>${escapeHtml(b.client_name || "Sem nome")}</h1>
        <p class="print-meta">${new Date(b.created_at).toLocaleString("pt-BR")}</p>
      </div>
    </header>
    <section class="print-block">
      <p class="print-block-title">Respostas do briefing</p>
      ${answersHtml}
    </section>
    ${stepsHtml}`;
}
function exportPdf() {
  const b = briefings.find(x => x.id === activeId); if (!b) return;
  $("printArea").innerHTML = buildPrintHtml(b);
  window.print();
}

// ---------------------------------------------------------------------------
// Render do painel de detalhe
// ---------------------------------------------------------------------------
function stepCard(b, step) {
  const st = getStep(b, step.key);
  const state = STEP_STATES[st.status] || STEP_STATES.pendente;
  const isOpen = openSteps.has(step.key);
  const prompt = buildPrompt(step, b);
  const idx = copyTargets.length;
  copyTargets.push(prompt);

  const body = !isOpen ? "" : `
    <p class="step-objetivo">${escapeHtml(step.objetivo)}</p>
    <div class="step-prompt-box"><p class="step-prompt-text">${nl2br(prompt)}</p></div>
    <div class="step-actions">
      <button class="copy-button" type="button" data-copy-index="${idx}" data-tooltip="Copiar o prompt pronto para colar num chat de IA">Copiar prompt</button>
    </div>
    <label class="step-response-label">Resposta da IA
      <textarea class="step-response" data-step="${step.key}" rows="6" placeholder="Cole aqui a resposta aprovada ou em rascunho...">${escapeHtml(st.response || "")}</textarea>
    </label>
    <label class="step-notes-label">Nota do operador (opcional)
      <input class="step-notes" data-step="${step.key}" type="text" value="${escapeHtml(st.notes || "")}" placeholder="Motivo, ajuste pedido, decisão...">
    </label>
    <div class="step-actions">
      <button class="ghost-button icon-label" type="button" data-save-draft="${step.key}" data-tooltip="Guardar o texto sem aprovar. Dá pra continuar editando depois.">${ICON_DRAFT}<span>Salvar rascunho</span></button>
      <button class="approve-button icon-label" type="button" data-set-state="aprovado" data-step="${step.key}" data-tooltip="Aprovar esta etapa. Só o conteúdo aprovado alimenta as próximas etapas.">${ICON_CHECK}<span>Aprovar</span></button>
      <button class="text-button icon-label" type="button" data-set-state="revisar" data-step="${step.key}" data-tooltip="Marcar que essa resposta precisa de ajuste antes de aprovar.">${ICON_FLAG}<span>Revisar</span></button>
      <button class="text-button danger icon-label" type="button" data-set-state="rejeitado" data-step="${step.key}" data-tooltip="Descartar esta resposta. Ela não será usada nas próximas etapas.">${ICON_REJECT}<span>Rejeitar</span></button>
      <button class="text-button icon-label" type="button" data-set-state="pulada" data-step="${step.key}" data-tooltip="Pular esta etapa. Ela fica marcada como pulada e o fluxo segue sem ela.">${ICON_SKIP}<span>Pular</span></button>
    </div>`;

  const copyBtn = st.status === "aprovado" && st.response
    ? `<button class="step-copy-btn" type="button" data-copy-response="${step.key}" aria-label="Copiar resposta aprovada" data-tooltip="Copiar a resposta aprovada para colar em outra conversa">${ICON_COPY}</button>`
    : "";

  return `
    <div class="step-card state-${st.status}">
      <div class="step-head-row">
        <button class="step-head" type="button" data-toggle-step="${step.key}">
          <span class="step-chevron${isOpen ? "" : " collapsed"}">${ICON_CHEVRON}</span>
          <span class="step-num">${step.num}</span>
          <span class="step-title">${escapeHtml(step.title)}</span>
          <span class="step-state-badge state-${st.status}" data-tooltip="${state.hint}">${state.label}</span>
        </button>
        ${copyBtn}
      </div>
      <div class="step-body">${body}</div>
    </div>`;
}

function visualUnitsBlock(b) {
  const p = getPipeline(b);
  const units = p.visualUnits || [];
  const handoffApproved = getStep(b, "handoff").status === "aprovado";

  const options = Object.entries(VISUAL_UNITS)
    .map(([k, v]) => `<option value="${k}">${v.label}</option>`).join("");

  const cards = units.map((u, i) => {
    const meta = VISUAL_UNITS[u.unitType] || { label: u.unitType, ask: "", block: "" };
    const state = STEP_STATES[u.status] || STEP_STATES.pendente;
    const reqPrompt = `Papel: Você é um diretor de arte gerando prompts visuais unitários.

Tarefa: Escreva UM prompt de imagem só para a unidade "${meta.label}" desta marca. Peça apenas: ${meta.ask}. Bloqueie: ${meta.block}.

Contexto (Handoff Visual aprovado):
${inputContent("handoff", b)}

Critérios:
1. Uma única unidade, escopo limpo.
2. Direção positiva conduz; NEGATIVE só como guarda-corpo.
3. Prompt curto e específico.

Saída: entregue exatamente no formato abaixo:
\`\`\`prompt
[prompt em uma linha]
\`\`\`
\`\`\`prompt
[mesmo prompt]
NEGATIVE: ${meta.block}
\`\`\``;
    const idx = copyTargets.length; copyTargets.push(reqPrompt);
    return `
      <div class="unit-card state-${u.status}">
        <div class="unit-head">
          <strong>${meta.label}</strong>
          <span class="step-state-badge state-${u.status}">${state.label}</span>
          <button class="icon-button danger" type="button" data-del-unit="${i}" aria-label="Remover unidade" data-tooltip="Remover esta unidade visual">${ICON_DELETE}</button>
        </div>
        <p class="unit-scope">Pedir: ${escapeHtml(meta.ask)} · Bloquear: ${escapeHtml(meta.block)}</p>
        <div class="step-actions"><button class="copy-button" type="button" data-copy-index="${idx}" data-tooltip="Copiar o prompt para colar numa ferramenta de imagem">Copiar prompt de solicitação</button></div>
        <label class="step-response-label">Prompt final (positivo)
          <textarea class="unit-clean" data-unit="${i}" rows="2" placeholder="Prompt limpo da unidade...">${escapeHtml(u.promptClean || "")}</textarea>
        </label>
        <label class="step-notes-label">NEGATIVE
          <input class="unit-negative" data-unit="${i}" type="text" value="${escapeHtml(u.negative || "")}" placeholder="${escapeHtml(meta.block)}">
        </label>
        <div class="unit-tools">
          <span class="unit-tools-label">Ferramenta que deu bom</span>
          <div class="unit-tools-row">
            ${IMAGE_TOOLS.map(t => `<button class="tool-chip ${u.imageTool === t.id ? "on" : ""}" type="button" style="--tool-color:${t.color}" data-unit-tool="${t.id}" data-unit="${i}" data-tooltip="Marcar que a imagem boa veio do ${t.label}">${t.label}</button>`).join("")}
          </div>
        </div>
        <label class="step-notes-label">Avaliação do resultado
          <input class="unit-notes" data-unit="${i}" type="text" value="${escapeHtml(u.notes || "")}" placeholder="Aprovar, rejeitar, refinar...">
        </label>
        <div class="step-actions">
          <button class="ghost-button icon-label" type="button" data-save-unit="${i}" data-tooltip="Guardar o prompt e a avaliação sem mudar o estado">${ICON_DRAFT}<span>Salvar</span></button>
          <button class="approve-button icon-label" type="button" data-unit-state="aprovado" data-unit="${i}" data-tooltip="Aprovar esta unidade visual">${ICON_CHECK}<span>Aprovar</span></button>
          <button class="text-button icon-label" type="button" data-unit-state="revisar" data-unit="${i}" data-tooltip="Marcar que esta unidade precisa de ajuste">${ICON_FLAG}<span>Revisar</span></button>
          <button class="text-button danger icon-label" type="button" data-unit-state="rejeitado" data-unit="${i}" data-tooltip="Descartar esta unidade visual">${ICON_REJECT}<span>Rejeitar</span></button>
        </div>
      </div>`;
  }).join("");

  return `
    <div class="units-block">
      <div class="units-add">
        <select id="unitTypeSelect" ${handoffApproved ? "" : "disabled"}>${options}</select>
        <button class="ghost-button" id="addUnitButton" type="button" ${handoffApproved ? "" : "disabled"} data-tooltip="Criar uma nova unidade visual a partir do Handoff aprovado">Adicionar unidade</button>
        ${handoffApproved ? "" : `<span class="units-locked">Aprove o Handoff Visual para liberar a conversa visual.</span>`}
      </div>
      ${cards || `<p class="empty-state small">Nenhuma unidade visual ainda.</p>`}
    </div>`;
}

function bindHermesDetailListeners(b, detail) {
  detail.querySelectorAll("[data-toggle-hstep]").forEach(btn => btn.addEventListener("click", () => {
    const k = btn.dataset.toggleHstep;
    if (openHermesSteps.has(k)) openHermesSteps.delete(k); else openHermesSteps.add(k);
    renderDetail();
  }));
  detail.querySelectorAll("[data-hermes-state]").forEach(btn => btn.addEventListener("click", () =>
    saveHermesStep(b, btn.dataset.hstep, btn.dataset.hermesState)));
  detail.querySelectorAll("[data-hermes-card-state]").forEach(btn => btn.addEventListener("click", () =>
    setHermesCardStatus(b, btn.dataset.hermesCardState)));
}

function renderDetail() {
  const b = briefings.find(x => x.id === activeId);
  const detail = $("briefingDetail");
  if (!b) { detail.innerHTML = `<p class="empty-state">Selecione um briefing na lista ao lado.</p>`; return; }

  const selectedHermes = getHermes(b);
  if (activeProvider === "hermes" && selectedHermes) {
    const cardState = HERMES_CARD_STATES[selectedHermes.status] || HERMES_CARD_STATES.recebido;
    detail.innerHTML = `
      <div class="detail-header">
        <div>
          <p class="eyebrow">HERMES · ${new Date(selectedHermes.updatedAt || selectedHermes.importedAt || b.created_at).toLocaleString("pt-BR")}</p>
          <h2>${escapeHtml(selectedHermes.cardTitle || `${selectedHermes.brandName || b.client_name} - Hermes`)}</h2>
          <p class="detail-meta"><span class="status-badge ${cardState.css}">${cardState.label}</span></p>
        </div>
      </div>
      ${hermesDetailBlock(b)}`;
    bindHermesDetailListeners(b, detail);
    return;
  }

  copyTargets = [];
  const answersEntries = Object.entries(b.answers || {});

  const estrategicas = PIPELINE.filter(s => s.conversa === "estrategica" || s.conversa === "transicao");
  const visuais = PIPELINE.filter(s => s.conversa === "visual");

  detail.innerHTML = `
    <div class="detail-header">
      <div>
        <p class="eyebrow">${new Date(b.created_at).toLocaleString("pt-BR")}</p>
        <h2>${escapeHtml(b.client_name || "Briefing sem nome")}</h2>
        <p class="detail-meta"><span class="status-badge status-${b.status}">${STATUS_LABELS[b.status] || b.status}</span></p>
      </div>
      <div class="detail-toolbar">
        <button class="ghost-button" id="editNameButton" type="button" data-tooltip="Renomear este briefing">Editar</button>
        <button class="ghost-button" id="libraryButton" type="button" data-tooltip="Ver e editar as ferramentas estratégicas usadas na etapa 3">Biblioteca Estratégica</button>
        <button class="ghost-button" id="copyDossieButton" type="button" data-tooltip="Copiar todo o histórico aprovado em Markdown">Copiar dossiê</button>
        <button class="ghost-button" id="exportDossieButton" type="button" data-tooltip="Baixar o dossiê completo como arquivo .md">Baixar dossiê .md</button>
        <button class="ghost-button" id="exportPdfButton" type="button" data-tooltip="Gerar um PDF do dossiê para imprimir ou enviar">PDF</button>
        <button class="ghost-button" id="finalizarButton" type="button" data-tooltip="Marcar este briefing como concluído (status Pronto)">Finalizar dossiê</button>
      </div>
    </div>

    <button class="answers-summary" id="openAnswersButton" type="button" data-tooltip="Ver todas as respostas do formulário">
      <span class="answers-summary-text">
        <h3>Respostas do briefing</h3>
        <span class="answers-summary-count">${answersEntries.length} pergunta${answersEntries.length === 1 ? "" : "s"} respondida${answersEntries.length === 1 ? "" : "s"}</span>
      </span>
      <span class="answers-summary-icon">${ICON_CHEVRON}</span>
    </button>

    <div class="pipeline-group">
      <h3 class="pipeline-group-title">${CONVERSAS.estrategica} <span>estratégia → verbal → direção visual escrita, sem imagem</span></h3>
      <div class="step-card static state-aprovado" data-tooltip="O formulário público já foi enviado e salvo. As etapas abaixo continuam esse processamento.">
        <div class="step-head static">
          <span class="step-num">1</span>
          <span class="step-title">Recebimento do briefing</span>
          <span class="step-state-badge state-aprovado">Recebido</span>
        </div>
      </div>
      ${estrategicas.map(s => stepCard(b, s)).join("")}
    </div>

    <div class="pipeline-group">
      <h3 class="pipeline-group-title">${CONVERSAS.visual} <span>uma unidade por vez, só depois do Handoff aprovado</span></h3>
      <div class="step-card static">
        <div class="step-head static"><span class="step-num">13</span><span class="step-title">Exploração Visual Unitária</span></div>
        <div class="step-body">${visualUnitsBlock(b)}</div>
      </div>
      ${visuais.map(s => stepCard(b, s)).join("")}
    </div>`;

  // --- listeners de topo ---
  $("editNameButton").addEventListener("click", () => renameBriefing(b.id));
  $("libraryButton").addEventListener("click", openLibraryModal);
  $("copyDossieButton").addEventListener("click", copyDossie);
  $("exportDossieButton").addEventListener("click", exportDossieMd);
  $("exportPdfButton").addEventListener("click", exportPdf);
  $("finalizarButton").addEventListener("click", finalizarDossie);
  $("openAnswersButton").addEventListener("click", () => openAnswersModal(b));

  // --- copiar (prompts, respostas) ---
  detail.querySelectorAll("[data-copy-index]").forEach(btn =>
    btn.addEventListener("click", () => copyText(copyTargets[Number(btn.dataset.copyIndex)] || "")));

  // --- copiar resposta aprovada (cabeçalho da etapa) ---
  detail.querySelectorAll("[data-copy-response]").forEach(btn => btn.addEventListener("click", e => {
    e.stopPropagation();
    const key = btn.dataset.copyResponse;
    copyText(getStep(b, key).response || "", STEP_BY_KEY[key] ? STEP_BY_KEY[key].title : "Resposta");
  }));

  // --- toggle etapa ---
  detail.querySelectorAll("[data-toggle-step]").forEach(btn => btn.addEventListener("click", () => {
    const k = btn.dataset.toggleStep;
    if (openSteps.has(k)) openSteps.delete(k); else openSteps.add(k);
    renderDetail();
  }));

  // --- salvar rascunho / mudar estado das etapas ---
  detail.querySelectorAll("[data-save-draft]").forEach(btn =>
    btn.addEventListener("click", () => saveStep(b, btn.dataset.saveDraft, "rascunho")));
  detail.querySelectorAll("[data-set-state]").forEach(btn =>
    btn.addEventListener("click", () => saveStep(b, btn.dataset.step, btn.dataset.setState)));

  // --- unidades visuais ---
  const addBtn = $("addUnitButton");
  if (addBtn) addBtn.addEventListener("click", () => addVisualUnit(b, $("unitTypeSelect").value));
  detail.querySelectorAll("[data-save-unit]").forEach(btn =>
    btn.addEventListener("click", () => saveVisualUnit(b, Number(btn.dataset.saveUnit))));
  detail.querySelectorAll("[data-unit-state]").forEach(btn =>
    btn.addEventListener("click", () => saveVisualUnit(b, Number(btn.dataset.unit), btn.dataset.unitState)));
  detail.querySelectorAll("[data-del-unit]").forEach(btn =>
    btn.addEventListener("click", () => removeVisualUnit(b, Number(btn.dataset.delUnit))));
  detail.querySelectorAll("[data-unit-tool]").forEach(btn =>
    btn.addEventListener("click", () => setUnitTool(b, Number(btn.dataset.unit), btn.dataset.unitTool)));

  // --- listeners Hermes ---
  bindHermesDetailListeners(b, detail);
}

// ---------------------------------------------------------------------------
// Ações de etapa
// ---------------------------------------------------------------------------
function readStepInputs(key) {
  const ta = document.querySelector(`.step-response[data-step="${key}"]`);
  const nt = document.querySelector(`.step-notes[data-step="${key}"]`);
  return { response: ta ? ta.value : undefined, notes: nt ? nt.value : undefined };
}
async function saveStep(b, key, status) {
  const p = getPipeline(b);
  const prev = p.steps[key] || {};
  const live = readStepInputs(key);
  const response = live.response !== undefined ? live.response.trim() : (prev.response || "");
  const notes = live.notes !== undefined ? live.notes : (prev.notes || "");
  if ((status === "aprovado" || status === "rascunho") && !response) {
    toast("Cole a resposta antes de salvar"); return;
  }
  p.steps[key] = {
    ...prev, status, response, notes,
    updatedAt: nowIso(),
    approvedAt: status === "aprovado" ? nowIso() : prev.approvedAt || null,
  };
  if (await savePipeline(b, p)) {
    toast(`${STEP_BY_KEY[key].title}: ${(STEP_STATES[status] || {}).label || status}`);
    // Botões que concluem a etapa fecham o box e já abrem o próximo (dinamismo).
    if (["aprovado", "revisar", "rejeitado", "pulada"].includes(status)) openNextStep(key);
    await loadBriefings();
  }
}

// ---------------------------------------------------------------------------
// Ações de unidade visual
// ---------------------------------------------------------------------------
async function addVisualUnit(b, unitType) {
  const p = getPipeline(b);
  p.visualUnits = p.visualUnits || [];
  p.visualUnits.push({ unitType, status: "pendente", promptClean: "", negative: "", notes: "", imageTool: null, updatedAt: nowIso() });
  if (await savePipeline(b, p)) { toast("Unidade adicionada"); await loadBriefings(); }
}
function readUnitInputs(i) {
  const clean = document.querySelector(`.unit-clean[data-unit="${i}"]`);
  const neg = document.querySelector(`.unit-negative[data-unit="${i}"]`);
  const notes = document.querySelector(`.unit-notes[data-unit="${i}"]`);
  return {
    promptClean: clean ? clean.value : undefined,
    negative: neg ? neg.value : undefined,
    notes: notes ? notes.value : undefined,
  };
}
async function saveVisualUnit(b, i, status) {
  const p = getPipeline(b);
  const u = (p.visualUnits || [])[i]; if (!u) return;
  const live = readUnitInputs(i);
  if (live.promptClean !== undefined) u.promptClean = live.promptClean.trim();
  if (live.negative !== undefined) u.negative = live.negative.trim();
  if (live.notes !== undefined) u.notes = live.notes;
  if (status) u.status = status;
  u.updatedAt = nowIso();
  if (await savePipeline(b, p)) { toast(status ? (STEP_STATES[status] || {}).label : "Unidade salva"); await loadBriefings(); }
}
async function setUnitTool(b, i, toolId) {
  const p = getPipeline(b);
  const u = (p.visualUnits || [])[i]; if (!u) return;
  const live = readUnitInputs(i);               // preserva texto ainda não salvo
  if (live.promptClean !== undefined) u.promptClean = live.promptClean.trim();
  if (live.negative !== undefined) u.negative = live.negative.trim();
  if (live.notes !== undefined) u.notes = live.notes;
  u.imageTool = u.imageTool === toolId ? null : toolId;   // clicar de novo desmarca
  u.updatedAt = nowIso();
  if (await savePipeline(b, p)) await loadBriefings();
}
async function removeVisualUnit(b, i) {
  if (!window.confirm("Remover esta unidade visual?")) return;
  const p = getPipeline(b);
  (p.visualUnits || []).splice(i, 1);
  if (await savePipeline(b, p)) { toast("Unidade removida"); await loadBriefings(); }
}

// ---------------------------------------------------------------------------
// Importar briefing (.md)
// ---------------------------------------------------------------------------
function parseBriefingMarkdown(text) {
  const titleMatch = text.match(/^#\s*(?:Briefing|Dossiê Final)[:\s—-]*\s*(.+)$/m);
  const clientName = titleMatch ? titleMatch[1].trim() : null;
  const sectionMatch = text.match(/##\s*Respostas do briefing\s*\n([\s\S]*?)(?:\n##\s|$)/);
  const answers = {};
  if (sectionMatch) {
    const entries = sectionMatch[1].trim().split(/\n(?=\*\*.+?\*\*\s*\n)/);
    entries.forEach(entry => {
      const m = entry.match(/^\*\*(.+?)\*\*\s*\n([\s\S]*)$/);
      if (!m) return;
      const q = m[1].trim(), a = m[2].trim();
      if (q && a) answers[q] = a;
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

// ---------------------------------------------------------------------------
// Carga / realtime
// ---------------------------------------------------------------------------
async function loadBriefings() {
  const { data, error } = await client.from("briefings").select("*").order("created_at", { ascending: false });
  if (error) return;
  briefings = data;
  if (!activeId && briefings[0]) activeId = briefings[0].id;
  renderList();
  renderDetail();
}
function subscribeRealtime() {
  channel = client.channel("briefings-changes")
    .on("postgres_changes", { event: "*", schema: "public", table: "briefings" }, loadBriefings)
    .subscribe();
}
async function showHub() {
  document.body.dataset.view = "hub";
  $("loginScreen").style.display = "none";
  $("hubScreen").style.display = "block";
  await loadLibrary();
  await loadBriefings();
  subscribeRealtime();
}
function toast(message) {
  $("toast").textContent = message;
  $("toast").classList.add("show");
  clearTimeout(toast._t);
  toast._t = setTimeout(() => $("toast").classList.remove("show"), 1800);
}

// ---------------------------------------------------------------------------
// Init
// ---------------------------------------------------------------------------
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
$("hermesImportBtn").addEventListener("click", () => {
  if (!activeId || !briefings.some(b => b.id === activeId)) {
    toast("Selecione um briefing antes de importar o payload Hermes");
    return;
  }
  $("hermesImportInput").click();
});
$("hermesImportInput").addEventListener("change", async () => {
  const input = $("hermesImportInput");
  const file = input.files[0];
  const briefing = briefings.find(b => b.id === activeId);
  if (file && briefing) await importHermesPayload(file, briefing);
  input.value = "";
});
$("libraryCloseButton").addEventListener("click", closeLibraryModal);
$("libraryCopyButton").addEventListener("click", () => copyText($("libraryTextarea").value, "Biblioteca"));
$("librarySaveButton").addEventListener("click", saveLibraryEdit);
$("libraryResetButton").addEventListener("click", resetLibrary);
$("libraryModal").addEventListener("click", e => { if (e.target === $("libraryModal")) closeLibraryModal(); });
$("answersModalCloseButton").addEventListener("click", closeAnswersModal);
$("answersModalCopyButton").addEventListener("click", () => copyText(answersModalText, "Respostas"));
$("answersModal").addEventListener("click", e => { if (e.target === $("answersModal")) closeAnswersModal(); });

// ---------------------------------------------------------------------------
// HERMES — Integração com o Método Branding
// Armazena dados em result.hermes (JSONB existente). savePipeline() já preserva.
// Nunca auto-aprova em nome de Lucas: toda aprovação é ação humana explícita.
// ---------------------------------------------------------------------------

const HERMES_STEPS = [
  { key: "h_entrada",    num: 1,  title: "Briefing original e entrada"           },
  { key: "h_brief",      num: 2,  title: "Brief Mestre"                          },
  { key: "h_ferramenta", num: 3,  title: "Ferramenta estratégica"                },
  { key: "h_pesquisa",   num: 4,  title: "Pesquisas, fontes e limitações"        },
  { key: "h_diagnostico",num: 5,  title: "Diagnóstico e estratégia recomendada"  },
  { key: "h_caminhos",   num: 6,  title: "Caminhos, posicionamentos e promessas" },
  { key: "h_auditorias", num: 7,  title: "Auditorias e justificativas"           },
  { key: "h_decisoes",   num: 8,  title: "Decisões vigentes e caminho"           },
  { key: "h_verbal",     num: 9,  title: "Sistema Verbal"                        },
  { key: "h_criterios",  num: 10, title: "Critérios verificáveis"                },
  { key: "h_direcao",    num: 11, title: "Direção Criativa e experimentos"       },
  { key: "h_handoff",    num: 12, title: "Handoff Final"                         },
];

const HERMES_CARD_STATES = {
  recebido:              { label: "Recebido",             css: "status-recebido"    },
  em_processamento:      { label: "Em processamento",     css: "status-processando" },
  pronto_para_revisao:   { label: "Pronto para revisão",  css: "status-pronto"      },
  aprovado:              { label: "Aprovado",             css: "status-aprovado"    },
  aprovado_com_ressalvas:{ label: "Aprovado c/ ressalvas",css: "status-ressalvas"   },
  bloqueado:             { label: "Bloqueado",            css: "status-bloqueado"   },
  erro:                  { label: "Erro",                 css: "status-erro"        },
};

const HERMES_STEP_STATES = {
  sem_conteudo:          { label: "Sem conteúdo",          css: ""          },
  rascunho:              { label: "Rascunho",              css: "state-rascunho"  },
  aprovado:              { label: "Aprovado",              css: "state-aprovado"  },
  aprovado_com_ressalvas:{ label: "Aprovado c/ ressalvas", css: "state-revisar"   },
  revisar:               { label: "Revisar",               css: "state-revisar"   },
  rejeitado:             { label: "Rejeitado",             css: "state-rejeitado" },
  pulada:                { label: "Pulada",                css: "state-pulada"    },
  bloqueado:             { label: "Bloqueado",             css: "state-rejeitado" },
  erro:                  { label: "Erro",                  css: "state-erro"      },
};

function getHermes(b) {
  return (b && b.result && b.result.hermes) || null;
}

async function saveHermes(b, hermes, expectedUpdatedAt = (getHermes(b) || {}).updatedAt || "__absent__") {
  // RPC faz lock da linha e jsonb_set apenas em result.hermes: não perde writes Claude/GPT concorrentes.
  const { error } = await client.rpc("upsert_briefing_hermes", {
    p_briefing_id: b.id,
    p_hermes: hermes,
    p_expected_updated_at: expectedUpdatedAt,
  });
  if (error) {
    toast(error.message && error.message.includes("concurrent update")
      ? "O card Hermes mudou em outra sessão. Recarregue antes de salvar."
      : "Erro ao salvar Hermes");
    return false;
  }
  return true;
}

function hermesProgress(b) {
  const h = getHermes(b);
  if (!h) return null;
  const steps = h.steps || {};
  const done = HERMES_STEPS.filter(s => {
    const st = steps[s.key] && steps[s.key].status;
    return st === "aprovado" || st === "aprovado_com_ressalvas";
  }).length;
  return { done, total: HERMES_STEPS.length };
}

function hermesListBadge(b) {
  const h = getHermes(b);
  if (!h) return "";
  const pr = hermesProgress(b);
  const cs = HERMES_CARD_STATES[h.status] || HERMES_CARD_STATES.recebido;
  return `<div class="hermes-list-badge">
    <span class="hermes-tag">HERMES</span>
    ${pr ? `<span class="progress-chip">${pr.done}/${pr.total}</span>` : ""}
    <span class="status-badge ${cs.css}">${cs.label}</span>
  </div>`;
}

// Conjunto de etapas Hermes abertas no painel (separado do pipeline nativo)
const openHermesSteps = new Set();

function hermesStepCard(b, step) {
  const h = getHermes(b) || {};
  const stepData = (h.steps || {})[step.key] || { status: "sem_conteudo", displayMarkdown: "", notes: "" };
  const state = HERMES_STEP_STATES[stepData.status] || HERMES_STEP_STATES.sem_conteudo;
  const isOpen = openHermesSteps.has(step.key);

  const body = !isOpen ? "" : `
    ${stepData.newVersionAvailable ? `<p class="hermes-version-alert">Nova versão disponível. Sua edição foi preservada.</p>` : ""}
    <div class="hermes-content-box">
      <textarea class="hermes-response" data-hstep="${step.key}" aria-label="Resposta da IA — ${escapeHtml(step.title)}">${escapeHtml(stepData.displayMarkdown || stepData.editedMarkdown || stepData.generatedMarkdown || stepData.content || "")}</textarea>
    </div>
    ${stepData.technicalMetadata ? `<details class="hermes-technical"><summary>Detalhes técnicos</summary><pre>${escapeHtml(JSON.stringify(stepData.technicalMetadata, null, 2))}</pre></details>` : ""}
    <label class="step-notes-label">Nota do revisor (opcional)
      <input class="hermes-notes" data-hstep="${step.key}" type="text" value="${escapeHtml(stepData.notes || "")}" placeholder="Observação, ajuste, ressalva...">
    </label>
    <div class="step-actions">
      <button class="approve-button icon-label" type="button" data-hermes-state="aprovado" data-hstep="${step.key}" data-tooltip="Aprovar esta etapa Hermes (decisão humana)">${ICON_CHECK}<span>Aprovar</span></button>
      <button class="ghost-button icon-label" type="button" data-hermes-state="aprovado_com_ressalvas" data-hstep="${step.key}" data-tooltip="Aprovar com ressalvas">${ICON_FLAG}<span>Ressalvas</span></button>
      <button class="ghost-button icon-label" type="button" data-hermes-state="rascunho" data-hstep="${step.key}" data-tooltip="Salvar resposta e nota como rascunho">${ICON_DRAFT}<span>Salvar rascunho</span></button>
      <button class="ghost-button icon-label" type="button" data-hermes-state="revisar" data-hstep="${step.key}">${ICON_FLAG}<span>Revisar</span></button>
      <button class="text-button icon-label danger" type="button" data-hermes-state="rejeitado" data-hstep="${step.key}">${ICON_REJECT}<span>Rejeitar</span></button>
      <button class="ghost-button icon-label" type="button" data-hermes-state="pulada" data-hstep="${step.key}">${ICON_SKIP}<span>Pular</span></button>
      <button class="text-button icon-label danger" type="button" data-hermes-state="bloqueado" data-hstep="${step.key}" data-tooltip="Marcar como bloqueado">${ICON_REJECT}<span>Bloquear</span></button>
    </div>`;

  return `
    <div class="step-card ${state.css}">
      <div class="step-head-row">
        <button class="step-head" type="button" data-toggle-hstep="${step.key}">
          <span class="step-chevron${isOpen ? "" : " collapsed"}">${ICON_CHEVRON}</span>
          <span class="step-num">${step.num}</span>
          <span class="step-title">${escapeHtml(step.title)}</span>
          <span class="step-state-badge ${state.css}" data-tooltip="${state.label}">${state.label}</span>
        </button>
      </div>
      <div class="step-body">${body}</div>
    </div>`;
}

function hermesDetailBlock(b) {
  const h = getHermes(b);
  const pr = hermesProgress(b);
  const cs = h ? (HERMES_CARD_STATES[h.status] || HERMES_CARD_STATES.recebido) : null;

  const cardActions = h ? `
    <div class="hermes-card-actions">
      <button class="ghost-button" type="button" data-hermes-card-state="recebido">Recebido</button>
      <button class="ghost-button" type="button" data-hermes-card-state="em_processamento">Em processamento</button>
      <button class="ghost-button" type="button" data-hermes-card-state="pronto_para_revisao" data-tooltip="Marcar como pronto para revisão humana">Pronto p/ revisão</button>
      <button class="approve-button icon-label" type="button" data-hermes-card-state="aprovado" data-tooltip="Aprovar este card Hermes — decisão humana registrada aqui">${ICON_CHECK}<span>Aprovar card</span></button>
      <button class="ghost-button" type="button" data-hermes-card-state="aprovado_com_ressalvas" data-tooltip="Aprovar com ressalvas">Ressalvas</button>
      <button class="text-button danger" type="button" data-hermes-card-state="bloqueado" data-tooltip="Bloquear este card">Bloquear</button>
      <button class="text-button danger" type="button" data-hermes-card-state="erro" data-tooltip="Marcar como erro">Erro</button>
    </div>` : "";

  return `
    <div class="pipeline-group hermes-group">
      <h3 class="pipeline-group-title hermes-group-title">
        <span class="hermes-tag">HERMES</span>
        ${h ? escapeHtml(h.cardTitle || `${h.brandName} - Hermes`) : "Integração Hermes"}
        ${pr ? `<span class="progress-chip">${pr.done}/${pr.total}</span>` : ""}
        ${cs ? `<span class="status-badge ${cs.css}">${cs.label}</span>` : ""}
      </h3>
      ${h ? `
        <p class="hermes-meta">${h.updatedAt ? `Atualizado em ${new Date(h.updatedAt).toLocaleString("pt-BR")}` : ""}</p>
        ${HERMES_STEPS.map(s => hermesStepCard(b, s)).join("")}
        ${cardActions}
      ` : `
        <p class="empty-state">Nenhum payload Hermes importado. Use "Importar Hermes" para carregar o <code>admin_payload.json</code> gerado pelo adaptador no Método Branding.</p>
        <p style="font-size:12px;color:var(--muted);margin-top:8px;">Comando: <code>node scripts/hermes-publish.js &lt;slug&gt;</code> em Metodo Branding</p>
      `}
    </div>`;
}

const MAX_HERMES_PAYLOAD_BYTES = 5 * 1024 * 1024;
const HERMES_IMPORT_STEP_STATES = new Set(["sem_conteudo", "rascunho", "aprovado", "aprovado_com_ressalvas", "revisar", "rejeitado", "pulada", "bloqueado", "erro"]);
const HERMES_IMPORT_CARD_STATES = new Set(Object.keys(HERMES_CARD_STATES));

// Compatibilidade com verificadores existentes; o diagnóstico detalhado vem do módulo dedicado.
function containsLikelySecret(value) {
  return !!HermesPayloadSecurity.findPayloadSecurityIssue(value);
}

function validateHermesPayload(payload, briefingId) {
  if (!payload || payload.provider !== "hermes") return "provider incorreto";
  if (payload.briefingId && payload.briefingId !== briefingId) return "payload pertence a outro briefing";
  for (const field of ["projectSlug", "brandName", "cardTitle"]) {
    if (typeof payload[field] !== "string" || !payload[field].trim() || payload[field].length > 240) return `${field} inválido`;
  }
  if (!HERMES_IMPORT_CARD_STATES.has(payload.overallStatus)) return "overallStatus inválido";
  if (!Array.isArray(payload.steps) || payload.steps.length !== HERMES_STEPS.length) return "payload deve ter exatamente 12 etapas";
  const keys = new Set(payload.steps.map(s => s && s.key));
  if (keys.size !== HERMES_STEPS.length || HERMES_STEPS.some(s => !keys.has(s.key))) return "chaves de etapa ausentes, duplicadas ou desconhecidas";
  for (const def of HERMES_STEPS) {
    const s = payload.steps.find(x => x.key === def.key);
    if (s.num !== def.num || typeof s.title !== "string" || !s.title.trim() || s.title.length > 240 || typeof s.content !== "string" || !Array.isArray(s.artifacts)) return `estrutura inválida em ${def.key}`;
    if (!HERMES_IMPORT_STEP_STATES.has(s.status || "rascunho")) return `status inválido em ${def.key}`;
    if (s.content.length > 500000 || s.artifacts.length > 100 || s.artifacts.some(a => typeof a !== "string" || a.length > 1000)) return `conteúdo inválido em ${def.key}`;
  }
  return null;
}

async function importHermesPayload(file, b) {
  if (file.size > MAX_HERMES_PAYLOAD_BYTES) { toast("Payload Hermes excede 5 MB"); return; }
  let payload;
  try { payload = JSON.parse(await file.text()); }
  catch { toast("Arquivo JSON inválido"); return; }

  const validationError = validateHermesPayload(payload, b.id);
  if (validationError) { toast(`Payload Hermes inválido: ${validationError}`); return; }

  const securityIssue = HermesPayloadSecurity.findPayloadSecurityIssue(payload);
  if (securityIssue) {
    toast(`Payload bloqueado no campo ${securityIssue.path} (${securityIssue.category}).`); return;
  }

  const existing = getHermes(b);
  const steps = {};
  let contentChanged = false;
  for (const s of payload.steps) {
    const prev = existing && existing.steps && existing.steps[s.key];
    const nextContent = s.displayMarkdown || s.content || "";
    const nextArtifacts = (s.technicalMetadata && s.technicalMetadata.artifacts) || s.artifacts || [];
    const previousGenerated = prev && (prev.generatedMarkdown || prev.content || "");
    const humanEdited = !!(prev && (prev.hasHumanEdit || prev.editedMarkdown));
    const stepChanged = !!prev && (previousGenerated !== nextContent || JSON.stringify((prev.technicalMetadata && prev.technicalMetadata.artifacts) || prev.artifacts || []) !== JSON.stringify(nextArtifacts));
    contentChanged = contentChanged || stepChanged;
    const preserveReview = !!prev && !stepChanged && prev.status !== "sem_conteudo";
    steps[s.key] = {
      generatedMarkdown: nextContent,
      editedMarkdown: humanEdited ? (prev.editedMarkdown || prev.displayMarkdown || prev.content || "") : "",
      displayMarkdown: humanEdited ? (prev.editedMarkdown || prev.displayMarkdown || prev.content || "") : nextContent,
      content: humanEdited ? (prev.editedMarkdown || prev.displayMarkdown || prev.content || "") : nextContent,
      hasHumanEdit: humanEdited,
      newVersionAvailable: humanEdited && stepChanged,
      technicalMetadata: s.technicalMetadata || { artifacts: nextArtifacts },
      artifacts:  nextArtifacts,
      status:     preserveReview ? prev.status : (nextContent ? "rascunho" : "sem_conteudo"),
      notes:      prev ? (prev.notes || "") : "",
      history:    [...(prev && Array.isArray(prev.history) ? prev.history : []), ...(stepChanged ? [{ action: "content_updated", from: prev.status || null, to: "rascunho", at: nowIso() }] : [])],
      importedAt: nowIso(),
      ...(preserveReview && prev.approvedAt ? { approvedAt: prev.approvedAt } : {}),
    };
  }

  const requestedStatus = ["recebido", "em_processamento", "pronto_para_revisao", "bloqueado", "erro"].includes(payload.overallStatus)
    ? payload.overallStatus : "pronto_para_revisao";
  const nextCardStatus = existing
    ? (contentChanged && ["aprovado", "aprovado_com_ressalvas"].includes(existing.status) ? "pronto_para_revisao" : (existing.status || requestedStatus))
    : requestedStatus;

  const hermes = {
    provider:    "hermes",
    projectSlug: payload.projectSlug || "",
    brandName:   payload.brandName   || "",
    cardTitle:   payload.cardTitle   || `${payload.brandName} - Hermes`,
    status:      nextCardStatus,
    importedAt:  existing ? (existing.importedAt || nowIso()) : nowIso(),
    updatedAt:   nowIso(),
    history:     [...((existing && existing.history) || []), { action: "import", from: existing ? existing.status : null, to: nextCardStatus, contentChanged, at: nowIso() }],
    steps,
  };
  if (!contentChanged && existing && existing.approvedAt) hermes.approvedAt = existing.approvedAt;

  if (await saveHermes(b, hermes)) {
    toast("Payload Hermes importado");
    openHermesSteps.clear();
    activeProvider = "hermes";
    await loadBriefings();
  }
}

async function saveHermesStep(b, key, status) {
  const existingHermes = getHermes(b);
  const expectedUpdatedAt = (existingHermes || {}).updatedAt || "__absent__";
  const h = existingHermes ? structuredClone(existingHermes) : { steps: {}, status: "em_processamento", provider: "hermes" };
  h.steps = h.steps || {};
  const note = document.querySelector(`.hermes-notes[data-hstep="${key}"]`);
  const notes = note ? note.value : ((h.steps[key] || {}).notes || "");
  const response = document.querySelector(`.hermes-response[data-hstep="${key}"]`);
  const previous = h.steps[key] || {};
  const editedMarkdown = response ? response.value : (previous.displayMarkdown || previous.content || "");
  const next = {
    ...previous,
    status, notes, editedMarkdown, displayMarkdown: editedMarkdown, content: editedMarkdown,
    hasHumanEdit: editedMarkdown !== (previous.generatedMarkdown || ""),
    newVersionAvailable: false,
    updatedAt: nowIso(),
    history: [...(previous.history || []), { action: "manual", from: previous.status || null, to: status, notes, at: nowIso() }],
    ...(["aprovado", "aprovado_com_ressalvas"].includes(status) ? { approvedAt: nowIso() } : {}),
  };
  if (!["aprovado", "aprovado_com_ressalvas"].includes(status)) delete next.approvedAt;
  h.steps[key] = next;
  h.updatedAt = nowIso();
  if (await saveHermes(b, h, expectedUpdatedAt)) {
    toast(`Hermes etapa ${key}: ${(HERMES_STEP_STATES[status] || {}).label || status}`);
    openHermesSteps.delete(key);
    const keys = HERMES_STEPS.map(s => s.key);
    const i = keys.indexOf(key);
    if (i >= 0 && i + 1 < keys.length) openHermesSteps.add(keys[i + 1]);
    await loadBriefings();
  }
}

async function setHermesCardStatus(b, status) {
  const existingHermes = getHermes(b);
  const expectedUpdatedAt = (existingHermes || {}).updatedAt || "__absent__";
  const h = existingHermes ? structuredClone(existingHermes) : { steps: {}, provider: "hermes" };
  const previousStatus = h.status || null;
  h.status = status;
  h.updatedAt = nowIso();
  h.history = [...(h.history || []), { action: "card_status", from: previousStatus, to: status, at: nowIso() }];
  if (["aprovado", "aprovado_com_ressalvas"].includes(status)) h.approvedAt = nowIso();
  else delete h.approvedAt;
  if (await saveHermes(b, h, expectedUpdatedAt)) {
    toast(`Hermes: ${(HERMES_CARD_STATES[status] || {}).label || status}`);
    await loadBriefings();
    renderDetail();
  }
}
