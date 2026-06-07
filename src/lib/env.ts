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
