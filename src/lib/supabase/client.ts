import { createBrowserClient } from "@supabase/ssr"

import { publicEnv } from "@/lib/env"
import type { Database } from "./database.types"

/** Browser Supabase client (singleton-friendly; safe to call in client components). */
export function createClient() {
  return createBrowserClient<Database>(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}
