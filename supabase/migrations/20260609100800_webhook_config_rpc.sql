-- ============================================================================
-- BizOS — Seed/inspect the webhook dispatch config without committing secrets.
-- The pg_net immediate-dispatch trigger reads private.webhook_dispatch_config.
-- We populate it via this SECURITY DEFINER RPC (called once with the app URL +
-- dispatch secret) so the secret never lives in a committed migration.
-- ============================================================================

create or replace function public.set_webhook_dispatch_config(_url text, _secret text)
returns void
language plpgsql
security definer
set search_path = public, private
as $$
begin
  insert into private.webhook_dispatch_config (id, app_url, dispatch_secret)
  values (true, _url, _secret)
  on conflict (id) do update
    set app_url = excluded.app_url,
        dispatch_secret = excluded.dispatch_secret;
end;
$$;

-- Report whether pg_net is installed (immediate dispatch works) or delivery is
-- sweeper-only. Read-only; safe to expose to the service role.
create or replace function public.pg_net_available()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (select 1 from pg_extension where extname = 'pg_net');
$$;

grant execute on function public.set_webhook_dispatch_config(text, text) to service_role;
grant execute on function public.pg_net_available() to service_role;
