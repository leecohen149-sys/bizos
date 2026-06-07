"use client"

import { createContext, useContext } from "react"

import type { OrgMember } from "@/lib/types"
import type { OrgRole } from "@/lib/constants/domain"

export type OrgContextValue = {
  orgId: string
  orgName: string
  currentUserId: string
  role: OrgRole
  members: OrgMember[]
}

const OrgContext = createContext<OrgContextValue | null>(null)

export function OrgProvider({
  value,
  children,
}: {
  value: OrgContextValue
  children: React.ReactNode
}) {
  return <OrgContext.Provider value={value}>{children}</OrgContext.Provider>
}

export function useOrg(): OrgContextValue {
  const ctx = useContext(OrgContext)
  if (!ctx) throw new Error("useOrg must be used within <OrgProvider>")
  return ctx
}

export function useOrgMember(userId: string | null | undefined) {
  const { members } = useOrg()
  if (!userId) return null
  return members.find((m) => m.user_id === userId) ?? null
}

/** Can the current user manage projects/CRM (owner/admin/manager)? */
export function useCanManage(): boolean {
  const { role } = useOrg()
  return role === "owner" || role === "admin" || role === "manager"
}
