-- ============================================================================
-- BizOS — Ensure each org has a default sales pipeline with stages.
-- Idempotent; called when the CRM is first opened.
-- ============================================================================
create or replace function public.ensure_default_pipeline(_org uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  _pid uuid;
begin
  if not public.is_org_member(_org) then
    raise exception 'forbidden';
  end if;

  select id into _pid from public.crm_pipelines
  where org_id = _org order by created_at limit 1;

  if _pid is null then
    insert into public.crm_pipelines (org_id, name)
    values (_org, 'צינור מכירות')
    returning id into _pid;

    insert into public.crm_stages (org_id, pipeline_id, name, position, probability)
    values
      (_org, _pid, 'ליד', 1000, 10),
      (_org, _pid, 'נוצר קשר', 2000, 25),
      (_org, _pid, 'הצעת מחיר', 3000, 50),
      (_org, _pid, 'משא ומתן', 4000, 75),
      (_org, _pid, 'נסגר (זכייה)', 5000, 100);
  end if;

  return _pid;
end;
$$;

grant execute on function public.ensure_default_pipeline(uuid) to authenticated;
