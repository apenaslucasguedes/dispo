# Integração Hermes — arquitetura e operação

## Arquitetura encontrada

O admin é uma aplicação web estática (`admin.html`, `admin.js`, `admin.css`) que usa o cliente Supabase carregado no navegador. A autenticação é Supabase Auth (e-mail/senha). A tabela `briefings` mantém `answers`, `status` e `result` JSONB; o pipeline nativo (`result.version === 2`) guarda as etapas e unidades visuais. A Edge Function `supabase/functions/process-briefing` é o processador legado Gemini e não é necessária para a importação Hermes.

A integração é aditiva: um único namespace `briefings.result.hermes` representa o provider `hermes`. Não cria uma segunda linha de briefing, portanto a chave idempotente efetiva é `briefings.id + provider=hermes`. Os dados Claude/GPT do `result` permanecem fora desse namespace.

## Contrato Hermes

`result.hermes` contém `provider`, `projectSlug`, `brandName`, `cardTitle`, `status`, timestamps e `steps`. As 12 etapas usam as chaves `h_entrada`, `h_brief`, `h_ferramenta`, `h_pesquisa`, `h_diagnostico`, `h_caminhos`, `h_auditorias`, `h_decisoes`, `h_verbal`, `h_criterios`, `h_direcao` e `h_handoff`.

Estados do card: `recebido`, `em_processamento`, `pronto_para_revisao`, `aprovado`, `aprovado_com_ressalvas`, `bloqueado`, `erro`. O importador nunca produz aprovação final automática; `aprovado` e `aprovado_com_ressalvas` dependem de ação humana.

## Importação segura sem credenciais externas

1. No Método Branding, execute `node scripts/hermes-publish.js <slug>`.
2. Isso gera `projects/<slug>/07_handoff_final/admin_payload.json` sem segredos.
3. No admin autenticado, abra o briefing correto e clique em **Importar Hermes**.
4. Selecione o JSON. O navegador lê somente o arquivo explicitamente escolhido; não acessa pastas arbitrárias.
5. A importação atualiza `result.hermes` na mesma linha e preserva o pipeline nativo.

Reimportações atualizam o conteúdo do mesmo card. Quando conteúdo e artefatos permanecem idênticos, estados, notas e aprovações humanas são preservados; se uma etapa muda, ela volta a `rascunho`, perde `approvedAt` e registra `content_updated` no histórico. Um card antes aprovado volta a `pronto_para_revisao` quando qualquer conteúdo muda. A importação nunca aceita aprovação automática do payload. O card mostra `x/12`, selo textual `HERMES` e mantém edição, salvar rascunho, aprovar, revisar/bloquear, rejeitar/erro e pular individualmente.

## Publicação direta opcional

O publisher do Método Branding também pode fazer PATCH no Supabase quando houver configuração local com URL, chave e `briefingId`. A configuração com credenciais é ignorada por Git. Sem essas credenciais, o fallback JSON acima é o fluxo oficial e completo.

## Banco e migration

Antes da publicação remota, confirme o projeto vinculado com `supabase projects list` e execute `supabase db push --linked`. As migrations canônicas são `supabase/migrations/20260722120000_add_hermes_integration.sql` e `supabase/migrations/20260722123000_protect_native_pipeline.sql`; `supabase/hermes_migration.sql` permanece como cópia legível para execução manual no SQL Editor. As migrations aditivas criam as RPCs `upsert_briefing_hermes` e `upsert_briefing_pipeline`: ambas bloqueiam a linha e usam controle otimista; a primeira altera somente `result.hermes`, enquanto a segunda atualiza o pipeline nativo preservando no banco a versão Hermes mais recente. Assim, writers concorrentes não restauram snapshots obsoletos de nenhum provider. As funções respeitam o RLS da tabela (`security invoker`), não são concedidas a `anon` e podem ser chamadas por `authenticated` e `service_role`. Também é criado um índice parcial de status Hermes. Não há alteração destrutiva nem dependência da Edge Function legada.

Cada importação e ação manual acrescenta um evento append-only a `history` com ação, estado anterior, novo estado, nota e timestamp. Ao sair de um estado aprovado, `approvedAt` é removido. O controle otimista usa `updatedAt`; o sentinel `__absent__` protege também duas criações iniciais concorrentes do namespace Hermes.

## Reprocessamento e recuperação

- Atualize os artefatos canônicos no Método Branding e gere novamente o payload.
- Reimporte no mesmo briefing; não será criado outro card Hermes.
- Em erro técnico, o card pode ficar em `erro`; corrija a origem e reimporte.
- Conteúdo incompleto deve permanecer rascunho/bloqueado, nunca final aprovado.
- O payload local continua disponível para recuperação mesmo quando Supabase ou credenciais estiverem indisponíveis.

## Verificação

No Método Branding, `npm test` valida 12 etapas, conteúdo rastreável, payload sem segredos, merge idempotente, preservação Claude/GPT e ações manuais. Neste projeto, `node --check admin.js` valida a sintaxe do admin.