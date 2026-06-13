"use client"

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
        .order("first_name")
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
