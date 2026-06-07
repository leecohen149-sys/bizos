"use client"

import * as React from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { optimisticMutation } from "@/lib/query/optimistic"
import { useOrg } from "@/features/org/org-context"
import { useSupabase } from "@/features/tasks/hooks"
import type { CrmStage, CrmDeal } from "@/lib/types"
import type { Database } from "@/lib/supabase/database.types"

export type DealWithRelations = CrmDeal & {
  contact: { id: string; first_name: string; last_name: string | null } | null
  company: { id: string; name: string } | null
}

type DealInsert = Omit<
  Database["public"]["Tables"]["crm_deals"]["Insert"],
  "org_id" | "pipeline_id"
>
type DealUpdate = Database["public"]["Tables"]["crm_deals"]["Update"]

export function usePipeline() {
  const supabase = useSupabase()
  const { orgId } = useOrg()
  return useQuery({
    queryKey: ["crm", "pipeline", orgId],
    queryFn: async (): Promise<string> => {
      const { data, error } = await supabase.rpc("ensure_default_pipeline", {
        _org: orgId,
      })
      if (error) throw error
      return data as string
    },
    staleTime: Infinity,
  })
}

export function useStages(pipelineId: string | undefined) {
  const supabase = useSupabase()
  return useQuery({
    queryKey: ["crm", "stages", pipelineId],
    enabled: !!pipelineId,
    queryFn: async (): Promise<CrmStage[]> => {
      const { data, error } = await supabase
        .from("crm_stages")
        .select("*")
        .eq("pipeline_id", pipelineId!)
        .order("position")
      if (error) throw error
      return data ?? []
    },
  })
}

export function dealsKey(orgId: string) {
  return ["crm", "deals", orgId] as const
}

export function useDealsRealtime() {
  const supabase = useSupabase()
  const qc = useQueryClient()
  const { orgId } = useOrg()

  React.useEffect(() => {
    const channel = supabase
      .channel(`deals:${orgId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "crm_deals", filter: `org_id=eq.${orgId}` },
        () => void qc.invalidateQueries({ queryKey: dealsKey(orgId) })
      )
      .subscribe()
    return () => void supabase.removeChannel(channel)
  }, [supabase, qc, orgId])
}

export function useDeals() {
  const supabase = useSupabase()
  const { orgId } = useOrg()

  return useQuery({
    queryKey: dealsKey(orgId),
    queryFn: async (): Promise<DealWithRelations[]> => {
      const { data, error } = await supabase
        .from("crm_deals")
        .select(
          "*, contact:crm_contacts(id, first_name, last_name), company:crm_companies(id, name)"
        )
        .eq("org_id", orgId)
        .order("position")
      if (error) throw error
      return (data ?? []) as unknown as DealWithRelations[]
    },
  })
}

export function useCreateDeal(pipelineId: string | undefined) {
  const supabase = useSupabase()
  const qc = useQueryClient()
  const { orgId, currentUserId } = useOrg()
  return useMutation({
    mutationFn: async (input: DealInsert) => {
      const { data, error } = await supabase
        .from("crm_deals")
        .insert({
          ...input,
          org_id: orgId,
          pipeline_id: pipelineId!,
          owner_id: input.owner_id ?? currentUserId,
        })
        .select("*")
        .single()
      if (error) throw error
      return data as CrmDeal
    },
    onSettled: () => qc.invalidateQueries({ queryKey: dealsKey(orgId) }),
  })
}

export function useUpdateDeal() {
  const supabase = useSupabase()
  const qc = useQueryClient()
  const { orgId } = useOrg()
  const key = dealsKey(orgId)
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: DealUpdate }) => {
      const { error } = await supabase.from("crm_deals").update(patch).eq("id", id)
      if (error) throw error
    },
    ...optimisticMutation<DealWithRelations[], { id: string; patch: DealUpdate }>(qc, {
      queryKey: key,
      applyOptimistic: (prev, { id, patch }) =>
        (prev ?? []).map((d) => (d.id === id ? { ...d, ...patch } : d)),
    }),
  })
}

export function useDeleteDeal() {
  const supabase = useSupabase()
  const qc = useQueryClient()
  const { orgId } = useOrg()
  const key = dealsKey(orgId)
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("crm_deals").delete().eq("id", id)
      if (error) throw error
    },
    ...optimisticMutation<DealWithRelations[], string>(qc, {
      queryKey: key,
      applyOptimistic: (prev, id) => (prev ?? []).filter((d) => d.id !== id),
    }),
  })
}
