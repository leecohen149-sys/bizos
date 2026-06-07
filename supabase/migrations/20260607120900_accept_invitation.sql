-- ============================================================================
-- BizOS — Accept an invitation by token (SECURITY DEFINER so the invitee can
-- read the invite + create their own membership despite admin-only RLS).
-- ============================================================================
create or replace function public.accept_invitation(_token text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  _inv public.invitations;
  _uid uuid := auth.uid();
begin
  if _uid is null then
    raise exception 'not authenticated';
  end if;

  select * into _inv from public.invitations where token = _token;
  if not found or _inv.accepted_at is not null or _inv.expires_at < now() then
    raise exception 'invalid or expired invitation';
  end if;

  insert into public.memberships (org_id, user_id, role, status)
  values (_inv.org_id, _uid, _inv.role, 'active')
  on conflict (org_id, user_id) do update set status = 'active';

  update public.invitations set accepted_at = now() where id = _inv.id;

  return _inv.org_id;
end;
$$;

grant execute on function public.accept_invitation(text) to authenticated;
