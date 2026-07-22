-- Integração Hermes: merge atômico e aditivo em briefings.result.hermes.
-- Migration idempotente para o projeto Supabase vinculado.

create or replace function public.upsert_briefing_hermes(
  p_briefing_id uuid,
  p_hermes jsonb,
  p_expected_updated_at text default '__absent__'
) returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_result jsonb;
begin
  if p_hermes is null or p_hermes->>'provider' is distinct from 'hermes' then
    raise exception 'invalid hermes payload';
  end if;

  perform 1 from public.briefings where id = p_briefing_id for update;
  if not found then raise exception 'briefing not found'; end if;

  if coalesce(
       (select result->'hermes'->>'updatedAt' from public.briefings where id = p_briefing_id),
       '__absent__'
     ) is distinct from p_expected_updated_at then
    raise exception 'hermes concurrent update; reload and retry';
  end if;

  update public.briefings
     set result = jsonb_set(coalesce(result, '{}'::jsonb), '{hermes}', p_hermes, true)
   where id = p_briefing_id
   returning result into v_result;
  return v_result;
end;
$$;

revoke all on function public.upsert_briefing_hermes(uuid, jsonb, text) from public, anon;
grant execute on function public.upsert_briefing_hermes(uuid, jsonb, text) to authenticated, service_role;

create index if not exists briefings_hermes_status_idx
  on public.briefings ((result->'hermes'->>'status'))
  where result ? 'hermes';
