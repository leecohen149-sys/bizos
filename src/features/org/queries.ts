import "server-only"

import { cookies } from "next/headers"
import type { User } from "@supabase/supabase-js"

import { createClient } from "@/lib/supabase/server"
import type { OrgRole } from "@/lib/constants/domain"
import type { OrgMember } from "@/lib/types"

export const ACTIVE_ORG_COOKIE = "bizos-org"

export type OrgSummary = {
  id: string
  name: string
  slug: string
  role: OrgRole
}

export async function getSessionUser(): Promise<User | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
}

/** Active-membership orgs for the current user (with the caller's role). */
export async function getUserOrgs(): Promise<OrgSummary[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("memberships")
    .select("role, organizations(id, name, slug)")
    .eq("status", "active")
    .order("created_at", { ascending: true })

  if (error || !data) return []

  return data
    .map((m) => {
      const org = m.organizations as unknown as {
        id: string
        name: string
        slug: string
      } | null
      if (!org) return null
      return { id: org.id, name: org.name, slug: org.slug, role: m.role as OrgRole }
    })
    .filter((o): o is OrgSummary => o !== null)
}

/** Active members of an org (for assignee pickers, member lists). */
export async function getOrgMembers(orgId: string): Promise<OrgMember[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("memberships")
    .select("user_id, role, profiles(full_name, avatar_url)")
    .eq("org_id", orgId)
    .eq("status", "active")

  if (error || !data) return []

  return data.map((m) => {
    const p = m.profiles as unknown as {
      full_name: string | null
      avatar_url: string | null
    } | null
    return {
      user_id: m.user_id,
      role: m.role as OrgRole,
      full_name: p?.full_name ?? null,
      avatar_url: p?.avatar_url ?? null,
    }
  })
}

/** Resolve the active org from cookie, validated against membership. */
export async function getActiveOrg(): Promise<OrgSummary | null> {
  const orgs = await getUserOrgs()
  if (orgs.length === 0) return null

  const cookieStore = await cookies()
  const preferred = cookieStore.get(ACTIVE_ORG_COOKIE)?.value
  return orgs.find((o) => o.id === preferred) ?? orgs[0]
}
