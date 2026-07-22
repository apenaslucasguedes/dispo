-- Protege o pipeline nativo contra lost updates e preserva result.hermes no banco.
create or replace function public.upsert_briefing_pipeline(
  p_briefing_id uuid,
  p_pipeline jsonb,
  p_status text,
  p_expected_updated_at text default '__absent__'
) returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_current_result jsonb;
  v_next_result jsonb;
begin
  if p_pipeline is null or jsonb_typeof(p_pipeline) is distinct from 'object' then
    raise exception 'invalid pipeline payload';
  end if;

  select coalesce(result, '{}'::jsonb)
    into v_current_result
    from public.briefings
   where id = p_briefing_id
   for update;
  if not found then raise exception 'briefing not found'; end if;

  if coalesce(v_current_result->>'updatedAt', '__absent__') is distinct from p_expected_updated_at then
    raise exception 'pipeline concurrent update; reload and retry';
  end if;

  v_next_result := (p_pipeline - 'hermes');
  if v_current_result ? 'hermes' then
    v_next_result := jsonb_set(v_next_result, '{hermes}', v_current_result->'hermes', true);
  end if;

  update public.briefings
     set result = v_next_result,
         status = p_status
   where id = p_briefing_id
   returning result into v_next_result;
  return v_next_result;
end;
$$;

revoke all on function public.upsert_briefing_pipeline(uuid, jsonb, text, text) from public, anon;
grant execute on function public.upsert_briefing_pipeline(uuid, jsonb, text, text) to authenticated, service_role;
