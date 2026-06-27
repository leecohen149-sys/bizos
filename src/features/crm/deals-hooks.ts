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

function stagesKey(pipelineId: string) {
  return ["crm", "stages", pipelineId] as const
}

export function useCreateStage(pipelineId: string | undefined) {
  const supabase = useSupabase()
  const qc = useQueryClient()
  const { orgId } = useOrg()
  return useMutation({
    mutationFn: async ({ name, color }: { name: string; color: string }) => {
      const { data: last } = await supabase
        .from("crm_stages")
        .select("position")
        .eq("pipeline_id", pipelineId!)
        .order("position", { ascending: false })
        .limit(1)
        .maybeSingle()
      const position = (last?.position ?? 0) + 1000
      const { data, error } = await supabase
        .from("crm_stages")
        .insert({ org_id: orgId, pipeline_id: pipelineId!, name, color, position })
        .select("*")
        .single()
      if (error) throw error
      return data as CrmStage
    },
    onSuccess: () =>
      pipelineId &&
      qc.invalidateQueries({ queryKey: stagesKey(pipelineId) }),
  })
}

type StagePatch = { name?: string; color?: string; position?: number }

export function useUpdateStage(pipelineId: string | undefined) {
  const supabase = useSupabase()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: StagePatch }) => {
      const { error } = await supabase.from("crm_stages").update(patch).eq("id", id)
      if (error) throw error
    },
    onSuccess: () =>
      pipelineId &&
      qc.invalidateQueries({ queryKey: stagesKey(pipelineId) }),
  })
}

export function useDeleteStage(pipelineId: string | undefined) {
  const supabase = useSupabase()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("crm_stages").delete().eq("id", id)
      if (error) throw error
    },
    onSuccess: () =>
      pipelineId &&
      qc.invalidateQueries({ queryKey: stagesKey(pipelineId) }),
  })
}

/** Move all deals from one stage to another, then delete the source stage. */
export function useMoveDealsAndDeleteStage(pipelineId: string | undefined) {
  const supabase = useSupabase()
  const qc = useQueryClient()
  const { orgId } = useOrg()
  return useMutation({
    mutationFn: async ({ stageId, targetId }: { stageId: string; targetId: string }) => {
      const { error } = await supabase.rpc("move_deals_and_delete_stage", {
        _stage: stageId,
        _target: targetId,
      })
      if (error) throw error
    },
    onSuccess: () => {
      if (pipelineId) qc.invalidateQueries({ queryKey: stagesKey(pipelineId) })
      qc.invalidateQueries({ queryKey: dealsKey(orgId) })
    },
  })
}

export function dealsKey(orgId: string) {
  return ["crm", "deals", orgId] as const
}

/**
 * Subscribe to realtime deal changes for the org. Call this in exactly ONE
 * place per screen — a second channel on the same `deals:${orgId}` topic throws
 * "cannot add postgres_changes callbacks". `useDeals` itself does not subscribe.
 */
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
        .order("created_at", { ascending: true })
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
