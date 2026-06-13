import { NextResponse } from "next/server"

import { createAdminClient } from "@/lib/supabase/admin"
import { deliverOne } from "@/lib/api/webhook-deliver"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const BATCH_SIZE = 50

/**
 * Webhook delivery sweeper — the source of truth for reliable delivery.
 * Picks up due rows (pending/failed with next_retry_at <= now) and (re)delivers
 * them with exponential backoff. Secured by CRON_SECRET (Bearer).
 *
 * Vercel Hobby cron is daily-only, so this is NOT in vercel.json; point a free
 * external scheduler (e.g. cron-job.org) at it every minute:
 *   GET /api/cron/webhooks   Authorization: Bearer $CRON_SECRET
 *
 * Upgrade path: replace the external scheduler + pg_net with QStash/Inngest —
 * both can call deliverOne() directly without changing delivery logic.
 */
export async function GET(request: Request) {
  const auth = request.headers.get("authorization")
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }

  const admin = createAdminClient()
  const { data: due, error } = await admin
    .from("webhook_deliveries")
    .select("id")
    .in("status", ["pending", "failed"])
    .lte("next_retry_at", new Date().toISOString())
    .order("next_retry_at", { ascending: true })
    .limit(BATCH_SIZE)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const counts = { processed: 0, delivered: 0, failed: 0, dead: 0, skipped: 0 }
  for (const row of due ?? []) {
    const result = await deliverOne(row.id).catch(() => ({ status: "skipped" as const }))
    counts.processed++
    counts[result.status]++
  }

  return NextResponse.json({ ok: true, ...counts })
}
