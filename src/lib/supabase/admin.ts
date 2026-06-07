import "server-only"

import { createClient as createSupabaseClient } from "@supabase/supabase-js"

import { publicEnv, getServiceRoleKey } from "@/lib/env"
import type { Database } from "./database.types"

/**
 * Service-role client that BYPASSES RLS. Server-only.
 * Use sparingly (cron jobs, edge functions, trusted server tasks). Never expose
 * to the browser and never use it to satisfy a user request without an explicit
 * authorization re-check.
 */
export function createAdminClient() {
  return createSupabaseClient<Database>(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    getServiceRoleKey(),
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
