"use client"

import * as React from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { optimisticMutation } from "@/lib/query/optimistic"
import { useOrg } from "@/features/org/org-context"
import { useSupabase } from "@/features/tasks/hooks"
import type { CrmContact } from "@/lib/types"
import type { Database } from "@/lib/supabase/database.types"

type ContactInsert = Omit<
  Database["public"]["Tables"]["crm_contacts"]["Insert"],
  "org_id"
>

export type ContactWithCompany = CrmContact & {
  company: { id: string; name: string } | null
}

export function contactsKey(orgId: string) {
  return ["crm", "contacts", orgId] as const
}

/**
 * Subscribe to realtime contact changes for the org so new leads (created via
 * the public API) appear on the open CRM screen without a manual refresh. Call
 * this in exactly ONE place per screen — a second channel on the same
 * `contacts:${orgId}` topic throws "cannot add postgres_changes callbacks".
 */
export function useContactsRealtime() {
  const supabase = useSupabase()
  const qc = useQueryClient()
  const { orgId } = useOrg()

  React.useEffect(() => {
    const channel = supabase
      .channel(`contacts:${orgId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "crm_contacts", filter: `org_id=eq.${orgId}` },
        () => void qc.invalidateQueries({ queryKey: contactsKey(orgId) })
      )
      .subscribe()
    return () => void supabase.removeChannel(channel)
  }, [supabase, qc, orgId])
}

export function useContacts() {
  const supabase = useSupabase()
  const { orgId } = useOrg()
  return useQuery({
    queryKey: contactsKey(orgId),
    queryFn: async (): Promise<ContactWithCompany[]> => {
      const { data, error } = await supabase
        .from("crm_contacts")
        .select("*, company:crm_companies(id, name)")
        .eq("org_id", orgId)
        .order("created_at", { ascending: false })
      if (error) throw error
      return (data ?? []) as unknown as ContactWithCompany[]
    },
  })
}

export function useCreateContact() {
  const supabase = useSupabase()
  const qc = useQueryClient()
  const { orgId, currentUserId } = useOrg()
  const key = contactsKey(orgId)
  return useMutation({
    mutationFn: async (input: ContactInsert) => {
      const { data, error } = await supabase
        .from("crm_contacts")
        .insert({ ...input, org_id: orgId, owner_id: input.owner_id ?? currentUserId })
        .select("*, company:crm_companies(id, name)")
        .single()
      if (error) throw error
      return data as unknown as ContactWithCompany
    },
    onSettled: () => qc.invalidateQueries({ queryKey: key }),
  })
}

export function useUpdateContact() {
  const supabase = useSupabase()
  const qc = useQueryClient()
  const { orgId } = useOrg()
  const key = contactsKey(orgId)
  return useMutation({
    mutationFn: async ({ id, ...patch }: ContactInsert & { id: string }) => {
      const { data, error } = await supabase
        .from("crm_contacts")
        .update(patch)
        .eq("id", id)
        .select("*, company:crm_companies(id, name)")
        .single()
      if (error) throw error
      return data as unknown as ContactWithCompany
    },
    onSettled: () => qc.invalidateQueries({ queryKey: key }),
  })
}

export function useDeleteContact() {
  const supabase = useSupabase()
  const qc = useQueryClient()
  const { orgId } = useOrg()
  const key = contactsKey(orgId)
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("crm_contacts").delete().eq("id", id)
      if (error) throw error
    },
    ...optimisticMutation<ContactWithCompany[], string>(qc, {
      queryKey: key,
      applyOptimistic: (prev, id) => (prev ?? []).filter((c) => c.id !== id),
    }),
  })
}
