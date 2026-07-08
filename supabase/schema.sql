-- Schema do Briefing Interativo — rodar no SQL Editor do Supabase

create table if not exists briefings (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  client_name text,
  answers jsonb not null,
  status text not null default 'recebido' check (status in ('recebido', 'processando', 'pronto', 'erro')),
  result jsonb,
  error text
);

-- Ninguém lê/edita direto pelo cliente público exceto inserir o próprio briefing.
alter table briefings enable row level security;

create policy "qualquer um pode inserir um briefing"
  on briefings for insert
  to anon
  with check (true);

-- Leitura e atualização só para usuários autenticados (você, no hub admin).
create policy "usuários autenticados podem ler"
  on briefings for select
  to authenticated
  using (true);

create policy "usuários autenticados podem atualizar"
  on briefings for update
  to authenticated
  using (true);

create policy "usuários autenticados podem excluir"
  on briefings for delete
  to authenticated
  using (true);

-- Trigger que dispara a Edge Function toda vez que um novo briefing é inserido.
-- DESATIVADO em 2026-07-08: a cota gratuita do Gemini estourou (20 requisições/dia,
-- 7 por briefing), então os briefings novos ficam parados em "recebido" e são
-- processados manualmente pelo assistente de prompts no hub admin (admin.html).
--
-- create trigger process_briefing after insert on briefings
--   for each row execute function supabase_functions.http_request(
--     'https://SEU-PROJETO.supabase.co/functions/v1/process-briefing',
--     'POST',
--     '{"Content-type":"application/json","Authorization":"Bearer SEU_SERVICE_ROLE_KEY"}',
--     '{}',
--     '5000'
--   );
--
-- Reative com (depois de resolver a cota/billing do Gemini):
--   alter table briefings enable trigger process_briefing;
-- Para desativar de novo:
--   alter table briefings disable trigger process_briefing;
