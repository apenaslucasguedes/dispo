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

-- Dispara a Edge Function toda vez que um novo briefing é inserido.
-- Configurar em Database > Webhooks no painel do Supabase:
--   Nome: process-briefing
--   Tabela: briefings
--   Evento: INSERT
--   Tipo: Edge Function -> process-briefing
