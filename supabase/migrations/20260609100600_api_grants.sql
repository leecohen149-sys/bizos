-- ============================================================================
-- BizOS — Explicit grants for the new automation tables
-- The schema-wide default privileges (see 20260607120300_grants.sql) already
-- cover `authenticated`; these statements are stated explicitly for clarity and
-- to keep the rate-bucket table off the `authenticated` role (service-only).
-- ============================================================================

grant select, insert, update, delete on public.api_keys           to authenticated;
grant select, insert, update, delete on public.webhook_endpoints  to authenticated;
grant select                          on public.webhook_deliveries to authenticated;

-- Rate-bucket state is written only by the service role (consume_rate_token).
revoke all on public.api_rate_buckets from anon, authenticated;

-- Reminder: webhook_deliveries is intentionally NOT in the supabase_realtime
-- publication — see 20260609100200_webhooks.sql.
