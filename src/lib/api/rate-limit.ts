import "server-only"

import { createAdminClient } from "@/lib/supabase/admin"
import { getApiConfig } from "@/lib/env"

/**
 * Per-API-key rate limiting via a Postgres token bucket (single round-trip RPC).
 * No external infra needed. To scale, swap this implementation for
 * @upstash/ratelimit behind the same `checkRateLimit` signature.
 */

export type RateLimitResult = {
  allowed: boolean
  limit: number
  remaining: number
  resetSeconds: number
}

/** Standard headers consumers (n8n/Make) read to self-throttle. */
export function rateLimitHeaders(r: RateLimitResult): Record<string, string> {
  return {
    "X-RateLimit-Limit": String(r.limit),
    "X-RateLimit-Remaining": String(Math.max(0, Math.floor(r.remaining))),
    "X-RateLimit-Reset": String(Math.max(0, Math.ceil(r.resetSeconds))),
  }
}

export async function checkRateLimit(keyId: string): Promise<RateLimitResult> {
  const { rateLimitCapacity, rateLimitRefillPerSec } = getApiConfig()
  const admin = createAdminClient()

  const { data, error } = await admin
    .rpc("consume_rate_token", {
      _key_id: keyId,
      _capacity: rateLimitCapacity,
      _refill_per_sec: rateLimitRefillPerSec,
    })
    .maybeSingle()

  // Fail open on limiter errors — never let an internal hiccup block valid API traffic.
  if (error || !data) {
    return {
      allowed: true,
      limit: rateLimitCapacity,
      remaining: rateLimitCapacity,
      resetSeconds: 0,
    }
  }

  return {
    allowed: data.allowed,
    limit: rateLimitCapacity,
    remaining: data.remaining,
    resetSeconds: data.reset_seconds,
  }
}
