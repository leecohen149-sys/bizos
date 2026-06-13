"use server"

import { revalidatePath } from "next/cache"

import { createClient } from "@/lib/supabase/server"
import { getActiveOrg } from "@/features/org/queries"
import { ADMIN_ROLES } from "@/lib/constants/domain"
import type { Json } from "@/lib/supabase/database.types"

type Result = { error: string } | { ok: true }

/**
 * Set which org members receive new-lead notifications + push. Stored in
 * organizations.settings.lead_notify_user_ids. Owner/admin only (RLS also
 * enforces the org-update permission).
 */
export async function updateLeadRecipientsAction(userIds: string[]): Promise<Result> {
  const org = await getActiveOrg()
  if (!org) return { error: "לא נמצא עסק פעיל" }
  if (!ADMIN_ROLES.includes(org.role)) return { error: "אין לך הרשאה לפעולה זו" }

  const supabase = await createClient()

  const { data: current } = await supabase
    .from("organizations")
    .select("settings")
    .eq("id", org.id)
    .maybeSingle()

  const settings = { ...((current?.settings as Record<string, unknown>) ?? {}) }
  settings.lead_notify_user_ids = userIds

  const { error } = await supabase
    .from("organizations")
    .update({ settings: settings as Json })
    .eq("id", org.id)
  if (error) return { error: "שמירת ההגדרה נכשלה" }

  revalidatePath("/notifications")
  return { ok: true }
}
