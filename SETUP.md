# Setup do Briefing Interativo + Hub Admin

## 1. Criar projeto no Supabase
1. Crie uma conta em supabase.com e um novo projeto (free tier).
2. Vá em **SQL Editor** e rode o conteúdo de [supabase/schema.sql](supabase/schema.sql).
3. Vá em **Project Settings > API** e copie a `Project URL` e a `anon public key`.
4. Cole esses valores em [supabase-config.js](supabase-config.js).

## 2. Criar seu usuário admin (login do hub)
Em **Authentication > Users**, clique em "Add user" e crie seu e-mail/senha manualmente
(não precisa de fluxo de cadastro público — é só você).

## 3. Deploy da Edge Function
Precisa da [Supabase CLI](https://supabase.com/docs/guides/cli) instalada.

```
supabase login
supabase link --project-ref SEU_PROJECT_REF
supabase secrets set OPENAI_API_KEY=sk-...
supabase functions deploy process-briefing
```

## 4. Conectar o Webhook
Em **Database > Webhooks** no painel do Supabase:
- Nome: `process-briefing`
- Tabela: `briefings`
- Evento: `INSERT`
- Tipo: `Supabase Edge Function` -> selecione `process-briefing`

## 5. Preencher os conteúdos reais
No arquivo [supabase/functions/process-briefing/index.ts](supabase/functions/process-briefing/index.ts),
substitua os placeholders `MODELOS_MENTAIS` e `VICIOS_IA` pelo conteúdo real da sua
planilha de modelos mentais e do seu documento de vícios de linguagem de IA.
Depois rode `supabase functions deploy process-briefing` de novo.

## 6. Testar
- Abra `index.html`, responda o briefing e conclua.
- Abra `admin.html`, faça login com o usuário criado no passo 2.
- O briefing deve aparecer com status "Recebido" e, em segundos, mudar para
  "Processando" e depois "Pronto" com o resultado da IA.

## Custo esperado
Pipeline usa `gpt-5-nano` nas etapas intermediárias e `gpt-5-mini` na síntese final —
o custo por briefing completo deve ficar bem abaixo de US$ 0,05.
