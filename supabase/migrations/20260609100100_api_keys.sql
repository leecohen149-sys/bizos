-- ============================================================================
-- BizOS — API keys for the public automation API
-- Keys are presented as `Authorization: Bearer bizos_live_<secret>`.
-- We store only the SHA-256 hash of the full key (never the raw secret) plus a
-- short cleartext prefix for display. Verification is an O(1) lookup on the
-- unique key_hash index. Org isolation for API traffic is enforced in the app
-- (src/lib/api/repo.ts); these RLS policies govern who can MANAGE keys in-app.
-- ============================================================================

create table public.api_keys (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  created_by uuid references public.profiles (id) on delete set null,
  name text not null,
  key_prefix text not null,                 -- cleartext, e.g. 'bizos_live_AbCd' (display only)
  key_hash text not null,                   -- sha256 hex of the full key
  scopes text[] not null default '{}',      -- e.g. {'deals:read','deals:write'} or {'*'}
  last_used_at timestamptz,
  expires_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);
create unique index api_keys_key_hash_idx on public.api_keys (key_hash);
create index api_keys_org_id_idx on public.api_keys (org_id, created_at desc);

alter table public.api_keys enable row level security;

-- Owners/admins manage their org's keys via the app. The raw hash is never
-- selected by app queries (see src/features/integrations); RLS cannot hide a
-- column, so the settings query explicitly avoids key_hash.
create policy "admins read api_keys" on public.api_keys
  for select using (public.has_org_role(org_id, array['owner','admin']::org_role[]));
create policy "admins insert api_keys" on public.api_keys
  for insert with check (public.has_org_role(org_id, array['owner','admin']::org_role[]));
create policy "admins update api_keys" on public.api_keys
  for update using (public.has_org_role(org_id, array['owner','admin']::org_role[]))
  with check (public.has_org_role(org_id, array['owner','admin']::org_role[]));
create policy "admins delete api_keys" on public.api_keys
  for delete using (public.has_org_role(org_id, array['owner','admin']::org_role[]));

-- Token-bucket rate limiter state (one row per key). Written by the service
-- role via consume_rate_token(); never touched directly by clients.
create table public.api_rate_buckets (
  key_id uuid primary key references public.api_keys (id) on delete cascade,
  tokens numeric not null,
  updated_at timestamptz not null default now()
);
alter table public.api_rate_buckets enable row level security;
-- No client policies: only the service role (which bypasses RLS) touches it.
