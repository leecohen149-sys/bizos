-- ============================================================================
-- BizOS — Immediate webhook dispatch via pg_net (best-effort, optional)
-- On a new delivery row we fire an async HTTP call to the app's internal
-- /api/webhooks/dispatch route, which signs + POSTs to the consumer. This is
-- ONLY a latency optimization: if pg_net is unavailable, the config row is
-- missing, or the call fails, the row stays pending/failed and the cron sweeper
-- (/api/cron/webhooks, every minute) delivers it. The sweeper is the source of
-- truth; pg_net just shortens the happy-path latency to ~instant.
--
-- Secrets are NOT committed: the dispatch URL + shared secret live in a one-row
-- private.webhook_dispatch_config table that you populate out-of-band, e.g.
--   insert into private.webhook_dispatch_config (app_url, dispatch_secret)
--   values ('https://bizos-delta.vercel.app', '<BIZOS_WEBHOOK_DISPATCH_SECRET>');
-- Until that row exists, dispatch is a no-op and delivery is sweeper-only.
-- ============================================================================

-- pg_net may not be available on every plan/config — never hard-fail the migration.
do $$
begin
  create extension if not exists pg_net with schema extensions;
exception when others then
  raise notice 'pg_net unavailable (%); webhook delivery will be sweeper-only.', sqlerrm;
end;
$$;

create schema if not exists private;

create table if not exists private.webhook_dispatch_config (
  id boolean primary key default true,        -- single-row guard
  app_url text not null,
  dispatch_secret text not null,
  constraint webhook_dispatch_config_singleton check (id)
);

create or replace function public.dispatch_webhook_delivery()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  _cfg private.webhook_dispatch_config;
begin
  select * into _cfg from private.webhook_dispatch_config limit 1;
  if _cfg.app_url is null then
    return new; -- not configured → sweeper will deliver
  end if;

  begin
    perform net.http_post(
      url := _cfg.app_url || '/api/webhooks/dispatch',
      body := jsonb_build_object('delivery_id', new.id),
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-webhook-secret', _cfg.dispatch_secret
      ),
      timeout_milliseconds := 5000
    );
  exception when others then
    -- pg_net missing or call failed: leave the row for the sweeper.
    null;
  end;

  return new;
end;
$$;

drop trigger if exists webhook_deliveries_dispatch on public.webhook_deliveries;
create trigger webhook_deliveries_dispatch
  after insert on public.webhook_deliveries
  for each row execute function public.dispatch_webhook_delivery();
