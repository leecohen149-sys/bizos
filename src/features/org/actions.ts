"use server"

import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"

import { createClient } from "@/lib/supabase/server"
import { createOrgSchema, inviteMemberSchema } from "@/lib/validations/org"
import { ACTIVE_ORG_COOKIE } from "@/features/org/queries"

type Result<T = object> = { error: string } | ({ ok: true } & T)

const ORG_COOKIE_OPTS = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 365,
}

async function setActiveOrgCookie(orgId: string) {
  const cookieStore = await cookies()
  cookieStore.set(ACTIVE_ORG_COOKIE, orgId, ORG_COOKIE_OPTS)
}

export async function createOrganizationAction(
  values: unknown
): Promise<Result<{ orgId: string }>> {
  const parsed = createOrgSchema.safeParse(values)
  if (!parsed.success) return { error: "שם העסק אינו תקין" }

  const supabase = await createClient()
  const { data, error } = await supabase.rpc("create_organization", {
    _name: parsed.data.name,
  })
  if (error || !data) return { error: "יצירת העסק נכשלה, נסו שוב" }

  const org = data as unknown as { id: string }
  await setActiveOrgCookie(org.id)
  revalidatePath("/", "layout")
  return { ok: true, orgId: org.id }
}

export async function switchOrgAction(orgId: string): Promise<Result> {
  const supabase = await createClient()
  // Re-check membership server-side before honoring the switch.
  const { data } = await supabase
    .from("memberships")
    .select("org_id")
    .eq("org_id", orgId)
    .eq("status", "active")
    .maybeSingle()
  if (!data) return { error: "אין לך גישה לעסק הזה" }

  await setActiveOrgCookie(orgId)
  revalidatePath("/", "layout")
  return { ok: true }
}

export async function updateMemberRoleAction(
  orgId: string,
  userId: string,
  role: string
): Promise<Result> {
  const supabase = await createClient()
  const { error } = await supabase
    .from("memberships")
    .update({ role: role as never })
    .eq("org_id", orgId)
    .eq("user_id", userId)
  if (error) return { error: "עדכון התפקיד נכשל" }
  revalidatePath("/members")
  return { ok: true }
}

export async function removeMemberAction(
  orgId: string,
  userId: string
): Promise<Result> {
  const supabase = await createClient()
  const { error } = await supabase
    .from("memberships")
    .delete()
    .eq("org_id", orgId)
    .eq("user_id", userId)
  if (error) return { error: "הסרת החבר נכשלה" }
  revalidatePath("/members")
  return { ok: true }
}

export async function inviteMemberAction(
  orgId: string,
  values: unknown
): Promise<Result<{ token: string }>> {
  const parsed = inviteMemberSchema.safeParse(values)
  if (!parsed.success) return { error: "פרטי ההזמנה אינם תקינים" }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "לא מחובר" }

  // RLS enforces that only org admins/owners can insert invitations.
  const { data, error } = await supabase
    .from("invitations")
    .insert({
      org_id: orgId,
      email: parsed.data.email.toLowerCase(),
      role: parsed.data.role,
      invited_by: user.id,
    })
    .select("token")
    .single()

  if (error || !data) return { error: "שליחת ההזמנה נכשלה" }
  revalidatePath("/members")
  return { ok: true, token: data.token as string }
}
