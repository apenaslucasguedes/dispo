const sections = [
  {
    title: "O essencial",
    description: "O ponto de partida: quem é a marca e o que ela precisa nascer ou se tornar.",
    questions: [
      { topic: "Identificação", text: "Qual é o nome da marca?", hint: "", type: "short" },
      { topic: "Identificação", text: "Como você descreveria a marca em poucas frases?", hint: "Explique o que ela vende, para quem vende e o que faz de diferente. Ex.: “é uma clínica de estética voltada para mulheres que buscam procedimentos naturais, com atendimento próximo e visual mais sofisticado.”", type: "long" }
    ]
  },
  {
    title: "Momento da marca",
    description: "O que já existe, o que está mudando e onde podemos ver isso hoje.",
    questions: [
      { topic: "Situação", text: "Este projeto é para qual situação?", hint: "", type: "single", options: ["Marca nova, começando a aparecer agora", "Redesign de uma marca existente", "Ajuste visual de uma marca que já existe", "Identidade para um produto, serviço ou projeto específico"] },
      { topic: "Mudança", text: "O que precisa mudar ou nascer com este projeto?", hint: "Ex. marca nova: “precisamos criar uma imagem confiável para lançar o negócio.” Ex. redesign: “a marca atual parece simples demais para o público que queremos atrair.”", type: "long" },
      { topic: "Ponto de partida", text: "Existe algum lugar onde podemos ver a marca, o negócio ou referências do projeto hoje?", hint: "Pode ser Instagram, site, perfil pessoal, loja online, pasta pública, Pinterest, concorrente, referência visual ou qualquer link que ajude a entender o ponto de partida. Cole um link por linha.", type: "links", optional: true }
    ]
  },
  {
    title: "Público e percepção",
    description: "Para quem essa marca fala, e o que ela precisa fazer essas pessoas sentirem.",
    questions: [
      { topic: "Público principal", text: "Quem é o principal público da marca?", hint: "Não precisa criar uma persona completa. Explique quem compra, quem decide ou quem precisa confiar na marca. Ex.: “mulheres de 30 a 50 anos, com renda média alta, que valorizam estética natural e atendimento cuidadoso.”", type: "long" },
      { topic: "Outros públicos", text: "Existe outro público importante?", hint: "Ex.: “arquitetos que indicam a loja”, “pais que pagam pelo serviço”, “sócios que aprovam”, “empresas que contratam para eventos”.", type: "short", optional: true },
      { topic: "Público desejado", text: "Que tipo de público você quer atrair mais?", hint: "Ex.: “clientes com maior poder de compra, que valorizem projeto completo e não comparem apenas por preço.”", type: "long" },
      { topic: "Sensações", text: "O que a marca precisa fazer as pessoas sentirem?", hint: "Escolha até 5.", type: "multi", limit: 5, options: ["Confiança", "Desejo", "Calma", "Autoridade", "Proximidade", "Cuidado", "Sofisticação", "Energia", "Segurança", "Curiosidade", "Exclusividade", "Leveza", "Afeto", "Precisão"], note: "Qual dessas sensações é a mais importante?" },
      { topic: "Riscos de percepção", text: "Que impressão errada a marca não pode passar?", hint: "Ex.: “não pode parecer barata, infantil, fria, genérica, bagunçada ou distante demais.”", type: "long" }
    ]
  },
  {
    title: "Personalidade visual",
    description: "Onde a marca se posiciona entre extremos — e o vocabulário que a define.",
    questions: [
      { topic: "Palavras-chave", text: "Escolha até 5 palavras que combinam com a marca.", hint: "", type: "multi", limit: 5, options: ["Clara", "Elegante", "Afetiva", "Técnica", "Natural", "Urbana", "Premium", "Acessível", "Discreta", "Marcante", "Minimalista", "Detalhada", "Artesanal", "Digital", "Calma", "Intensa", "Tradicional", "Atual"], note: "Explique em uma frase as duas palavras mais importantes." },
      { topic: "Palavras a evitar", text: "Escolha até 5 palavras que não combinam com a marca.", hint: "", type: "multi", limit: 5, options: ["Infantil", "Fria", "Luxuosa demais", "Popular demais", "Genérica", "Datada", "Barulhenta", "Séria demais", "Divertida demais", "Técnica demais", "Romântica demais", "Colorida demais", "Minimalista demais", "Corporativa demais", "Improvisada"], note: "Alguma dessas palavras precisa ser evitada a qualquer custo?" },
      { topic: "Espectro", text: "Sua marca deve parecer mais séria ou mais descontraída?", type: "slider",
        left: { label: "Séria", examples: "IBM, Rolex, LinkedIn", desc: "Passa estabilidade, controle e confiança." },
        right: { label: "Descontraída", examples: "Duolingo, Ben & Jerry’s, Netflix", desc: "Passa leveza, proximidade e espontaneidade." },
        note: "Por que esse ponto combina com a marca?" },
      { topic: "Espectro", text: "Sua marca deve parecer mais discreta ou mais expressiva?", type: "slider",
        left: { label: "Discreta", examples: "Muji, Aesop, Uniqlo", desc: "Visual mais limpo, silencioso e controlado." },
        right: { label: "Expressiva", examples: "Spotify, Burger King, Melissa", desc: "Visual mais marcante, energético e fácil de reconhecer." },
        note: "Por que esse ponto combina com a marca?" },
      { topic: "Espectro", text: "Sua marca deve parecer mais acessível ou mais exclusiva?", type: "slider",
        left: { label: "Acessível", examples: "Havaianas, iFood, Decathlon", desc: "Parece próxima, fácil de entender e aberta." },
        right: { label: "Exclusiva", examples: "Chanel, Rolex, Fasano", desc: "Parece seletiva, refinada e de maior valor percebido." },
        note: "Por que esse ponto combina com a marca?" },
      { topic: "Espectro", text: "Sua marca deve parecer mais racional ou mais sensorial?", type: "slider",
        left: { label: "Racional", examples: "IBM, Bloomberg, Google Cloud", desc: "Passa método, clareza e decisão objetiva." },
        right: { label: "Sensorial", examples: "Le Labo, Nespresso, Lush", desc: "Passa experiência, textura, desejo e atmosfera." },
        note: "Por que esse ponto combina com a marca?" },
      { topic: "Espectro", text: "Sua marca deve parecer mais minimalista ou mais rica em detalhes?", type: "slider",
        left: { label: "Minimalista", examples: "Apple, Muji, The Row", desc: "Usa poucos elementos e mais respiro." },
        right: { label: "Rica em detalhes", examples: "Gucci, Farm Rio, Granado", desc: "Usa texturas, padrões, camadas e mais expressão." },
        note: "Por que esse ponto combina com a marca?" },
      { topic: "Espectro", text: "Sua marca deve parecer mais tradicional ou mais atual?", type: "slider",
        left: { label: "Tradicional", examples: "Hermès, Montblanc, Tiffany & Co.", desc: "Passa herança, permanência e reputação." },
        right: { label: "Atual", examples: "Airbnb, Notion, Nubank", desc: "Passa movimento, adaptação e linguagem mais recente." },
        note: "Por que esse ponto combina com a marca?" },
      { topic: "Espectro (opcional)", text: "Sua marca deve parecer mais calma ou mais energética?", type: "slider", optional: true,
        left: { label: "Calma", examples: "Calm, Aesop, Headspace", desc: "Passa pausa, cuidado e conforto." },
        right: { label: "Energética", examples: "Nike, Red Bull, Spotify", desc: "Passa ação, ritmo e presença." },
        note: "Por que esse ponto combina com a marca?" },
      { topic: "Espectro (opcional)", text: "Sua marca deve parecer mais institucional ou mais afetiva?", type: "slider", optional: true,
        left: { label: "Institucional", examples: "Itaú, Sebrae, Deloitte", desc: "Passa estrutura, credibilidade e escala." },
        right: { label: "Afetiva", examples: "Natura, Dove, Airbnb", desc: "Passa vínculo, cuidado e proximidade." },
        note: "Por que esse ponto combina com a marca?" }
    ]
  },
  {
    title: "Referências e limites",
    description: "O que admirar, o que evitar e o que fica fora de questão.",
    questions: [
      { topic: "Referências", text: "Quais marcas você acha visualmente interessantes?", hint: "Pode ser marca de qualquer segmento. Para cada uma, escreva nome, link (se tiver) e o que você gosta nela — um item por linha.", type: "links" },
      { topic: "Anti-referências", text: "Quais marcas ou estilos você quer evitar?", hint: "Ex.: “não quero parecer clínica popular”, “não gosto de marcas muito coloridas”, “não quero estética de Canva”, “não quero parecer igual aos concorrentes.”", type: "long" },
      { topic: "Limites visuais", text: "Existe alguma cor, símbolo ou elemento que você quer evitar?", hint: "Ex.: “evitar roxo porque lembra concorrente”, “não usar folha”, “não usar ícone de casa”, “não usar cruz de saúde.”", type: "long" },
      { topic: "Possibilidades", text: "Existe alguma cor, símbolo, objeto ou ideia que você gostaria de considerar?", hint: "Ex.: “tons terrosos”, “referência ao mar”, “algo ligado à cidade”, “um símbolo de proteção”, “texturas naturais.”", type: "long", optional: true }
    ]
  },
  {
    title: "Uso da marca",
    description: "Onde essa identidade vai viver primeiro e o que ela precisa suportar.",
    questions: [
      { topic: "Aplicações", text: "Onde essa marca vai aparecer primeiro?", hint: "Escolha até 5.", type: "multi", limit: 5, options: ["Instagram", "Site", "WhatsApp", "Fachada", "Embalagem", "Uniforme", "Cartão", "Apresentação comercial", "Proposta em PDF", "Cardápio", "Etiqueta", "Sacola", "Produto físico", "Anúncios", "Loja online"], note: "Qual aplicação é mais importante?" },
      { topic: "Limitações práticas", text: "Existe alguma limitação prática?", hint: "Ex.: “precisa funcionar bordado”, “vai ser impresso em uma cor”, “precisa funcionar pequeno”, “será usado em fachada escura.”", type: "long", optional: true }
    ]
  },
  {
    title: "Fechamento",
    description: "Os sinais que vão nos dizer se a direção visual acertou.",
    questions: [
      { topic: "Aprovação", text: "O que faria você sentir que a marca ficou certa?", hint: "Ex.: “se ela parecer mais madura, confiável e pronta para atrair clientes de maior valor.”", type: "long" },
      { topic: "Reprovação", text: "O que faria você reprovar a direção visual?", hint: "Ex.: “se parecer infantil, genérica, fria demais ou parecida com os concorrentes.”", type: "long" },
      { topic: "Observações", text: "Quer deixar alguma observação final?", hint: "", type: "long", optional: true }
    ]
  }
];

const questions = [];
sections.forEach((section, sectionIndex) => {
  section.questions.forEach(q => {
    questions.push({ ...q, sectionIndex, id: `q${questions.length + 1}` });
  });
});

const state = { current: 0, answers: {}, started: false, completed: false };
const $ = id => document.getElementById(id);
const screens = [...document.querySelectorAll(".screen")];
let db;
let saveTimer;
let wheelTotal = 0;
let navigationLocked = false;

function showScreen(id) {
  screens.forEach(screen => screen.classList.toggle("active", screen.id === id));
  const view = id === "introScreen" ? "intro" : id === "sectionScreen" ? "section" : id === "completionScreen" ? "complete" : "question";
  document.body.dataset.view = view;
  window.scrollTo(0, 0);
}

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("dispoBriefing", 2);
    request.onupgradeneeded = () => request.result.createObjectStore("briefings", { keyPath: "id" });
    request.onsuccess = () => { db = request.result; resolve(); };
    request.onerror = () => reject(request.error);
  });
}

async function loadState() {
  if (!db) return;
  const saved = await new Promise(resolve => {
    const request = db.transaction("briefings").objectStore("briefings").get("current");
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => resolve(null);
  });
  if (saved) Object.assign(state, saved.data);
}

function persist() {
  if (state.started) updateNextButtonState();
  if (!db) return;
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    const transaction = db.transaction("briefings", "readwrite");
    transaction.objectStore("briefings").put({ id: "current", updatedAt: new Date().toISOString(), data: state });
  }, 220);
}

function noteKey(q) { return `${q.id}__note`; }

function renderInput(q) {
  const textarea = $("answerInput");
  const choiceGroup = $("choiceGroup");
  const sliderGroup = $("sliderGroup");
  const noteField = $("noteField");
  const noteInput = $("noteInput");

  $("answerLabel").style.display = "none";
  textarea.style.display = "none";
  choiceGroup.style.display = "none";
  sliderGroup.style.display = "none";
  noteField.style.display = "none";
  $("answerField").classList.remove("side-by-side");

  if (q.type === "short" || q.type === "long" || q.type === "links") {
    $("answerLabel").style.display = "block";
    textarea.style.display = "block";
    textarea.rows = q.type === "short" ? 1 : 4;
    textarea.placeholder = q.type === "links" ? "Um link por linha..." : "Escreva com suas palavras...";
    textarea.value = state.answers[q.id] || "";
  } else if (q.type === "single" || q.type === "multi") {
    choiceGroup.style.display = "flex";
    const selected = q.type === "multi" ? (state.answers[q.id] || []) : [state.answers[q.id]].filter(Boolean);
    choiceGroup.innerHTML = q.options.map(option => {
      const isActive = selected.includes(option);
      return `<button type="button" class="choice-pill${isActive ? " selected" : ""}" data-option="${encodeURIComponent(option)}">${option}</button>`;
    }).join("");
    choiceGroup.querySelectorAll(".choice-pill").forEach(button => {
      button.addEventListener("click", () => {
        const option = decodeURIComponent(button.dataset.option);
        if (q.type === "single") {
          state.answers[q.id] = option;
        } else {
          const current = state.answers[q.id] || [];
          if (current.includes(option)) {
            state.answers[q.id] = current.filter(item => item !== option);
          } else {
            if (current.length >= (q.limit || Infinity)) { toast(`Escolha até ${q.limit}`); return; }
            state.answers[q.id] = [...current, option];
          }
        }
        persist();
        renderInput(q);
      });
    });
    if (q.note) {
      noteField.style.display = "block";
      $("noteLabel").textContent = q.note;
      noteInput.value = state.answers[noteKey(q)] || "";
    }
    $("answerField").classList.toggle("side-by-side", Boolean(q.note));
  } else if (q.type === "slider") {
    sliderGroup.style.display = "block";
    $("sliderLeftLabel").textContent = q.left.label;
    $("sliderLeftExamples").textContent = q.left.examples;
    $("sliderLeftDesc").textContent = q.left.desc;
    $("sliderRightLabel").textContent = q.right.label;
    $("sliderRightExamples").textContent = q.right.examples;
    $("sliderRightDesc").textContent = q.right.desc;
    const range = $("sliderRange");
    range.value = state.answers[q.id] || 3;
    range.oninput = () => { state.answers[q.id] = Number(range.value); persist(); };
    if (q.note) {
      noteField.style.display = "block";
      $("noteLabel").textContent = q.note;
      noteInput.value = state.answers[noteKey(q)] || "";
    }
  }
}

function renderQuestion(direction = null) {
  const q = questions[state.current];
  if (!q) return finish();
  const section = sections[q.sectionIndex];
  const update = () => {
    $("sectionLabel").textContent = `${String(q.sectionIndex + 1).padStart(2, "0")} — ${section.title}`;
    $("progressCount").textContent = `${String(state.current + 1).padStart(2, "0")} / ${questions.length}`;
    $("progressBar").style.width = `${((state.current + 1) / questions.length) * 100}%`;
    $("questionNumber").textContent = String(state.current + 1).padStart(2, "0");
    $("topicLabel").textContent = q.topic;
    $("questionText").textContent = q.text;
    $("questionText").classList.toggle("long-heading", q.text.length > 45);
    $("questionHint").textContent = q.hint || "";
    renderInput(q);
    $("backButton").style.visibility = state.current === 0 ? "hidden" : "visible";
    updateNextButtonState();
    $("skipButton").textContent = hasAnswer(q) ? "Limpar resposta" : "Prefiro responder depois";
    if (q.type === "short" || q.type === "long" || q.type === "links") $("answerInput").focus({ preventScroll: true });
  };
  updateCosmos();
  updateNavCurrent();
  if (!direction) return update();
  const animationClass = direction === "back" ? "changing-back" : "changing-forward";
  $("questionCard").classList.add(animationClass);
  setTimeout(update, 320);
  setTimeout(() => $("questionCard").classList.remove(animationClass), 740);
}

function hasAnswer(q) {
  const value = state.answers[q.id];
  if (Array.isArray(value)) return value.length > 0;
  return value !== undefined && value !== "" && value !== null;
}

function firstMissingRequiredIndex() {
  return questions.findIndex(q => !q.optional && !hasAnswer(q));
}

function goToQuestion(index) {
  state.current = index;
  state.started = true;
  persist();
  showScreen("questionScreen");
  renderQuestion();
}

function updateNextButtonState() {
  const button = $("nextButton");
  const isLast = state.current === questions.length - 1;
  if (!isLast) {
    button.classList.remove("is-incomplete");
    button.innerHTML = '<span class="btn-label">Continuar</span><span class="btn-icon">→</span>';
    return;
  }
  const incomplete = firstMissingRequiredIndex() !== -1;
  button.classList.toggle("is-incomplete", incomplete);
  button.innerHTML = incomplete
    ? '<span class="btn-label">Completar respostas</span><span class="btn-icon">→</span>'
    : '<span class="btn-label">Concluir</span><span class="btn-icon">→</span>';
}

function updateCosmos() {
  const sectionProgress = questions[state.current]?.sectionIndex || 0;
  const questionProgress = state.current || 0;
  const cosmos = $("cosmos");
  const sectionAngles = [
    [0, 0, 0],
    [18, 42, -8],
    [-22, 78, 16],
    [32, 124, -14],
    [-28, 168, 22],
    [16, 216, -24],
    [-18, 268, 12]
  ];
  const [x, y, z] = sectionAngles[sectionProgress] || sectionAngles[0];
  cosmos.style.setProperty("--section-x", `${x}deg`);
  cosmos.style.setProperty("--section-y", `${y}deg`);
  cosmos.style.setProperty("--section-z", `${z}deg`);
  cosmos.style.setProperty("--q1", `${Math.sin(questionProgress * .73) * 18}deg`);
  cosmos.style.setProperty("--q2", `${Math.sin(questionProgress * .51 + .8) * 22}deg`);
  cosmos.style.setProperty("--q3", `${Math.cos(questionProgress * .61 + .3) * 17}deg`);
  cosmos.style.setProperty("--q4", `${Math.sin(questionProgress * .43 + 1.7) * 20}deg`);
  cosmos.style.setProperty("--q5", `${Math.cos(questionProgress * .57 + 2.1) * 16}deg`);
  cosmos.style.setProperty("--q6", `${Math.sin(questionProgress * .67 + 2.8) * 24}deg`);
}

function saveAnswer() {
  const q = questions[state.current];
  if (q.type === "short" || q.type === "long" || q.type === "links") {
    const value = $("answerInput").value.trim();
    if (value) state.answers[q.id] = value;
    else delete state.answers[q.id];
  }
  if (q.note) {
    const noteValue = $("noteInput").value.trim();
    if (noteValue) state.answers[noteKey(q)] = noteValue;
    else delete state.answers[noteKey(q)];
  }
  persist();
}

function nextQuestion() {
  saveAnswer();
  if (state.current >= questions.length - 1) {
    const missingIndex = firstMissingRequiredIndex();
    if (missingIndex !== -1) {
      goToQuestion(missingIndex);
      toast("Responda as perguntas obrigatórias para concluir");
      return;
    }
    return finish();
  }
  const oldSection = questions[state.current].sectionIndex;
  state.current++;
  persist();
  const newSection = questions[state.current].sectionIndex;
  if (newSection !== oldSection) return showSectionBreak(newSection);
  renderQuestion("forward");
}

function previousQuestion() {
  if (state.current === 0) return;
  saveAnswer();
  state.current--;
  persist();
  renderQuestion("back");
}

function scrollNavigate(direction) {
  if (navigationLocked) return;
  const questionActive = document.getElementById("questionScreen").classList.contains("active");
  const sectionActive = document.getElementById("sectionScreen").classList.contains("active");
  if (questionActive) {
    navigationLocked = true;
    direction > 0 ? nextQuestion() : previousQuestion();
    setTimeout(() => { navigationLocked = false; wheelTotal = 0; }, 900);
  } else if (sectionActive && direction > 0) {
    navigationLocked = true;
    showScreen("questionScreen");
    renderQuestion();
    setTimeout(() => { navigationLocked = false; wheelTotal = 0; }, 900);
  }
}

function showSectionBreak(index) {
  $("breakIndex").textContent = `Seção ${String(index + 1).padStart(2, "0")} de ${String(sections.length).padStart(2, "0")}`;
  $("breakTitle").textContent = sections[index].title;
  $("breakDescription").textContent = sections[index].description;
  updateCosmos();
  updateNavCurrent();
  showScreen("sectionScreen");
}

function finish() {
  saveAnswer();
  state.completed = true;
  persist();
  showScreen("completionScreen");
  submitBriefing();
}

let supabaseClient;
function getSupabase() {
  if (supabaseClient) return supabaseClient;
  if (!window.supabase || !window.SUPABASE_URL || window.SUPABASE_URL.includes("SEU-PROJETO")) return null;
  supabaseClient = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
  return supabaseClient;
}

function formatAnswer(q) {
  const value = state.answers[q.id];
  let text = "";
  if (q.type === "slider") {
    if (value === undefined) return null;
    text = `${value}/5 — ${q.left.label} (1) a ${q.right.label} (5)`;
  } else if (Array.isArray(value)) {
    if (!value.length) return null;
    text = value.join(", ");
  } else {
    if (!value) return null;
    text = value;
  }
  const note = state.answers[noteKey(q)];
  if (note) text += `\n${q.note}: ${note}`;
  return text;
}

async function submitBriefing() {
  const client = getSupabase();
  if (!client || state.submitted) return;
  const readableAnswers = {};
  questions.forEach(q => {
    const formatted = formatAnswer(q);
    if (formatted) readableAnswers[q.text] = formatted;
  });
  const { error } = await client.from("briefings").insert({ answers: readableAnswers });
  if (error) { toast("Não foi possível enviar o briefing para a nuvem"); return; }
  state.submitted = true;
  persist();
  toast("Briefing enviado para processamento");
}

function buildNav() {
  $("sectionNav").innerHTML = sections.map((section, index) => {
    return `<button class="nav-section" data-section="${index}">
      <small>${String(index + 1).padStart(2, "0")}</small><strong>${section.title}</strong>
    </button>`;
  }).join("");
  document.querySelectorAll(".nav-section").forEach(button => button.addEventListener("click", () => {
    const index = Number(button.dataset.section);
    goToQuestion(questions.findIndex(q => q.sectionIndex === index));
  }));
  updateNavCurrent();
}

function updateNavCurrent() {
  const currentSection = questions[state.current]?.sectionIndex ?? 0;
  document.querySelectorAll(".nav-section").forEach(button => {
    button.classList.toggle("current", Number(button.dataset.section) === currentSection);
  });
}

function toast(message) {
  $("toast").textContent = message;
  $("toast").classList.add("show");
  setTimeout(() => $("toast").classList.remove("show"), 1800);
}

$("startButton").addEventListener("click", () => {
  if (state.completed) { showScreen("completionScreen"); return; }
  if (state.started) { showScreen("questionScreen"); renderQuestion(); return; }
  state.started = true;
  persist();
  showSectionBreak(0);
});
document.querySelector(".brand").addEventListener("click", event => {
  event.preventDefault();
  saveAnswer();
  showScreen("introScreen");
});
$("sectionContinue").addEventListener("click", () => { showScreen("questionScreen"); renderQuestion(); });
$("nextButton").addEventListener("click", nextQuestion);
$("backButton").addEventListener("click", previousQuestion);
$("answerInput").addEventListener("input", () => { saveAnswer(); $("skipButton").textContent = hasAnswer(questions[state.current]) ? "Limpar resposta" : "Prefiro responder depois"; });
$("answerInput").addEventListener("keydown", event => { if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) nextQuestion(); });
$("noteInput").addEventListener("input", saveAnswer);
window.addEventListener("wheel", event => {
  if (matchMedia("(max-width: 700px)").matches) return;
  const navigable = document.getElementById("questionScreen").classList.contains("active") || document.getElementById("sectionScreen").classList.contains("active");
  if (!navigable) return;
  if (event.target.closest(".choice-group, .slider-group, textarea")) return;
  const doc = document.documentElement;
  const scrollable = doc.scrollHeight > window.innerHeight + 2;
  if (scrollable) {
    const atBottom = window.scrollY + window.innerHeight >= doc.scrollHeight - 2;
    const atTop = window.scrollY <= 2;
    if (event.deltaY > 0 && !atBottom) { wheelTotal = 0; return; }
    if (event.deltaY < 0 && !atTop) { wheelTotal = 0; return; }
  }
  wheelTotal += event.deltaY;
  if (Math.abs(wheelTotal) > 65) scrollNavigate(wheelTotal);
}, { passive: true });
window.addEventListener("pointermove", event => {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const x = (event.clientX / innerWidth - .5) * 10;
  const y = (event.clientY / innerHeight - .5) * -8;
  $("cosmos").style.setProperty("--mouse-x", `${x}deg`);
  $("cosmos").style.setProperty("--mouse-y", `${y}deg`);
}, { passive: true });
$("skipButton").addEventListener("click", () => {
  const q = questions[state.current];
  if (hasAnswer(q)) {
    delete state.answers[q.id];
    delete state.answers[noteKey(q)];
    persist();
    renderQuestion();
    $("skipButton").textContent = "Prefiro responder depois";
    toast("Resposta removida");
  } else nextQuestion();
});
(async function init() {
  try { await openDatabase(); await loadState(); } catch { toast("Não foi possível acessar o armazenamento local"); }
  buildNav();
})();
