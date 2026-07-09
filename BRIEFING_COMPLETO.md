# Briefing Interativo — Conteúdo Completo

Este documento reúne **todo** o conteúdo do briefing (telas estáticas, textos de apoio, todas as perguntas e opções) e do assistente manual de geração de prompts usado no Hub Admin.

---

## 1. Telas estáticas do wizard

### Tela de introdução
- Eyebrow: `Briefing de marca · 2026`
- Título: **"Boas ideias começam com boas perguntas."**
- Meta: "As informações que vamos usar para criar a direção visual."
- Texto: "Este briefing reúne as informações que vamos usar para criar a direção visual da sua marca. Responda com exemplos, links e observações práticas. Quanto mais claro for o ponto de partida, mais precisa será a criação."
- Botão: `Começar briefing →`
- Nota lateral: "Leva cerca de 10 minutos"

### Elementos recorrentes das telas de pergunta
- Progresso: label da seção (ex. "01 · Essencial") + contador ("01 / 01")
- Marcador de obrigatoriedade: `*` com tooltip "Obrigatório"
- Placeholder padrão (short/long): "Escreva com suas palavras..."
- Placeholder (links): "Um link por linha..."
- Placeholder do campo de nota complementar: "Escreva aqui..."
- Botão voltar: `← Anterior`
- Botão pular: alterna entre "Prefiro responder depois" e "Limpar resposta" (se já respondido)
- Botão avançar:
  - Normal: `Continuar →`
  - Última pergunta, com obrigatórias faltando: `Completar respostas →`
  - Última pergunta, tudo respondido: `Concluir →`
  - Perseguindo pendências: `Próxima pendência →` / `Concluir →`
- Dica de teclado: "Role ou pressione Ctrl + Enter para continuar"

### Tela de abertura de seção
- Eyebrow: "Seção 0N"
- Título e descrição: os da seção correspondente
- Botão: `Entrar nesta seção →`

### Tela de conclusão
- Eyebrow: "Briefing enviado"
- Título: "Agora temos um bom lugar para começar."
- Texto: "Suas respostas foram enviadas para processamento. A partir daqui, elas serão organizadas em uma direção visual para a criação da sua marca."
- Fallback (se o envio ao Supabase falhar): "Não foi possível enviar automaticamente. Baixe suas respostas para não perder nada e nos envie por e-mail ou WhatsApp." — botões: "Baixar respostas (.md)" e "Tentar enviar novamente"

### Toasts (mensagens rápidas)
- "Escolha até {limit}"
- "Responda esta pergunta para continuar"
- "Responda as perguntas obrigatórias para concluir"
- "Não foi possível enviar o briefing para a nuvem"
- "Briefing enviado para processamento"
- "Resposta removida"
- "Reenviando..."
- "Respostas baixadas"
- "Não foi possível acessar o armazenamento local"

---

## 2. Perguntas do briefing — 7 seções, 29 perguntas

Legenda: **Tópico** · Pergunta · *Texto de apoio (hint)* · `tipo` · opções · nota complementar · (opcional)

### Seção 1 — "O essencial"
> O ponto de partida: quem é a marca e o que ela precisa nascer ou se tornar.

**1. Identificação** — Qual é o nome da marca?
`short`

**2. Identificação** — Como você descreveria a marca em poucas frases?
*Explique o que ela vende, para quem vende e o que faz de diferente. Ex.: "é uma clínica de estética voltada para mulheres que buscam procedimentos naturais, com atendimento próximo e visual mais sofisticado."*
`long`

---

### Seção 2 — "Momento da marca"
> O que já existe, o que está mudando e onde podemos ver isso hoje.

**3. Situação** — Este projeto é para qual situação?
`single`
- Marca nova, começando a aparecer agora
- Redesign de uma marca existente
- Ajuste visual de uma marca que já existe
- Identidade para um produto, serviço ou projeto específico

**4. Mudança** — O que precisa mudar ou nascer com este projeto?
*Ex. marca nova: "precisamos criar uma imagem confiável para lançar o negócio." Ex. redesign: "a marca atual parece simples demais para o público que queremos atrair."*
`long`

**5. Ponto de partida** — Existe algum lugar onde podemos ver a marca, o negócio ou referências do projeto hoje? *(opcional)*
*Pode ser Instagram, site, perfil pessoal, loja online, pasta pública, Pinterest, concorrente, referência visual ou qualquer link que ajude a entender o ponto de partida. Cole um link por linha.*
`links`

---

### Seção 3 — "Público e percepção"
> Para quem essa marca fala, e o que ela precisa fazer essas pessoas sentirem.

**6. Público principal** — Quem é o principal público da marca?
*Não precisa criar uma persona completa. Explique quem compra, quem decide ou quem precisa confiar na marca. Ex.: "mulheres de 30 a 50 anos, com renda média alta, que valorizam estética natural e atendimento cuidadoso."*
`long`

**7. Outros públicos** — Existe outro público importante? *(opcional)*
*Ex.: "arquitetos que indicam a loja", "pais que pagam pelo serviço", "sócios que aprovam", "empresas que contratam para eventos."*
`short`

**8. Público desejado** — Que tipo de público você quer atrair mais?
*Ex.: "clientes com maior poder de compra, que valorizem projeto completo e não comparem apenas por preço."*
`long`

**9. Sensações** — O que a marca precisa fazer as pessoas sentirem?
*Escolha até 5.*
`multi` (limite 5)
- Confiança, Desejo, Calma, Autoridade, Proximidade, Cuidado, Sofisticação, Energia, Segurança, Curiosidade, Exclusividade, Leveza, Afeto, Precisão

Nota complementar: "Qual dessas sensações é a mais importante?"

**10. Riscos de percepção** — Que impressão errada a marca não pode passar?
*Ex.: "não pode parecer barata, infantil, fria, genérica, bagunçada ou distante demais."*
`long`

---

### Seção 4 — "Personalidade visual"
> Onde a marca se posiciona entre extremos, e o vocabulário que a define.

**11. Palavras-chave** — Escolha até 5 palavras que combinam com a marca.
`multi` (limite 5)
- Clara, Elegante, Afetiva, Técnica, Natural, Urbana, Premium, Acessível, Discreta, Marcante, Minimalista, Detalhada, Artesanal, Digital, Calma, Intensa, Tradicional, Atual

Nota complementar: "Explique em uma frase as duas palavras mais importantes."

**12. Palavras a evitar** — Escolha até 5 palavras que não combinam com a marca.
`multi` (limite 5)
- Infantil, Fria, Luxuosa demais, Popular demais, Genérica, Datada, Barulhenta, Séria demais, Divertida demais, Técnica demais, Romântica demais, Colorida demais, Minimalista demais, Corporativa demais, Improvisada

Nota complementar: "Alguma dessas palavras precisa ser evitada a qualquer custo?"

**13. Espectro** — Sua marca deve parecer mais séria ou mais descontraída?
`slider` (1–5, padrão 3)
- Esquerda: **Séria** — exemplos: IBM, Rolex, LinkedIn — "Passa estabilidade, controle e confiança."
- Direita: **Descontraída** — exemplos: Duolingo, Ben & Jerry's, Netflix — "Passa leveza, proximidade e espontaneidade."
- Nota complementar: "Por que esse ponto combina com a marca?"

**14. Espectro** — Sua marca deve parecer mais discreta ou mais expressiva?
- Esquerda: **Discreta** — exemplos: Muji, Aesop, Uniqlo — "Visual mais limpo, silencioso e controlado."
- Direita: **Expressiva** — exemplos: Spotify, Burger King, Melissa — "Visual mais marcante, energético e fácil de reconhecer."
- Nota complementar: "Por que esse ponto combina com a marca?"

**15. Espectro** — Sua marca deve parecer mais acessível ou mais exclusiva?
- Esquerda: **Acessível** — exemplos: Havaianas, iFood, Decathlon — "Parece próxima, fácil de entender e aberta."
- Direita: **Exclusiva** — exemplos: Chanel, Rolex, Fasano — "Parece seletiva, refinada e de maior valor percebido."
- Nota complementar: "Por que esse ponto combina com a marca?"

**16. Espectro** — Sua marca deve parecer mais racional ou mais sensorial?
- Esquerda: **Racional** — exemplos: IBM, Bloomberg, Google Cloud — "Passa método, clareza e decisão objetiva."
- Direita: **Sensorial** — exemplos: Le Labo, Nespresso, Lush — "Passa experiência, textura, desejo e atmosfera."
- Nota complementar: "Por que esse ponto combina com a marca?"

**17. Espectro** — Sua marca deve parecer mais minimalista ou mais rica em detalhes?
- Esquerda: **Minimalista** — exemplos: Apple, Muji, The Row — "Usa poucos elementos e mais respiro."
- Direita: **Rica em detalhes** — exemplos: Gucci, Farm Rio, Granado — "Usa texturas, padrões, camadas e mais expressão."
- Nota complementar: "Por que esse ponto combina com a marca?"

**18. Espectro** — Sua marca deve parecer mais tradicional ou mais atual?
- Esquerda: **Tradicional** — exemplos: Hermès, Montblanc, Tiffany & Co. — "Passa herança, permanência e reputação."
- Direita: **Atual** — exemplos: Airbnb, Notion, Nubank — "Passa movimento, adaptação e linguagem mais recente."
- Nota complementar: "Por que esse ponto combina com a marca?"

**19. Espectro** *(opcional)* — Sua marca deve parecer mais calma ou mais energética?
- Esquerda: **Calma** — exemplos: Calm, Aesop, Headspace — "Passa pausa, cuidado e conforto."
- Direita: **Energética** — exemplos: Nike, Red Bull, Spotify — "Passa ação, ritmo e presença."
- Nota complementar: "Por que esse ponto combina com a marca?"

**20. Espectro** *(opcional)* — Sua marca deve parecer mais institucional ou mais afetiva?
- Esquerda: **Institucional** — exemplos: Itaú, Sebrae, Deloitte — "Passa estrutura, credibilidade e escala."
- Direita: **Afetiva** — exemplos: Natura, Dove, Airbnb — "Passa vínculo, cuidado e proximidade."
- Nota complementar: "Por que esse ponto combina com a marca?"

> Todos os sliders usam escala 1–5, valor padrão 3, com marcações em cada um dos 5 pontos.

---

### Seção 5 — "Referências e limites"
> O que admirar, o que evitar e o que fica fora de questão.

**21. Referências** — Quais marcas você acha visualmente interessantes?
*Pode ser marca de qualquer segmento. Para cada uma, escreva nome, link (se tiver) e o que você gosta nela, um item por linha.*
`links`

**22. Anti-referências** — Quais marcas ou estilos você quer evitar?
*Ex.: "não quero parecer clínica popular", "não gosto de marcas muito coloridas", "não quero estética de Canva", "não quero parecer igual aos concorrentes."*
`long`

**23. Limites visuais** — Existe alguma cor, símbolo ou elemento que você quer evitar?
*Ex.: "evitar roxo porque lembra concorrente", "não usar folha", "não usar ícone de casa", "não usar cruz de saúde."*
`long`

**24. Possibilidades** *(opcional)* — Existe alguma cor, símbolo, objeto ou ideia que você gostaria de considerar?
*Ex.: "tons terrosos", "referência ao mar", "algo ligado à cidade", "um símbolo de proteção", "texturas naturais."*
`long`

---

### Seção 6 — "Uso da marca"
> Onde essa identidade vai viver primeiro e o que ela precisa suportar.

**25. Aplicações** — Onde essa marca vai aparecer primeiro?
*Escolha até 5.*
`multi` (limite 5)
- Instagram, Site, WhatsApp, Fachada, Embalagem, Uniforme, Cartão, Apresentação comercial, Proposta em PDF, Cardápio, Etiqueta, Sacola, Produto físico, Anúncios, Loja online

Nota complementar: "Qual aplicação é mais importante?"

**26. Limitações práticas** *(opcional)* — Existe alguma limitação prática?
*Ex.: "precisa funcionar bordado", "vai ser impresso em uma cor", "precisa funcionar pequeno", "será usado em fachada escura."*
`long`

---

### Seção 7 — "Fechamento"
> Os sinais que vão nos dizer se a direção visual acertou.

**27. Aprovação** — O que faria você sentir que a marca ficou certa?
*Ex.: "se ela parecer mais madura, confiável e pronta para atrair clientes de maior valor."*
`long`

**28. Reprovação** — O que faria você reprovar a direção visual?
*Ex.: "se parecer infantil, genérica, fria demais ou parecida com os concorrentes."*
`long`

**29. Observações** *(opcional)* — Quer deixar alguma observação final?
`long`

---

## 3. Assistente manual de prompts (Hub Admin)

Fallback para gerar o resultado do briefing "na mão" (copiar/colar em qualquer chat de IA), espelhando a function `supabase/functions/process-briefing`. Resultado final é organizado em 7 campos:

| chave | rótulo |
|---|---|
| modeloEscolhido | Modelo mental escolhido |
| caminhos | Caminhos gerados |
| autocritica | Autocrítica |
| caminhoFinal | Caminho final |
| persona | Persona de redação |
| referenciasVisuais | Referências visuais |
| promptImagem | Prompt de imagem |

### Conteúdo de apoio usado nos prompts

**Modelos mentais (`MODELOS_MENTAIS`):**
```
- Jobs to be Done: o que o cliente está "contratando" o produto/serviço para fazer
- Primeiros princípios: quebrar o problema em verdades básicas e reconstruir dali
- Golden Circle (Simon Sinek): por quê -> como -> o quê
- Blue Ocean Strategy: onde criar espaço de mercado não disputado
- Behavioral design / gatilhos comportamentais: o que motiva a ação do público
```

**Checklist anti-vícios de IA (`VICIOS_IA`):**
```
- Evite frases de efeito genéricas ("no mundo dinâmico de hoje...")
- Evite excesso de adjetivos vazios (incrível, revolucionário, único)
- Evite listas artificiais quando um parágrafo corrido é mais natural
- Prefira afirmações concretas e específicas a generalidades
- Evite repetir a pergunta do usuário como abertura da resposta
```

`formatBriefingText(answers)` transforma as respostas em pares `P: {pergunta}\nR: {resposta}`, separados por linha em branco — isso vira o `ctx.briefingText` usado nos prompts abaixo.

### Os 7 passos (prompts sequenciais)

**Passo 1 — "Modelo mental escolhido"**
- Sistema: "Você analisa briefings de projeto e escolhe, entre os modelos mentais abaixo, o que melhor se aplica ao caso. Responda com o nome do modelo escolhido e 2-3 frases explicando por quê.\n\nModelos mentais disponíveis:\n" + `MODELOS_MENTAIS`
- Usuário: texto completo do briefing (`ctx.briefingText`)

**Passo 2 — "Caminhos estratégicos"**
- Sistema: "Você é um estrategista de projeto. A partir do briefing e do modelo mental escolhido, gere de 3 a 5 caminhos estratégicos distintos e viáveis. Para cada caminho, dê um nome curto e 2-3 frases de justificativa."
- Usuário: `Briefing:\n{briefingText}\n\nModelo mental escolhido:\n{modeloEscolhido}`

**Passo 3 — "Autocrítica dos caminhos"**
- Sistema: "Você é um crítico exigente. Avalie os caminhos estratégicos abaixo: aponte fraquezas, riscos e sobreposições. Diga quais caminhos são fracos e por quê."
- Usuário: saída bruta do passo 2 (`ctx.caminhos`)

**Passo 4 — "Caminho final refinado"**
- Sistema: "Com base nos caminhos propostos e na autocrítica recebida, escolha o melhor caminho (ou combine elementos de mais de um) e descreva-o de forma refinada e acionável, em um parágrafo."
- Usuário: `Caminhos:\n{caminhos}\n\nAutocrítica:\n{autocritica}`

**Passo 5 — "Persona de redação"**
- Sistema: "Crie uma persona de redator(a): tom de voz, vocabulário típico e o que evitar, para escrever os textos deste projeto. Baseie-se no caminho estratégico escolhido. Siga rigorosamente estas regras de estilo (vícios de linguagem de IA a evitar):\n" + `VICIOS_IA`
- Usuário: `ctx.caminhoFinal`

**Passo 6 — "Referências visuais"**
- Sistema: "Você é um diretor de arte. A partir do briefing e do caminho estratégico escolhido, proponha referências visuais (estilos, paletas, texturas, exemplos de mercado) e explique como a equipe de design poderia usar essas referências."
- Usuário: `Briefing:\n{briefingText}\n\nCaminho estratégico:\n{caminhoFinal}`

**Passo 7 — "Prompt de imagem"**
- Sistema: "Escreva um prompt pronto para gerar uma imagem em uma ferramenta de IA (ex: Midjourney, DALL-E, Nano Banana), em inglês, detalhado e específico, com base nas referências visuais abaixo. Também escreva 1-2 frases em português explicando a intenção da imagem."
- Usuário: `ctx.referenciasVisuais`

### Textos da interface do assistente manual (Hub Admin)

- Cabeçalho da seção: "Gerar manualmente (sem IA automática)"
- Rótulo de progresso: "Passo {N} / 7"
- Instrução de cada passo: "Copie o prompt abaixo, cole no seu GPT, e cole a resposta dele no campo abaixo."
- Botão: "Copiar prompt"
- Botão (a partir do passo 2): "Voltar ao passo anterior"
- Campo de resposta — rótulo: "Resposta do GPT" — placeholder: "Cole aqui a resposta..."
- Botão de avanço: "Salvar resposta e gerar próximo prompt"
- Mensagem ao concluir os 7 passos: "Todos os passos foram preenchidos. Salve para gravar esse resultado no briefing, do mesmo jeito que o processamento automático faria."
- Ações finais: "Salvar resultado no briefing" e "Refazer último passo"

> Rascunhos ficam salvos em `localStorage` na chave `manualDraft:{briefingId}` (por briefing, permitindo retomar depois). Ao salvar, o resultado é gravado no mesmo formato que o pipeline automático (Gemini) produziria.

---

## 4. Referências de dados de apoio (fonte)

- `data/modelos-mentais.json` e `data/checklist-anti-vicios-ia.md` — versões canônicas dos textos acima; o texto usado em runtime está hardcoded em `admin.js` (`MODELOS_MENTAIS`, `VICIOS_IA`) e deve espelhar esses arquivos.
- `supabase/functions/process-briefing` — implementação automática (via Gemini) do mesmo fluxo de 7 passos que o assistente manual replica.
