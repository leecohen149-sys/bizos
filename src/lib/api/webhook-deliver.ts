import "server-only"

import { createAdminClient } from "@/lib/supabase/admin"
import { buildSignedHeaders } from "./webhook-signer"

/**
 * Transport-agnostic webhook delivery. Both the pg_net dispatch route and the
 * cron sweeper call deliverOne() — swapping to QStash/Inngest later only changes
 * the *invoker*, not this logic.
 */

export const MAX_ATTEMPTS = 8
const REQUEST_TIMEOUT_MS = 10_000
const BASE_BACKOFF_MS = 60_000 // 1 minute
const MAX_BACKOFF_MS = 6 * 60 * 60 * 1000 // 6 hours

/** Exponential backoff with ±20% jitter, capped. */
export function nextRetryAt(attempts: number): string {
  const expo = Math.min(MAX_BACKOFF_MS, BASE_BACKOFF_MS * 2 ** attempts)
  const jitter = expo * (0.8 + Math.random() * 0.4)
  return new Date(Date.now() + jitter).toISOString()
}

export type DeliverResult = {
  status: "delivered" | "failed" | "dead" | "skipped"
  statusCode?: number
}

export async function deliverOne(deliveryId: string): Promise<DeliverResult> {
  const admin = createAdminClient()

  const { data: delivery, error } = await admin
    .from("webhook_deliveries")
    .select("id, event_id, payload, attempts, status, webhook_endpoints(url, secret, is_active)")
    .eq("id", deliveryId)
    .maybeSingle()

  if (error || !delivery) return { status: "skipped" }
  if (delivery.status === "delivered" || delivery.status === "dead") {
    return { status: "skipped" }
  }

  const endpoint = delivery.webhook_endpoints as unknown as {
    url: string
    secret: string
    is_active: boolean
  } | null

  // Endpoint deleted or disabled → stop trying.
  if (!endpoint || !endpoint.is_active) {
    await admin.from("webhook_deliveries").update({ status: "dead" }).eq("id", deliveryId)
    return { status: "dead" }
  }

  const rawBody = JSON.stringify(delivery.payload)
  const headers = buildSignedHeaders(
    rawBody,
    endpoint.secret,
    delivery.event_id,
    Math.floor(Date.now() / 1000)
  )

  const attempts = delivery.attempts + 1
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  let statusCode: number | undefined
  let responseBody = ""
  let success = false

  try {
    const res = await fetch(endpoint.url, {
      method: "POST",
      headers,
      body: rawBody,
      signal: controller.signal,
    })
    statusCode = res.status
    success = res.ok
    responseBody = (await res.text().catch(() => "")).slice(0, 1000)
  } catch (e) {
    responseBody = (e as Error).message.slice(0, 1000)
  } finally {
    clearTimeout(timer)
  }

  if (success) {
    await admin
      .from("webhook_deliveries")
      .update({
        status: "delivered",
        attempts,
        last_status_code: statusCode ?? null,
        response_body: responseBody,
      })
      .eq("id", deliveryId)
    return { status: "delivered", statusCode }
  }

  const dead = attempts >= MAX_ATTEMPTS
  await admin
    .from("webhook_deliveries")
    .update({
      status: dead ? "dead" : "failed",
      attempts,
      last_status_code: statusCode ?? null,
      response_body: responseBody,
      next_retry_at: dead ? new Date().toISOString() : nextRetryAt(attempts),
    })
    .eq("id", deliveryId)

  return { status: dead ? "dead" : "failed", statusCode }
}
