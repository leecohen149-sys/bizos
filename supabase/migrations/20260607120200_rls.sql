-- ============================================================================
-- BizOS — Row Level Security
-- Tenant isolation: a user may only touch rows of orgs they are an active
-- member of. Writes are additionally role-gated where relevant.
-- ============================================================================

-- Helper: do caller and _other share at least one active org?
create or replace function public.shares_org_with(_other uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.memberships m1
    join public.memberships m2 on m1.org_id = m2.org_id
    where m1.user_id = auth.uid() and m1.status = 'active'
      and m2.user_id = _other and m2.status = 'active'
  );
$$;

-- Enable RLS everywhere.
alter table public.organizations    enable row level security;
alter table public.profiles         enable row level security;
alter table public.memberships      enable row level security;
alter table public.invitations      enable row level security;
alter table public.projects         enable row level security;
alter table public.project_members  enable row level security;
alter table public.tasks            enable row level security;
alter table public.task_dependencies enable row level security;
alter table public.labels           enable row level security;
alter table public.task_labels      enable row level security;
alter table public.task_comments    enable row level security;
alter table public.attachments      enable row level security;
alter table public.reminders        enable row level security;
alter table public.notifications    enable row level security;
alter table public.push_subscriptions enable row level security;
alter table public.crm_companies    enable row level security;
alter table public.crm_contacts     enable row level security;
alter table public.crm_pipelines    enable row level security;
alter table public.crm_stages       enable row level security;
alter table public.crm_deals        enable row level security;
alter table public.crm_activities   enable row level security;
alter table public.audit_log        enable row level security;

-- ---------------------------------------------------------------------------
-- organizations (insert only via create_organization() SECURITY DEFINER fn)
-- ---------------------------------------------------------------------------
create policy "org members can read" on public.organizations
  for select using (public.is_org_member(id));
create policy "org admins can update" on public.organizations
  for update using (public.has_org_role(id, array['owner','admin']::org_role[]))
  with check (public.has_org_role(id, array['owner','admin']::org_role[]));
create policy "org owners can delete" on public.organizations
  for delete using (public.has_org_role(id, array['owner']::org_role[]));

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
create policy "read own or org-mate profiles" on public.profiles
  for select using (id = auth.uid() or public.shares_org_with(id));
create policy "insert own profile" on public.profiles
  for insert with check (id = auth.uid());
create policy "update own profile" on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

-- ---------------------------------------------------------------------------
-- memberships
-- ---------------------------------------------------------------------------
create policy "members read memberships" on public.memberships
  for select using (public.is_org_member(org_id));
create policy "admins manage memberships (insert)" on public.memberships
  for insert with check (public.has_org_role(org_id, array['owner','admin']::org_role[]));
create policy "admins manage memberships (update)" on public.memberships
  for update using (public.has_org_role(org_id, array['owner','admin']::org_role[]))
  with check (public.has_org_role(org_id, array['owner','admin']::org_role[]));
create policy "admins manage memberships (delete)" on public.memberships
  for delete using (public.has_org_role(org_id, array['owner','admin']::org_role[]));

-- ---------------------------------------------------------------------------
-- invitations (admin-managed)
-- ---------------------------------------------------------------------------
create policy "admins read invitations" on public.invitations
  for select using (public.has_org_role(org_id, array['owner','admin']::org_role[]));
create policy "admins create invitations" on public.invitations
  for insert with check (public.has_org_role(org_id, array['owner','admin']::org_role[]));
create policy "admins update invitations" on public.invitations
  for update using (public.has_org_role(org_id, array['owner','admin']::org_role[]))
  with check (public.has_org_role(org_id, array['owner','admin']::org_role[]));
create policy "admins delete invitations" on public.invitations
  for delete using (public.has_org_role(org_id, array['owner','admin']::org_role[]));

-- ---------------------------------------------------------------------------
-- projects (managers manage; all members read)
-- ---------------------------------------------------------------------------
create policy "members read projects" on public.projects
  for select using (public.is_org_member(org_id));
create policy "managers write projects" on public.projects
  for all using (public.has_org_role(org_id, array['owner','admin','manager']::org_role[]))
  with check (public.has_org_role(org_id, array['owner','admin','manager']::org_role[]));

create policy "members read project_members" on public.project_members
  for select using (exists (
    select 1 from public.projects p where p.id = project_id and public.is_org_member(p.org_id)
  ));
create policy "managers write project_members" on public.project_members
  for all using (exists (
    select 1 from public.projects p
    where p.id = project_id and public.has_org_role(p.org_id, array['owner','admin','manager']::org_role[])
  ))
  with check (exists (
    select 1 from public.projects p
    where p.id = project_id and public.has_org_role(p.org_id, array['owner','admin','manager']::org_role[])
  ));

-- ---------------------------------------------------------------------------
-- tasks & related (any active member may collaborate)
-- ---------------------------------------------------------------------------
create policy "members access tasks" on public.tasks
  for all using (public.is_org_member(org_id)) with check (public.is_org_member(org_id));

create policy "members access task_dependencies" on public.task_dependencies
  for all using (public.is_org_member(org_id)) with check (public.is_org_member(org_id));

create policy "members access labels" on public.labels
  for all using (public.is_org_member(org_id)) with check (public.is_org_member(org_id));

create policy "members access task_labels" on public.task_labels
  for all using (exists (
    select 1 from public.tasks t where t.id = task_id and public.is_org_member(t.org_id)
  ))
  with check (exists (
    select 1 from public.tasks t where t.id = task_id and public.is_org_member(t.org_id)
  ));

create policy "members access task_comments" on public.task_comments
  for all using (public.is_org_member(org_id)) with check (public.is_org_member(org_id));

create policy "members access attachments" on public.attachments
  for all using (public.is_org_member(org_id)) with check (public.is_org_member(org_id));

-- ---------------------------------------------------------------------------
-- reminders & notifications (personal)
-- ---------------------------------------------------------------------------
create policy "own reminders" on public.reminders
  for all using (user_id = auth.uid() and public.is_org_member(org_id))
  with check (user_id = auth.uid() and public.is_org_member(org_id));

create policy "read own notifications" on public.notifications
  for select using (user_id = auth.uid());
create policy "org can create notifications" on public.notifications
  for insert with check (public.is_org_member(org_id));
create policy "update own notifications" on public.notifications
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "delete own notifications" on public.notifications
  for delete using (user_id = auth.uid());

create policy "own push subscriptions" on public.push_subscriptions
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- CRM (managers manage; members read)
-- ---------------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array[
    'crm_companies','crm_contacts','crm_pipelines','crm_stages','crm_deals','crm_activities'
  ]
  loop
    execute format(
      'create policy "members read %1$s" on public.%1$s for select using (public.is_org_member(org_id));',
      t
    );
    execute format(
      'create policy "managers write %1$s" on public.%1$s for all using (public.has_org_role(org_id, array[''owner'',''admin'',''manager'']::org_role[])) with check (public.has_org_role(org_id, array[''owner'',''admin'',''manager'']::org_role[]));',
      t
    );
  end loop;
end;
$$;

-- ---------------------------------------------------------------------------
-- audit_log (admins read; members' actions inserted server-side)
-- ---------------------------------------------------------------------------
create policy "admins read audit" on public.audit_log
  for select using (public.has_org_role(org_id, array['owner','admin']::org_role[]));
create policy "members insert audit" on public.audit_log
  for insert with check (public.is_org_member(org_id));
