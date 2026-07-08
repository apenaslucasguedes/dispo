// Edge Function: process-briefing
// Disparada quando um novo briefing é inserido na tabela `briefings`.
// Roda o pipeline: escolha de modelo mental -> caminhos -> autocrítica -> persona
// e, em paralelo, o briefing visual/prompt de imagem.
//
// Segredos necessários (configurar com `supabase secrets set`):
//   GEMINI_API_KEY
//   SUPABASE_URL            (já injetada automaticamente)
//   SUPABASE_SERVICE_ROLE_KEY (já injetada automaticamente)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const MODEL_RASCUNHO = "gemini-2.5-flash-lite";   // caminhos, autocrítica, iteração interna
const MODEL_FINAL = "gemini-2.5-flash";           // síntese final: persona + prompt de imagem

// TODO: cole aqui o conteúdo real da sua planilha de modelos mentais.
const MODELOS_MENTAIS = `
- Jobs to be Done: o que o cliente está "contratando" o produto/serviço para fazer
- Primeiros princípios: quebrar o problema em verdades básicas e reconstruir dali
- Golden Circle (Simon Sinek): por quê -> como -> o quê
- Blue Ocean Strategy: onde criar espaço de mercado não disputado
- Behavioral design / gatilhos comportamentais: o que motiva a ação do público
`.trim();

// TODO: cole aqui o conteúdo real do seu documento de vícios de linguagem de IA.
const VICIOS_IA = `
- Evite frases de efeito genéricas ("no mundo dinâmico de hoje...")
- Evite excesso de adjetivos vazios (incrível, revolucionário, único)
- Evite listas artificiais quando um parágrafo corrido é mais natural
- Prefira afirmações concretas e específicas a generalidades
- Evite repetir a pergunta do usuário como abertura da resposta
`.trim();

async function callOpenAI(model: string, messages: { role: string; content: string }[]) {
  const apiKey = Deno.env.get("GEMINI_API_KEY");
  const systemMessage = messages.find((m) => m.role === "system")?.content ?? "";
  const userMessages = messages.filter((m) => m.role !== "system");

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemMessage }] },
        contents: userMessages.map((m) => ({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: m.content }],
        })),
        generationConfig: { temperature: 0.7 },
      }),
    },
  );
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Gemini error (${response.status}): ${text}`);
  }
  const data = await response.json();
  return data.candidates[0].content.parts[0].text as string;
}

function formatBriefing(answers: Record<string, string>) {
  return Object.entries(answers)
    .map(([question, answer]) => `P: ${question}\nR: ${answer}`)
    .join("\n\n");
}

async function runDebriefingPipeline(briefingText: string) {
  // 1. Escolher o modelo mental mais adequado
  const modeloEscolhido = await callOpenAI(MODEL_RASCUNHO, [
    {
      role: "system",
      content: `Você analisa briefings de projeto e escolhe, entre os modelos mentais abaixo, o que melhor se aplica ao caso. Responda com o nome do modelo escolhido e 2-3 frases explicando por quê.\n\nModelos mentais disponíveis:\n${MODELOS_MENTAIS}`,
    },
    { role: "user", content: briefingText },
  ]);

  // 2. Gerar caminhos possíveis usando o modelo mental escolhido
  const caminhos = await callOpenAI(MODEL_RASCUNHO, [
    {
      role: "system",
      content: "Você é um estrategista de projeto. A partir do briefing e do modelo mental escolhido, gere de 3 a 5 caminhos estratégicos distintos e viáveis. Para cada caminho, dê um nome curto e 2-3 frases de justificativa.",
    },
    { role: "user", content: `Briefing:\n${briefingText}\n\nModelo mental escolhido:\n${modeloEscolhido}` },
  ]);

  // 3. Autocrítica dos caminhos gerados
  const autocritica = await callOpenAI(MODEL_RASCUNHO, [
    {
      role: "system",
      content: "Você é um crítico exigente. Avalie os caminhos estratégicos abaixo: aponte fraquezas, riscos e sobreposições. Diga quais caminhos são fracos e por quê.",
    },
    { role: "user", content: caminhos },
  ]);

  // 4. Escolha final e refinamento
  const caminhoFinal = await callOpenAI(MODEL_RASCUNHO, [
    {
      role: "system",
      content: "Com base nos caminhos propostos e na autocrítica recebida, escolha o melhor caminho (ou combine elementos de mais de um) e descreva-o de forma refinada e acionável, em um parágrafo.",
    },
    { role: "user", content: `Caminhos:\n${caminhos}\n\nAutocrítica:\n${autocritica}` },
  ]);

  // 5. Persona para geração de textos, respeitando os vícios de IA a evitar
  const persona = await callOpenAI(MODEL_FINAL, [
    {
      role: "system",
      content: `Crie uma persona de redator(a): tom de voz, vocabulário típico e o que evitar, para escrever os textos deste projeto. Baseie-se no caminho estratégico escolhido. Siga rigorosamente estas regras de estilo (vícios de linguagem de IA a evitar):\n${VICIOS_IA}`,
    },
    { role: "user", content: caminhoFinal },
  ]);

  return { modeloEscolhido, caminhos, autocritica, caminhoFinal, persona };
}

async function runVisualPipeline(briefingText: string, caminhoFinal: string) {
  const referenciasVisuais = await callOpenAI(MODEL_RASCUNHO, [
    {
      role: "system",
      content: "Você é um diretor de arte. A partir do briefing e do caminho estratégico escolhido, proponha referências visuais (estilos, paletas, texturas, exemplos de mercado) e explique como a equipe de design poderia usar essas referências.",
    },
    { role: "user", content: `Briefing:\n${briefingText}\n\nCaminho estratégico:\n${caminhoFinal}` },
  ]);

  const promptImagem = await callOpenAI(MODEL_FINAL, [
    {
      role: "system",
      content: "Escreva um prompt pronto para gerar uma imagem em uma ferramenta de IA (ex: Midjourney, DALL-E, Nano Banana), em inglês, detalhado e específico, com base nas referências visuais abaixo. Também escreva 1-2 frases em português explicando a intenção da imagem.",
    },
    { role: "user", content: referenciasVisuais },
  ]);

  return { referenciasVisuais, promptImagem };
}

// Declaração mínima do global injetado pelo runtime de Edge Functions do Supabase.
declare const EdgeRuntime: { waitUntil(promise: Promise<unknown>): void };

async function processBriefing(briefingId: string, answers: Record<string, string>) {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
  try {
    await supabase.from("briefings").update({ status: "processando" }).eq("id", briefingId);

    const briefingText = formatBriefing(answers);
    const debriefing = await runDebriefingPipeline(briefingText);
    const visual = await runVisualPipeline(briefingText, debriefing.caminhoFinal);

    await supabase
      .from("briefings")
      .update({ status: "pronto", result: { ...debriefing, ...visual } })
      .eq("id", briefingId);
  } catch (error) {
    console.error(error);
    await supabase.from("briefings").update({ status: "erro", error: String(error) }).eq("id", briefingId);
  }
}

Deno.serve(async (req) => {
  const payload = await req.json();
  const record = payload.record ?? payload; // suporta webhook do Supabase ou chamada direta

  // O webhook do Supabase derruba a conexão após ~5s, mas o pipeline de IA leva bem
  // mais que isso. Por isso respondemos 200 na hora e processamos em segundo plano.
  EdgeRuntime.waitUntil(processBriefing(record.id, record.answers as Record<string, string>));

  return new Response(JSON.stringify({ ok: true, queued: true }), { status: 200 });
});
