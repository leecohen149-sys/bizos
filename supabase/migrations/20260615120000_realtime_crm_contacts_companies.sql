-- ============================================================================
-- BizOS — Enable Realtime for CRM contacts & companies.
-- Leads arrive as crm_contacts rows via the public API; without these in the
-- supabase_realtime publication the open CRM screen never sees the INSERT and
-- the list only refreshes on a manual reload. RLS still governs row visibility.
-- ============================================================================
alter publication supabase_realtime add table public.crm_contacts;
alter publication supabase_realtime add table public.crm_companies;
