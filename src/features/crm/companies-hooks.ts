"use client"

import * as React from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { optimisticMutation } from "@/lib/query/optimistic"
import { useOrg } from "@/features/org/org-context"
import { useSupabase } from "@/features/tasks/hooks"
import type { CrmCompany } from "@/lib/types"
import type { Database } from "@/lib/supabase/database.types"

type CompanyInsert = Omit<
  Database["public"]["Tables"]["crm_companies"]["Insert"],
  "org_id"
>

export function companiesKey(orgId: string) {
  return ["crm", "companies", orgId] as const
}

/**
 * Subscribe to realtime company changes for the org so companies created via
 * the public API appear on the open CRM screen without a manual refresh. Call
 * this in exactly ONE place per screen — a second channel on the same
 * `companies:${orgId}` topic throws "cannot add postgres_changes callbacks".
 */
export function useCompaniesRealtime() {
  const supabase = useSupabase()
  const qc = useQueryClient()
  const { orgId } = useOrg()

  React.useEffect(() => {
    const channel = supabase
      .channel(`companies:${orgId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "crm_companies", filter: `org_id=eq.${orgId}` },
        () => void qc.invalidateQueries({ queryKey: companiesKey(orgId) })
      )
      .subscribe()
    return () => void supabase.removeChannel(channel)
  }, [supabase, qc, orgId])
}

export function useCompanies() {
  const supabase = useSupabase()
  const { orgId } = useOrg()
  return useQuery({
    queryKey: companiesKey(orgId),
    queryFn: async (): Promise<CrmCompany[]> => {
      const { data, error } = await supabase
        .from("crm_companies")
        .select("*")
        .eq("org_id", orgId)
        .order("name")
      if (error) throw error
      return data ?? []
    },
  })
}

export function useCreateCompany() {
  const supabase = useSupabase()
  const qc = useQueryClient()
  const { orgId } = useOrg()
  const key = companiesKey(orgId)
  return useMutation({
    mutationFn: async (input: CompanyInsert) => {
      const { data, error } = await supabase
        .from("crm_companies")
        .insert({ ...input, org_id: orgId })
        .select("*")
        .single()
      if (error) throw error
      return data as CrmCompany
    },
    ...optimisticMutation<CrmCompany[], CompanyInsert>(qc, {
      queryKey: key,
      applyOptimistic: (prev, input) => [
        ...(prev ?? []),
        {
          id: `optimistic-${crypto.randomUUID()}`,
          org_id: orgId,
          name: input.name ?? "",
          domain: input.domain ?? null,
          industry: input.industry ?? null,
          notes: input.notes ?? null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ],
    }),
  })
}

export function useUpdateCompany() {
  const supabase = useSupabase()
  const qc = useQueryClient()
  const { orgId } = useOrg()
  const key = companiesKey(orgId)
  return useMutation({
    mutationFn: async ({ id, ...patch }: CompanyInsert & { id: string }) => {
      const { data, error } = await supabase
        .from("crm_companies")
        .update(patch)
        .eq("id", id)
        .select("*")
        .single()
      if (error) throw error
      return data as CrmCompany
    },
    onSettled: () => qc.invalidateQueries({ queryKey: key }),
  })
}

export function useDeleteCompany() {
  const supabase = useSupabase()
  const qc = useQueryClient()
  const { orgId } = useOrg()
  const key = companiesKey(orgId)
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("crm_companies").delete().eq("id", id)
      if (error) throw error
    },
    ...optimisticMutation<CrmCompany[], string>(qc, {
      queryKey: key,
      applyOptimistic: (prev, id) => (prev ?? []).filter((c) => c.id !== id),
    }),
  })
}
