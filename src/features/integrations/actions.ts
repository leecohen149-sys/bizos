"use server"

import { revalidatePath } from "next/cache"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { getActiveOrg } from "@/features/org/queries"
import { ADMIN_ROLES } from "@/lib/constants/domain"
import { deliverOne } from "@/lib/api/webhook-deliver"
import { createApiKeySchema, createWebhookSchema } from "./validations"

type Result<T = object> = { error: string } | ({ ok: true } & T)

const SETTINGS_PATH = "/settings/integrations"

/** Resolve the active org and assert the caller is owner/admin. */
async function requireAdminOrg(): Promise<{ orgId: string } | { error: string }> {
  const org = await getActiveOrg()
  if (!org) return { error: "לא נמצא עסק פעיל" }
  if (!ADMIN_ROLES.includes(org.role)) return { error: "אין לך הרשאה לפעולה זו" }
  return { orgId: org.id }
}

// --- API keys ---------------------------------------------------------------
export async function createApiKeyAction(
  values: unknown
): Promise<Result<{ fullKey: string; prefix: string }>> {
  const guard = await requireAdminOrg()
  if ("error" in guard) return guard

  const parsed = createApiKeySchema.safeParse(values)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "קלט לא תקין" }

  const supabase = await createClient()
  const { data, error } = await supabase
    .rpc("create_api_key", {
      _org: guard.orgId,
      _name: parsed.data.name,
      _scopes: parsed.data.scopes,
    })
    .maybeSingle()

  if (error || !data) return { error: "יצירת המפתח נכשלה" }
  revalidatePath(SETTINGS_PATH)
  return { ok: true, fullKey: data.full_key, prefix: data.key_prefix }
}

export async function revokeApiKeyAction(keyId: string): Promise<Result> {
  const guard = await requireAdminOrg()
  if ("error" in guard) return guard

  const supabase = await createClient()
  const { error } = await supabase
    .from("api_keys")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", keyId)
    .eq("org_id", guard.orgId)
  if (error) return { error: "ביטול המפתח נכשל" }
  revalidatePath(SETTINGS_PATH)
  return { ok: true }
}

// --- Webhook endpoints ------------------------------------------------------
export async function createWebhookAction(values: unknown): Promise<Result> {
  const guard = await requireAdminOrg()
  if ("error" in guard) return guard

  const parsed = createWebhookSchema.safeParse(values)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "קלט לא תקין" }

  const supabase = await createClient()
  const { error } = await supabase.from("webhook_endpoints").insert({
    org_id: guard.orgId,
    url: parsed.data.url,
    events: parsed.data.events,
    description: parsed.data.description ?? null,
  })
  if (error) return { error: "יצירת ה-Webhook נכשלה" }
  revalidatePath(SETTINGS_PATH)
  return { ok: true }
}

export async function toggleWebhookAction(
  id: string,
  isActive: boolean
): Promise<Result> {
  const guard = await requireAdminOrg()
  if ("error" in guard) return guard

  const supabase = await createClient()
  const { error } = await supabase
    .from("webhook_endpoints")
    .update({ is_active: isActive })
    .eq("id", id)
    .eq("org_id", guard.orgId)
  if (error) return { error: "העדכון נכשל" }
  revalidatePath(SETTINGS_PATH)
  return { ok: true }
}

export async function deleteWebhookAction(id: string): Promise<Result> {
  const guard = await requireAdminOrg()
  if ("error" in guard) return guard

  const supabase = await createClient()
  const { error } = await supabase
    .from("webhook_endpoints")
    .delete()
    .eq("id", id)
    .eq("org_id", guard.orgId)
  if (error) return { error: "המחיקה נכשלה" }
  revalidatePath(SETTINGS_PATH)
  return { ok: true }
}

/** Enqueue + immediately deliver a test event so the user sees it land. */
export async function testWebhookAction(endpointId: string): Promise<Result> {
  const guard = await requireAdminOrg()
  if ("error" in guard) return guard

  // webhook_deliveries has no client INSERT policy → use the admin client after
  // the explicit owner/admin check above.
  const admin = createAdminClient()
  const { data: ep } = await admin
    .from("webhook_endpoints")
    .select("id")
    .eq("id", endpointId)
    .eq("org_id", guard.orgId)
    .maybeSingle()
  if (!ep) return { error: "ה-Webhook לא נמצא" }

  const { data: delivery, error } = await admin
    .from("webhook_deliveries")
    .insert({
      org_id: guard.orgId,
      endpoint_id: endpointId,
      event_type: "webhook.test",
      payload: {
        event: "webhook.test",
        resource: "webhook",
        occurred_at: new Date().toISOString(),
        data: { message: "בדיקת חיבור מ-BizOS" },
      },
    })
    .select("id")
    .single()
  if (error || !delivery) return { error: "שליחת הבדיקה נכשלה" }

  await deliverOne(delivery.id).catch(() => null)
  revalidatePath(SETTINGS_PATH)
  return { ok: true }
}
