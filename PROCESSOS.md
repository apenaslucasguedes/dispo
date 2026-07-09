# Processos do Briefing Interativo

Documento de referência: o que acontece do momento em que o cliente envia o briefing até o resultado final, o que existe hoje no Hub Admin, e um plano dual (curto prazo / médio-longo prazo) do que dá pra fazer a partir daqui.

---

## 1. Banco de dados (Supabase)

Uma única tabela, `briefings` ([supabase/schema.sql](supabase/schema.sql)):

| coluna | tipo | descrição |
|---|---|---|
| `id` | uuid (PK) | gerado automaticamente |
| `created_at` | timestamptz | data de recebimento |
| `client_name` | text | nome do briefing/cliente (editável no admin) |
| `answers` | jsonb | respostas do wizard, no formato `{ pergunta: resposta }` |
| `status` | text | `recebido` → `processando` → `pronto` \| `erro` |
| `result` | jsonb | os 7 campos gerados pela IA (ver seção 3) |
| `error` | text | mensagem de erro, se `status = erro` |

**Row Level Security:**
- `anon` (visitante do formulário público): só pode **inserir**.
- `authenticated` (você, logado no Hub Admin): pode ler, atualizar e excluir.

**Trigger automático:** existia um trigger que chamava a Edge Function `process-briefing` a cada `insert`. **Está desativado desde 08/07/2026** porque a cota gratuita do Gemini estourou (20 requisições/dia, 7 por briefing — ou seja, cabiam ~2-3 briefings processados automaticamente por dia). Por isso, todo briefing novo hoje fica parado em `recebido` até alguém processar manualmente pelo Hub Admin.

---

## 2. O que acontece quando um briefing chega

1. Cliente preenche o wizard (`index.html` / `app.js`) — 7 seções, 29 perguntas (conteúdo completo em [BRIEFING_COMPLETO.md](BRIEFING_COMPLETO.md)).
2. Ao concluir, `app.js` insere uma linha na tabela `briefings` com `answers` e `status = recebido`.
   - Se o envio falhar (sem internet, Supabase fora do ar), o app oferece baixar as respostas em `.md` e tentar reenviar depois.
3. **(Desativado)** Em condições normais, o insert dispararia a Edge Function `process-briefing`, que rodaria o pipeline de IA em background e atualizaria `status` e `result`.
4. **(Estado atual)** O briefing fica com `status = recebido`, visível no Hub Admin, esperando processamento manual.
5. Realtime: o Hub Admin está inscrito em mudanças na tabela (`postgres_changes`), então qualquer novo briefing aparece na lista automaticamente, sem precisar recarregar a página.

---

## 3. O pipeline de IA — fluxo de artefatos (16 etapas)

Desde 09/07/2026 o Hub Admin deixou de tratar o processamento como "7 prompts fixos numa tacada" e passou a tratá-lo como uma **sequência de artefatos aprováveis**, seguindo o documento de especificação [fluxo_briefing_interativo_ia_sem_api_atualizado.md](fluxo_briefing_interativo_ia_sem_api_atualizado.md). Roda 100% por copy/paste em qualquer chat de IA, sem depender de cota de API.

O fluxo tem duas conversas:

- **Conversa Estratégica** (etapas 2–12): Brief Mestre → Seleção da ferramenta estratégica → Pesquisa contextual → Diagnóstico → Caminhos → Autocrítica e decisão → Memo de Decisão → Sistema Verbal → Critérios Criativos → Sistema Visual Direcional → Handoff Visual. Nenhuma imagem aqui.
- **Conversa Visual** (etapa 13–14): só começa depois do Handoff Visual aprovado. Exploração Visual **Unitária** (uma unidade por vez: logo, tipografia, paleta, grafismos, fotografia, ilustração, aplicação, refinamento) → Convergência do Sistema.

Cada etapa gera um **prompt de 5 blocos** (Papel, Tarefa, Contexto, Critérios, Saída — seção 4.1 do documento). O **contexto é enxuto**: cada etapa recebe apenas os artefatos aprovados de que precisa, nunca o briefing bruto repetido (regras anti-deriva 4.8). O briefing bruto só alimenta a etapa 2 (Brief Mestre); a Biblioteca Estratégica só alimenta a etapa 3.

**Biblioteca Estratégica**: substitui os 5 modelos mentais fixos. São os 96 modelos de [data/modelos-mentais.json](data/modelos-mentais.json), convertidos para Markdown e usados como repertório na etapa 3. O painel tem um botão "Biblioteca Estratégica" que abre um modal para copiar, editar (persistido em `localStorage`) ou restaurar o padrão — sem obrigar download.

**Estados de aprovação por etapa** (seção 4.6): `pendente` → `em_execucao` → `rascunho` → `aprovado` (só o aprovado alimenta a próxima etapa) / `revisar` / `rejeitado` / `pulada` / `erro`. Nenhuma etapa avança automaticamente só porque a IA respondeu.

**Persistência**: o pipeline inteiro (respostas, notas, estados, unidades visuais) é salvo no banco dentro de `result` como um objeto versionado `{ version: 2, steps: {...}, visualUnits: [...] }` — auditável e retomável de qualquer dispositivo. O `status` de topo do briefing é derivado: `recebido` (nada começou) → `processando` (pipeline em andamento) → `pronto` (dossiê finalizado). Zero migração de banco: o `result` JSONB já existia. Quando quiser migrar para tabelas dedicadas (`artifacts`, `visual_units` — seção 6 do documento), é um loop sobre esse JSON.

**Dossiê Final** (etapa 15): monta todos os artefatos + unidades visuais aprovadas em Markdown/PDF, exportável e reaproveitável.

---

## 4. O que existe hoje no Hub Admin (`admin.html` / `admin.js`)

- **Login** via Supabase Auth (e-mail/senha).
- **Lista de briefings** (`briefingList`), ordenada por data, com nome, badge de status (Recebido/Em andamento/Pronto/Erro) e um chip de progresso (`X/12` etapas aprovadas). Atualiza em tempo real.
- Por briefing, na lista: **Renomear** e **Excluir** (com confirmação).
- **Painel de detalhe** do briefing selecionado:
  - Respostas do briefing (colapsável), com botão "Copiar".
  - Toolbar: Editar nome, **Biblioteca Estratégica**, Copiar dossiê, Baixar dossiê `.md`, PDF, **Finalizar dossiê**.
  - **Pipeline** em dois grupos (Conversa Estratégica / Conversa Visual). Cada etapa é um card colapsável com: badge de estado, prompt de 5 blocos pronto pra copiar, campo para colar a resposta, nota do operador, e botões **Salvar rascunho / Aprovar / Revisar / Rejeitar / Pular**. Etapas aprovadas colapsam num resumo.
  - **Exploração Visual Unitária** (etapa 13): liberada só depois do Handoff aprovado. O operador adiciona uma unidade por vez, copia o prompt de solicitação (com o Handoff como contexto e a lista de bloqueios da unidade), cola o prompt final + NEGATIVE, avalia e aprova/rejeita/revisa.
- **Importar briefing via `.md`** — recria um briefing (nome + respostas) a partir de um `.md` baixado (aceita tanto o formato "Briefing" antigo quanto o "Dossiê Final").

---

## 5. Plano dual — o que dá pra fazer daqui pra frente

### Plano A — Curto prazo (resolver o gargalo atual, baixo esforço)

1. **Aumentar a cota do Gemini** (billing pago) ou trocar para outro provedor/modelo com cota maior, e reativar o trigger automático (`alter table briefings enable trigger process_briefing`).
2. **Fila com rate limit**: em vez de disparar o pipeline no insert, gravar um "job" e processar via cron (Supabase Edge Function agendada ou similar) respeitando o limite diário — processa N briefings pendentes por dia automaticamente, sem intervenção manual.
3. **Notificação de status**: enviar e-mail/WhatsApp automático pro cliente quando o `status` virar `pronto` (hoje isso não existe — o cliente só recebe a mensagem de "enviado para processamento").
4. **Melhorar o assistente manual**: botão para colar a resposta e já copiar automaticamente o próximo prompt (reduzir cliques), e mostrar quanto tempo/cota já foi usado, se aplicável.

### Plano B — Médio/longo prazo (evoluir o produto)

1. **Multiusuário / múltiplos operadores** no Hub Admin, com atribuição de briefings e histórico de quem processou o quê (hoje é login único, sem trilha de auditoria).
2. **Editor de resultado**: hoje as 7 seções do `result` só podem ser recriadas do zero (rascunho manual) ou vêm prontas da IA — não dá pra editar o texto final direto no Hub Admin antes de exportar. Adicionar edição inline.
3. **Templates/versionamento de prompts**: os prompts dos 7 passos estão hardcoded em dois lugares (admin.js e process-briefing/index.ts) — mover para uma tabela no banco (`prompt_templates`) permitiria ajustar o tom/instruções sem deploy, e manter as duas versões (manual/automática) sempre sincronizadas.
4. **Métricas**: painel simples com quantos briefings por status, tempo médio até `pronto`, taxa de erro — hoje não existe nenhuma visão agregada, só a lista.
5. **Exportação para outras ferramentas**: já existe `.md` e PDF; poderia integrar exportação direta para Notion/Google Docs/Figma (briefing + resultado prontos para o time de design usar).
6. **Reprocessamento seletivo**: hoje, se um passo do pipeline automático falha, o briefing inteiro vai pra `erro` e teria que ser refeito do zero (ou manualmente). Guardar o progresso parcial (como o rascunho manual já faz) permitiria retomar do passo que falhou.
