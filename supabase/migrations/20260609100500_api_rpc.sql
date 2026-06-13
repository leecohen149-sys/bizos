-- ============================================================================
-- BizOS — RPCs for API-key lifecycle, verification, and rate limiting
-- gen_random_bytes / digest live in the `extensions` schema (pgcrypto).
-- ============================================================================

-- ---------------------------------------------------------------------------
-- create_api_key — generates the secret server-side, stores only its sha256
-- hash, and returns the full cleartext key EXACTLY ONCE. Owner/admin only.
-- ---------------------------------------------------------------------------
create or replace function public.create_api_key(_org uuid, _name text, _scopes text[] default '{}')
returns table (id uuid, full_key text, key_prefix text)
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  _secret text;
  _full text;
  _prefix text;
  _hash text;
  _id uuid;
begin
  if not public.has_org_role(_org, array['owner','admin']::org_role[]) then
    raise exception 'forbidden';
  end if;

  _secret := encode(extensions.gen_random_bytes(24), 'hex');   -- 48 hex chars
  _full := 'bizos_live_' || _secret;
  _prefix := left(_full, 16);
  _hash := encode(extensions.digest(_full, 'sha256'), 'hex');

  insert into public.api_keys (org_id, created_by, name, key_prefix, key_hash, scopes)
  values (_org, auth.uid(), _name, _prefix, _hash, coalesce(_scopes, '{}'))
  returning api_keys.id into _id;

  return query select _id, _full, _prefix;
end;
$$;

-- ---------------------------------------------------------------------------
-- verify_api_key — O(1) lookup by hash; returns the org + scopes for a live key.
-- Called by the service role from the API layer (src/lib/api/auth.ts).
-- ---------------------------------------------------------------------------
create or replace function public.verify_api_key(_hash text)
returns table (key_id uuid, org_id uuid, scopes text[])
language sql
security definer
set search_path = public
stable
as $$
  select k.id, k.org_id, k.scopes
  from public.api_keys k
  where k.key_hash = _hash
    and k.revoked_at is null
    and (k.expires_at is null or k.expires_at > now())
  limit 1;
$$;

-- ---------------------------------------------------------------------------
-- touch_api_key — fire-and-forget last_used_at update (not awaited by callers).
-- ---------------------------------------------------------------------------
create or replace function public.touch_api_key(_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.api_keys set last_used_at = now() where id = _id;
$$;

-- ---------------------------------------------------------------------------
-- consume_rate_token — token-bucket rate limiter in a single round-trip.
-- Refills _refill_per_sec tokens/sec up to _capacity; consumes one if available.
-- ---------------------------------------------------------------------------
create or replace function public.consume_rate_token(_key_id uuid, _capacity numeric, _refill_per_sec numeric)
returns table (allowed boolean, remaining numeric, reset_seconds numeric)
language plpgsql
security definer
set search_path = public
as $$
declare
  _now timestamptz := now();
  _tokens numeric;
  _last timestamptz;
begin
  insert into public.api_rate_buckets (key_id, tokens, updated_at)
  values (_key_id, _capacity, _now)
  on conflict (key_id) do nothing;

  select tokens, updated_at into _tokens, _last
  from public.api_rate_buckets where key_id = _key_id for update;

  _tokens := least(_capacity, _tokens + extract(epoch from (_now - _last)) * _refill_per_sec);

  if _tokens >= 1 then
    update public.api_rate_buckets set tokens = _tokens - 1, updated_at = _now where key_id = _key_id;
    return query select true, floor(_tokens - 1), 0::numeric;
  else
    update public.api_rate_buckets set tokens = _tokens, updated_at = _now where key_id = _key_id;
    return query select false, 0::numeric, ceil((1 - _tokens) / nullif(_refill_per_sec, 0));
  end if;
end;
$$;

-- Authenticated users create keys from the settings UI; the service role
-- verifies/touches/rate-limits on the API request path.
grant execute on function public.create_api_key(uuid, text, text[]) to authenticated;
grant execute on function public.verify_api_key(text) to service_role;
grant execute on function public.touch_api_key(uuid) to service_role;
grant execute on function public.consume_rate_token(uuid, numeric, numeric) to service_role;
