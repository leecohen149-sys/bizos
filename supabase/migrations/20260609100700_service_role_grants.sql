-- ============================================================================
-- BizOS — Grant the service role DML on public tables.
-- The public automation API runs through the service-role client
-- (src/lib/api/admin.ts → repo.ts) and enforces tenant isolation in app code.
-- service_role bypasses RLS but still needs table privileges; migration-created
-- tables don't automatically carry them, so grant explicitly (and for future
-- tables via default privileges).
-- ============================================================================

grant select, insert, update, delete on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to service_role;
grant execute on all functions in schema public to service_role;

alter default privileges in schema public
  grant select, insert, update, delete on tables to service_role;
alter default privileges in schema public
  grant usage, select on sequences to service_role;
alter default privileges in schema public
  grant execute on functions to service_role;
