import "server-only"

import { createHash } from "node:crypto"

import { createAdminClient } from "@/lib/supabase/admin"

/**
 * API-key authentication for the public /api/v1 surface.
 *
 * Keys are sent as `Authorization: Bearer bizos_live_<secret>`. We never store
 * the raw key — only its sha256 hex — so verification is an indexed lookup
 * (verify_api_key RPC). Tenant isolation is then enforced by always scoping
 * every query to the returned org_id (see src/lib/api/repo.ts).
 */

export const API_KEY_PREFIX = "bizos_live_"

export type ApiAuthContext = {
  keyId: string
  orgId: string
  scopes: string[]
}

/** sha256 hex of the full key — must match Postgres encode(digest(x,'sha256'),'hex'). */
export function hashApiKey(fullKey: string): string {
  return createHash("sha256").update(fullKey, "utf8").digest("hex")
}

function extractBearer(req: Request): string | null {
  const header = req.headers.get("authorization")
  if (!header) return null
  const [scheme, value] = header.split(" ")
  if (scheme?.toLowerCase() !== "bearer" || !value) return null
  return value.trim()
}

/** Returns the auth context for a valid, live key, or null. */
export async function authenticateApiKey(
  req: Request
): Promise<ApiAuthContext | null> {
  const token = extractBearer(req)
  if (!token || !token.startsWith(API_KEY_PREFIX)) return null

  const admin = createAdminClient()
  const { data, error } = await admin
    .rpc("verify_api_key", { _hash: hashApiKey(token) })
    .maybeSingle()

  if (error || !data) return null

  // Fire-and-forget last_used_at update — never block the request on it.
  void admin.rpc("touch_api_key", { _id: data.key_id })

  return { keyId: data.key_id, orgId: data.org_id, scopes: data.scopes ?? [] }
}

/** True if the key carries the wildcard '*' scope or the exact scope. */
export function hasScope(ctx: ApiAuthContext, scope: string): boolean {
  return ctx.scopes.includes("*") || ctx.scopes.includes(scope)
}
