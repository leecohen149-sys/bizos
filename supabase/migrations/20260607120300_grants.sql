-- ============================================================================
-- BizOS — Role grants
-- RLS controls WHICH ROWS a user can touch; table GRANTs control whether the
-- `authenticated` role has the privilege at all. Both are required.
-- ============================================================================

grant usage on schema public to anon, authenticated;

-- Authenticated users operate through RLS-protected tables.
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;
grant execute on all functions in schema public to authenticated;

-- Keep future objects accessible without re-granting.
alter default privileges in schema public
  grant select, insert, update, delete on tables to authenticated;
alter default privileges in schema public
  grant usage, select on sequences to authenticated;
alter default privileges in schema public
  grant execute on functions to authenticated;
