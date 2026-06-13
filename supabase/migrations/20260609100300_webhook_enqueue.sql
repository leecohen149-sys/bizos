-- ============================================================================
-- BizOS — Enqueue webhook deliveries from domain table changes
-- The trigger is intentionally cheap: it performs ONLY local inserts (no
-- outbound I/O) and the per-endpoint loop body runs only when at least one
-- active endpoint in the org subscribes to the event — so when an org has no
-- webhooks the cost is a single indexed lookup that returns nothing.
-- ============================================================================

create or replace function public.enqueue_webhook_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  _resource text := tg_argv[0];
  _action text := case when tg_op = 'INSERT' then 'created' else 'updated' end;
  _event_type text := _resource || '.' || _action;
  _org uuid := new.org_id;
  _payload jsonb;
  _ep record;
begin
  -- Skip no-op updates (e.g. an UPDATE that changed nothing meaningful).
  if tg_op = 'UPDATE' and new is not distinct from old then
    return new;
  end if;

  _payload := jsonb_build_object(
    'event', _event_type,
    'resource', _resource,
    'id', new.id,
    'org_id', _org,
    'occurred_at', now(),
    'data', to_jsonb(new)
  );

  for _ep in
    select id
    from public.webhook_endpoints
    where org_id = _org
      and is_active
      and _event_type = any (events)
  loop
    insert into public.webhook_deliveries (org_id, endpoint_id, event_type, payload)
    values (_org, _ep.id, _event_type, _payload);
  end loop;

  return new;
end;
$$;

-- Attach to every public-API resource. tg_argv[0] is the singular resource name
-- used to build the event type ('<resource>.created' / '<resource>.updated').
drop trigger if exists deals_webhook on public.crm_deals;
create trigger deals_webhook after insert or update on public.crm_deals
  for each row execute function public.enqueue_webhook_event('deal');

drop trigger if exists contacts_webhook on public.crm_contacts;
create trigger contacts_webhook after insert or update on public.crm_contacts
  for each row execute function public.enqueue_webhook_event('contact');

drop trigger if exists companies_webhook on public.crm_companies;
create trigger companies_webhook after insert or update on public.crm_companies
  for each row execute function public.enqueue_webhook_event('company');

drop trigger if exists tasks_webhook on public.tasks;
create trigger tasks_webhook after insert or update on public.tasks
  for each row execute function public.enqueue_webhook_event('task');

drop trigger if exists projects_webhook on public.projects;
create trigger projects_webhook after insert or update on public.projects
  for each row execute function public.enqueue_webhook_event('project');

drop trigger if exists activities_webhook on public.crm_activities;
create trigger activities_webhook after insert or update on public.crm_activities
  for each row execute function public.enqueue_webhook_event('activity');
