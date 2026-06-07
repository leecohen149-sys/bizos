-- ============================================================================
-- BizOS — Enable Realtime for collaborative tables.
-- Supabase only streams changes for tables in the supabase_realtime publication.
-- RLS still governs which rows each subscriber receives.
-- ============================================================================
alter publication supabase_realtime add table public.tasks;
alter publication supabase_realtime add table public.task_comments;
alter publication supabase_realtime add table public.notifications;
alter publication supabase_realtime add table public.crm_deals;
