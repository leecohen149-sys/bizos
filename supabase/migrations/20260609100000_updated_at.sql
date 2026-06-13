-- ============================================================================
-- BizOS — Add updated_at to the public-API resources + keyset-pagination indexes
-- The automation API exposes ?updated_since= polling and cursor pagination,
-- both of which need a stable (updated_at, id) ordering key on every resource.
-- `tasks` already has updated_at + its trigger (see schema.sql / functions.sql).
-- ============================================================================

alter table public.projects       add column if not exists updated_at timestamptz not null default now();
alter table public.crm_companies  add column if not exists updated_at timestamptz not null default now();
alter table public.crm_contacts   add column if not exists updated_at timestamptz not null default now();
alter table public.crm_deals      add column if not exists updated_at timestamptz not null default now();
alter table public.crm_activities add column if not exists updated_at timestamptz not null default now();

-- Keep updated_at fresh on every UPDATE (reuses public.set_updated_at()).
drop trigger if exists projects_set_updated_at on public.projects;
create trigger projects_set_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();

drop trigger if exists crm_companies_set_updated_at on public.crm_companies;
create trigger crm_companies_set_updated_at
  before update on public.crm_companies
  for each row execute function public.set_updated_at();

drop trigger if exists crm_contacts_set_updated_at on public.crm_contacts;
create trigger crm_contacts_set_updated_at
  before update on public.crm_contacts
  for each row execute function public.set_updated_at();

drop trigger if exists crm_deals_set_updated_at on public.crm_deals;
create trigger crm_deals_set_updated_at
  before update on public.crm_deals
  for each row execute function public.set_updated_at();

drop trigger if exists crm_activities_set_updated_at on public.crm_activities;
create trigger crm_activities_set_updated_at
  before update on public.crm_activities
  for each row execute function public.set_updated_at();

-- Keyset / polling indexes: (org_id, updated_at desc, id desc) is the cursor key.
create index if not exists tasks_org_updated_idx          on public.tasks          (org_id, updated_at desc, id desc);
create index if not exists projects_org_updated_idx       on public.projects       (org_id, updated_at desc, id desc);
create index if not exists crm_companies_org_updated_idx  on public.crm_companies  (org_id, updated_at desc, id desc);
create index if not exists crm_contacts_org_updated_idx   on public.crm_contacts   (org_id, updated_at desc, id desc);
create index if not exists crm_deals_org_updated_idx      on public.crm_deals      (org_id, updated_at desc, id desc);
create index if not exists crm_activities_org_updated_idx on public.crm_activities (org_id, updated_at desc, id desc);
