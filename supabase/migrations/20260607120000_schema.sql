-- ============================================================================
-- BizOS — Initial schema (tables, enums, indexes)
-- Multi-tenant: every domain table (except profiles) carries org_id.
-- Tenant isolation is enforced via RLS (see 20260607120200_rls.sql).
-- ============================================================================

create extension if not exists "pgcrypto"; -- gen_random_uuid()

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type org_role as enum ('owner', 'admin', 'manager', 'member', 'guest');
create type membership_status as enum ('active', 'invited', 'suspended');
create type task_status as enum ('not_started', 'in_progress', 'blocked', 'done');
create type task_priority as enum ('low', 'medium', 'high', 'urgent');
create type project_status as enum ('active', 'on_hold', 'completed', 'archived');
create type dependency_type as enum ('blocks', 'relates_to');
create type reminder_status as enum ('pending', 'sent', 'cancelled');
create type deal_status as enum ('open', 'won', 'lost');
create type crm_activity_type as enum ('call', 'meeting', 'email', 'note', 'task');

-- ---------------------------------------------------------------------------
-- Core / tenancy
-- ---------------------------------------------------------------------------
create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  settings jsonb not null default '{}'::jsonb,
  plan text not null default 'free',
  created_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  avatar_url text,
  locale text not null default 'he',
  phone text,
  created_at timestamptz not null default now()
);

create table public.memberships (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role org_role not null default 'member',
  status membership_status not null default 'active',
  created_at timestamptz not null default now(),
  unique (org_id, user_id)
);
create index memberships_org_id_idx on public.memberships (org_id);
create index memberships_user_id_idx on public.memberships (user_id);

create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  email text not null,
  role org_role not null default 'member',
  token text not null unique default encode(extensions.gen_random_bytes(24), 'hex'),
  invited_by uuid references public.profiles (id) on delete set null,
  expires_at timestamptz not null default (now() + interval '7 days'),
  accepted_at timestamptz,
  created_at timestamptz not null default now()
);
create index invitations_org_id_idx on public.invitations (org_id);
create index invitations_email_idx on public.invitations (lower(email));

-- ---------------------------------------------------------------------------
-- Projects / tasks
-- ---------------------------------------------------------------------------
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  name text not null,
  description text,
  status project_status not null default 'active',
  color text not null default '#6366f1',
  owner_id uuid references public.profiles (id) on delete set null,
  start_date date,
  due_date date,
  archived_at timestamptz,
  created_at timestamptz not null default now()
);
create index projects_org_id_idx on public.projects (org_id);
create index projects_status_idx on public.projects (org_id, status);

create table public.project_members (
  project_id uuid not null references public.projects (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role org_role not null default 'member',
  created_at timestamptz not null default now(),
  primary key (project_id, user_id)
);
create index project_members_user_id_idx on public.project_members (user_id);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  project_id uuid references public.projects (id) on delete set null,
  parent_task_id uuid references public.tasks (id) on delete cascade,
  title text not null,
  description text,
  status task_status not null default 'not_started',
  priority task_priority not null default 'medium',
  assignee_id uuid references public.profiles (id) on delete set null,
  created_by uuid references public.profiles (id) on delete set null,
  start_date date,
  due_date date,
  position numeric not null default 1000,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index tasks_org_id_idx on public.tasks (org_id);
create index tasks_status_idx on public.tasks (org_id, status);
create index tasks_assignee_id_idx on public.tasks (assignee_id);
create index tasks_due_date_idx on public.tasks (org_id, due_date);
create index tasks_project_id_idx on public.tasks (project_id);
create index tasks_parent_id_idx on public.tasks (parent_task_id);

create table public.task_dependencies (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  predecessor_task_id uuid not null references public.tasks (id) on delete cascade,
  successor_task_id uuid not null references public.tasks (id) on delete cascade,
  type dependency_type not null default 'blocks',
  created_at timestamptz not null default now(),
  unique (predecessor_task_id, successor_task_id, type),
  check (predecessor_task_id <> successor_task_id)
);
create index task_dependencies_org_id_idx on public.task_dependencies (org_id);
create index task_dependencies_pred_idx on public.task_dependencies (predecessor_task_id);
create index task_dependencies_succ_idx on public.task_dependencies (successor_task_id);

create table public.labels (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  name text not null,
  color text not null default '#6366f1',
  created_at timestamptz not null default now(),
  unique (org_id, name)
);
create index labels_org_id_idx on public.labels (org_id);

create table public.task_labels (
  task_id uuid not null references public.tasks (id) on delete cascade,
  label_id uuid not null references public.labels (id) on delete cascade,
  primary key (task_id, label_id)
);

create table public.task_comments (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  task_id uuid not null references public.tasks (id) on delete cascade,
  author_id uuid references public.profiles (id) on delete set null,
  body text not null,
  created_at timestamptz not null default now()
);
create index task_comments_task_id_idx on public.task_comments (task_id);
create index task_comments_org_id_idx on public.task_comments (org_id);

create table public.attachments (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  task_id uuid references public.tasks (id) on delete cascade,
  storage_path text not null,
  file_name text not null,
  mime text,
  size bigint,
  uploaded_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);
create index attachments_org_id_idx on public.attachments (org_id);
create index attachments_task_id_idx on public.attachments (task_id);

-- ---------------------------------------------------------------------------
-- Reminders / notifications
-- ---------------------------------------------------------------------------
create table public.reminders (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  task_id uuid references public.tasks (id) on delete cascade,
  remind_at timestamptz not null,
  message text,
  status reminder_status not null default 'pending',
  created_at timestamptz not null default now()
);
create index reminders_org_id_idx on public.reminders (org_id);
create index reminders_due_idx on public.reminders (status, remind_at);
create index reminders_user_id_idx on public.reminders (user_id);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  type text not null,
  title text not null,
  body text,
  entity_type text,
  entity_id uuid,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index notifications_user_unread_idx on public.notifications (user_id, read_at);
create index notifications_org_id_idx on public.notifications (org_id);

create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now()
);
create index push_subscriptions_user_id_idx on public.push_subscriptions (user_id);

-- ---------------------------------------------------------------------------
-- CRM
-- ---------------------------------------------------------------------------
create table public.crm_companies (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  name text not null,
  domain text,
  industry text,
  notes text,
  created_at timestamptz not null default now()
);
create index crm_companies_org_id_idx on public.crm_companies (org_id);

create table public.crm_contacts (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  company_id uuid references public.crm_companies (id) on delete set null,
  first_name text not null,
  last_name text,
  email text,
  phone text,
  title text,
  owner_id uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);
create index crm_contacts_org_id_idx on public.crm_contacts (org_id);
create index crm_contacts_company_id_idx on public.crm_contacts (company_id);

create table public.crm_pipelines (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);
create index crm_pipelines_org_id_idx on public.crm_pipelines (org_id);

create table public.crm_stages (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  pipeline_id uuid not null references public.crm_pipelines (id) on delete cascade,
  name text not null,
  position numeric not null default 1000,
  probability numeric not null default 0,
  created_at timestamptz not null default now()
);
create index crm_stages_pipeline_id_idx on public.crm_stages (pipeline_id);
create index crm_stages_org_id_idx on public.crm_stages (org_id);

create table public.crm_deals (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  pipeline_id uuid not null references public.crm_pipelines (id) on delete cascade,
  stage_id uuid not null references public.crm_stages (id) on delete restrict,
  contact_id uuid references public.crm_contacts (id) on delete set null,
  company_id uuid references public.crm_companies (id) on delete set null,
  title text not null,
  value numeric not null default 0,
  currency text not null default 'ILS',
  owner_id uuid references public.profiles (id) on delete set null,
  expected_close_date date,
  status deal_status not null default 'open',
  position numeric not null default 1000,
  created_at timestamptz not null default now()
);
create index crm_deals_org_id_idx on public.crm_deals (org_id);
create index crm_deals_stage_id_idx on public.crm_deals (stage_id);
create index crm_deals_status_idx on public.crm_deals (org_id, status);

create table public.crm_activities (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  type crm_activity_type not null default 'note',
  contact_id uuid references public.crm_contacts (id) on delete cascade,
  deal_id uuid references public.crm_deals (id) on delete cascade,
  task_id uuid references public.tasks (id) on delete set null,
  note text,
  occurred_at timestamptz not null default now(),
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);
create index crm_activities_org_id_idx on public.crm_activities (org_id);
create index crm_activities_deal_id_idx on public.crm_activities (deal_id);
create index crm_activities_contact_id_idx on public.crm_activities (contact_id);

-- ---------------------------------------------------------------------------
-- Audit
-- ---------------------------------------------------------------------------
create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  actor_id uuid references public.profiles (id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  diff jsonb,
  created_at timestamptz not null default now()
);
create index audit_log_org_id_idx on public.audit_log (org_id, created_at desc);
