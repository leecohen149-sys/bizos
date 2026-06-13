-- ============================================================================
-- BizOS — Outbound webhooks (endpoints + delivery outbox)
-- Users register endpoint URLs subscribed to event types (e.g. 'deal.created').
-- Domain triggers enqueue a delivery row per matching endpoint (see
-- 20260609100300_webhook_enqueue.sql). Delivery is async: pg_net fires
-- immediately (best-effort) and a cron sweeper retries with backoff.
-- ============================================================================

create type webhook_delivery_status as enum ('pending', 'delivered', 'failed', 'dead');

create table public.webhook_endpoints (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  url text not null,
  secret text not null default encode(extensions.gen_random_bytes(24), 'hex'), -- HMAC signing secret
  events text[] not null default '{}',      -- e.g. {'deal.created','deal.updated','contact.created'}
  is_active boolean not null default true,
  description text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index webhook_endpoints_org_active_idx on public.webhook_endpoints (org_id) where is_active;

drop trigger if exists webhook_endpoints_set_updated_at on public.webhook_endpoints;
create trigger webhook_endpoints_set_updated_at
  before update on public.webhook_endpoints
  for each row execute function public.set_updated_at();

create table public.webhook_deliveries (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  endpoint_id uuid not null references public.webhook_endpoints (id) on delete cascade,
  event_id uuid not null default gen_random_uuid(),  -- idempotency key sent to the consumer
  event_type text not null,
  payload jsonb not null,
  status webhook_delivery_status not null default 'pending',
  attempts int not null default 0,
  next_retry_at timestamptz not null default now(),
  last_status_code int,
  response_body text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
-- Sweeper hot path: cheaply find rows that are due for (re)delivery.
create index webhook_deliveries_due_idx on public.webhook_deliveries (next_retry_at)
  where status in ('pending', 'failed');
create index webhook_deliveries_endpoint_idx on public.webhook_deliveries (endpoint_id, created_at desc);

drop trigger if exists webhook_deliveries_set_updated_at on public.webhook_deliveries;
create trigger webhook_deliveries_set_updated_at
  before update on public.webhook_deliveries
  for each row execute function public.set_updated_at();

alter table public.webhook_endpoints  enable row level security;
alter table public.webhook_deliveries enable row level security;

-- Endpoints: owners/admins manage their org's endpoints in-app.
create policy "admins read webhook_endpoints" on public.webhook_endpoints
  for select using (public.has_org_role(org_id, array['owner','admin']::org_role[]));
create policy "admins insert webhook_endpoints" on public.webhook_endpoints
  for insert with check (public.has_org_role(org_id, array['owner','admin']::org_role[]));
create policy "admins update webhook_endpoints" on public.webhook_endpoints
  for update using (public.has_org_role(org_id, array['owner','admin']::org_role[]))
  with check (public.has_org_role(org_id, array['owner','admin']::org_role[]));
create policy "admins delete webhook_endpoints" on public.webhook_endpoints
  for delete using (public.has_org_role(org_id, array['owner','admin']::org_role[]));

-- Deliveries: admins may READ the log (debugging); rows are written only by the
-- enqueue trigger (SECURITY DEFINER) and the service role (sweeper/dispatch).
create policy "admins read webhook_deliveries" on public.webhook_deliveries
  for select using (public.has_org_role(org_id, array['owner','admin']::org_role[]));

-- IMPORTANT: do NOT add webhook_deliveries to the supabase_realtime publication
-- — high-volume outbox churn must not be streamed to clients.
