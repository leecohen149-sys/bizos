/**
 * Centralized, validated environment access.
 * Public vars are inlined at build time; server-only vars are read lazily.
 */
import { z } from "zod"

const publicSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_GOOGLE_OAUTH_ENABLED: z.enum(["true", "false"]).default("false"),
  NEXT_PUBLIC_VAPID_PUBLIC_KEY: z.string().default(""),
})

// Reference each var explicitly so Next.js inlines them in client bundles.
export const publicEnv = publicSchema.parse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_GOOGLE_OAUTH_ENABLED: process.env.NEXT_PUBLIC_GOOGLE_OAUTH_ENABLED,
  NEXT_PUBLIC_VAPID_PUBLIC_KEY: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
})

export const isGoogleOAuthEnabled =
  publicEnv.NEXT_PUBLIC_GOOGLE_OAUTH_ENABLED === "true"

export const isPushConfigured = publicEnv.NEXT_PUBLIC_VAPID_PUBLIC_KEY !== ""

/** Server-only secret. Throws if accessed in a browser bundle. */
export function getServiceRoleKey(): string {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set")
  return key
}

/**
 * Server-only config for the public automation API + outbound webhooks.
 * Read lazily so missing optional vars don't break the client bundle.
 */
export function getApiConfig() {
  return {
    /** Shared secret guarding the internal /api/webhooks/dispatch route. */
    webhookDispatchSecret: process.env.BIZOS_WEBHOOK_DISPATCH_SECRET ?? "",
    /** Bearer secret for the webhook sweeper cron (reuses the reminders cron secret). */
    cronSecret: process.env.CRON_SECRET ?? "",
    /** Token-bucket size per API key. */
    rateLimitCapacity: Number(process.env.BIZOS_API_RATE_CAPACITY ?? "120"),
    /** Token refill rate (tokens/second) per API key. */
    rateLimitRefillPerSec: Number(process.env.BIZOS_API_RATE_REFILL ?? "2"),
    /** Public base URL used to build absolute links in API responses/docs. */
    appUrl: publicEnv.NEXT_PUBLIC_APP_URL,
  }
}
