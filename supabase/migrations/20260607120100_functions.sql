-- ============================================================================
-- BizOS — Functions & triggers
-- ============================================================================

-- ---------------------------------------------------------------------------
-- RLS helpers (SECURITY DEFINER → bypass RLS to avoid policy recursion on
-- memberships). STABLE so the planner can cache within a statement.
-- ---------------------------------------------------------------------------
create or replace function public.is_org_member(_org uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.memberships
    where org_id = _org
      and user_id = auth.uid()
      and status = 'active'
  );
$$;

create or replace function public.has_org_role(_org uuid, _roles org_role[])
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.memberships
    where org_id = _org
      and user_id = auth.uid()
      and status = 'active'
      and role = any(_roles)
  );
$$;

-- ---------------------------------------------------------------------------
-- Auto-provision a profile row when an auth user is created.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Atomic org creation: creates the org + owner membership for the caller.
-- SECURITY DEFINER so the brand-new org's RLS doesn't block the first insert.
-- ---------------------------------------------------------------------------
create or replace function public.create_organization(_name text, _slug text default null)
returns public.organizations
language plpgsql
security definer
set search_path = public
as $$
declare
  _uid uuid := auth.uid();
  _final_slug text;
  _org public.organizations;
begin
  if _uid is null then
    raise exception 'not authenticated';
  end if;

  -- Build a unique, URL-safe slug.
  _final_slug := coalesce(nullif(trim(_slug), ''), lower(regexp_replace(_name, '[^a-zA-Z0-9]+', '-', 'g')));
  _final_slug := trim(both '-' from _final_slug);
  if _final_slug = '' then
    _final_slug := 'org';
  end if;
  if exists (select 1 from public.organizations where slug = _final_slug) then
    _final_slug := _final_slug || '-' || substr(encode(extensions.gen_random_bytes(4), 'hex'), 1, 6);
  end if;

  insert into public.organizations (name, slug)
  values (_name, _final_slug)
  returning * into _org;

  insert into public.memberships (org_id, user_id, role, status)
  values (_org.id, _uid, 'owner', 'active');

  return _org;
end;
$$;

-- ---------------------------------------------------------------------------
-- keep tasks.updated_at fresh
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists tasks_set_updated_at on public.tasks;
create trigger tasks_set_updated_at
  before update on public.tasks
  for each row execute function public.set_updated_at();

-- Allow authenticated users to call create_organization.
grant execute on function public.create_organization(text, text) to authenticated;
