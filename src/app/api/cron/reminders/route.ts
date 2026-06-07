import { NextResponse } from "next/server"

import { createAdminClient } from "@/lib/supabase/admin"
import { sendPushToUser } from "@/lib/push/send"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * Scheduled reminder dispatcher (Vercel Cron — see vercel.json).
 * Finds due, pending reminders → creates an in-app notification + web push,
 * then marks the reminder sent. Secured by CRON_SECRET (Vercel sends it as a
 * Bearer token automatically when the env var is set).
 */
export async function GET(request: Request) {
  const auth = request.headers.get("authorization")
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }

  const admin = createAdminClient()
  const nowIso = new Date().toISOString()

  const { data: due, error } = await admin
    .from("reminders")
    .select("id, org_id, user_id, task_id, message, tasks(title)")
    .eq("status", "pending")
    .lte("remind_at", nowIso)
    .limit(100)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  let dispatched = 0
  for (const r of due ?? []) {
    const taskTitle =
      (r.tasks as unknown as { title: string } | null)?.title ?? "משימה"
    const title = "תזכורת"
    const body = r.message || taskTitle

    // In-app notification
    await admin.from("notifications").insert({
      org_id: r.org_id,
      user_id: r.user_id,
      type: "reminder",
      title,
      body,
      entity_type: "task",
      entity_id: r.task_id,
    })

    // Web push (best-effort)
    try {
      await sendPushToUser(r.user_id, { title, body, url: "/tasks" })
    } catch {
      /* push may be unconfigured; in-app still delivered */
    }

    await admin.from("reminders").update({ status: "sent" }).eq("id", r.id)
    dispatched++
  }

  return NextResponse.json({ ok: true, dispatched })
}
