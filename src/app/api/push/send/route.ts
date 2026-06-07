import { NextResponse } from "next/server"
import { z } from "zod"

import { sendPushToUser } from "@/lib/push/send"

export const runtime = "nodejs"

const schema = z.object({
  userIds: z.array(z.string().uuid()).min(1),
  title: z.string().min(1),
  body: z.string().optional(),
  url: z.string().optional(),
})

/**
 * Internal push dispatch. Requires the x-push-secret header (shared with the
 * reminders cron). Not callable from the browser.
 */
export async function POST(request: Request) {
  const secret = request.headers.get("x-push-secret")
  if (!process.env.PUSH_SECRET || secret !== process.env.PUSH_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }

  const parsed = schema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid body" }, { status: 400 })
  }

  const { userIds, title, body, url } = parsed.data
  await Promise.all(
    userIds.map((id) => sendPushToUser(id, { title, body, url }))
  )
  return NextResponse.json({ ok: true, sent: userIds.length })
}
