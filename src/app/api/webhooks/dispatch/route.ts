import { NextResponse } from "next/server"

import { getApiConfig } from "@/lib/env"
import { deliverOne } from "@/lib/api/webhook-deliver"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * Internal immediate-delivery endpoint, called by the pg_net DB trigger
 * (20260609100400_webhook_dispatch.sql) right after a delivery row is inserted.
 * Guarded by a shared secret (BIZOS_WEBHOOK_DISPATCH_SECRET). Always returns
 * 200 quickly so pg_net doesn't retry — the cron sweeper handles real retries.
 */
export async function POST(request: Request) {
  const { webhookDispatchSecret } = getApiConfig()
  const provided = request.headers.get("x-webhook-secret")
  if (!webhookDispatchSecret || provided !== webhookDispatchSecret) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }

  let deliveryId: string | undefined
  try {
    const body = (await request.json()) as { delivery_id?: string }
    deliveryId = body.delivery_id
  } catch {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 })
  }
  if (!deliveryId) {
    return NextResponse.json({ error: "missing delivery_id" }, { status: 400 })
  }

  // Best-effort: errors are swallowed so the trigger never retries.
  const result = await deliverOne(deliveryId).catch(() => ({ status: "skipped" as const }))
  return NextResponse.json({ ok: true, result })
}
