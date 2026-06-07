import "server-only"

import webpush from "web-push"

import { createAdminClient } from "@/lib/supabase/admin"

let configured = false

function configure() {
  if (configured) return
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const priv = process.env.VAPID_PRIVATE_KEY
  if (!pub || !priv) throw new Error("VAPID keys are not configured")
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || "mailto:admin@bizos.app",
    pub,
    priv
  )
  configured = true
}

export type PushPayload = {
  title: string
  body?: string
  url?: string
  icon?: string
}

/** Send a push to every subscription a user has; prune dead endpoints. */
export async function sendPushToUser(userId: string, payload: PushPayload) {
  configure()
  const admin = createAdminClient()
  const { data: subs } = await admin
    .from("push_subscriptions")
    .select("*")
    .eq("user_id", userId)

  await Promise.all(
    (subs ?? []).map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          JSON.stringify({ ...payload, data: { url: payload.url ?? "/" } })
        )
      } catch (err) {
        const code = (err as { statusCode?: number }).statusCode
        if (code === 404 || code === 410) {
          await admin.from("push_subscriptions").delete().eq("id", s.id)
        }
      }
    })
  )
}
