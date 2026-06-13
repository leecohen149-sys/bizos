import "server-only"

import { createAdminClient } from "@/lib/supabase/admin"
import { sendPushToUser } from "@/lib/push/send"

/**
 * Notify the configured recipients when a new lead (contact) is created through
 * the public API / automations. Fires an in-app notification + web push to each
 * recipient. Best-effort: any failure here must never break the API response.
 *
 * Recipients come from organizations.settings.lead_notify_user_ids; if unset,
 * the org owner is used. Only active members are notified.
 */
type ContactLike = Record<string, unknown>

function leadName(contact: ContactLike): string {
  const first = (contact.first_name as string | null) ?? ""
  const last = (contact.last_name as string | null) ?? ""
  return `${first} ${last}`.trim() || "ליד חדש"
}

async function resolveRecipients(orgId: string): Promise<string[]> {
  const admin = createAdminClient()

  const [{ data: org }, { data: members }] = await Promise.all([
    admin.from("organizations").select("settings").eq("id", orgId).maybeSingle(),
    admin
      .from("memberships")
      .select("user_id, role")
      .eq("org_id", orgId)
      .eq("status", "active"),
  ])

  const activeIds = new Set((members ?? []).map((m) => m.user_id))
  const settings = (org?.settings ?? {}) as { lead_notify_user_ids?: string[] }
  const configured = settings.lead_notify_user_ids ?? []

  // Configured list (filtered to active members) → else fall back to the owner.
  const chosen = configured.filter((id) => activeIds.has(id))
  if (chosen.length > 0) return chosen

  const owner = (members ?? []).find((m) => m.role === "owner")
  return owner ? [owner.user_id] : []
}

export async function dispatchLeadNotification(orgId: string, contact: ContactLike): Promise<void> {
  try {
    const recipients = await resolveRecipients(orgId)
    if (recipients.length === 0) return

    const name = leadName(contact)
    const phone = (contact.phone as string | null) ?? ""
    const title = "ליד חדש 🎯"
    const body = phone ? `${name} · ${phone}` : name
    const contactId = contact.id as string

    const admin = createAdminClient()
    await admin.from("notifications").insert(
      recipients.map((userId) => ({
        org_id: orgId,
        user_id: userId,
        type: "lead",
        title,
        body,
        entity_type: "contact",
        entity_id: contactId,
      }))
    )

    await Promise.all(
      recipients.map((userId) =>
        sendPushToUser(userId, { title, body, url: "/crm" }).catch(() => {})
      )
    )
  } catch {
    // Never let notification failures affect the API write.
  }
}
