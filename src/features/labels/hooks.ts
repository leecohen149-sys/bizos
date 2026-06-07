"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { useOrg } from "@/features/org/org-context"
import { useSupabase } from "@/features/tasks/hooks"
import type { Label } from "@/lib/types"

export const LABEL_COLORS = [
  "#6366f1",
  "#0ea5e9",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#ec4899",
  "#8b5cf6",
  "#14b8a6",
] as const

export function labelsKey(orgId: string) {
  return ["labels", orgId] as const
}

export function useLabels() {
  const supabase = useSupabase()
  const { orgId } = useOrg()
  return useQuery({
    queryKey: labelsKey(orgId),
    queryFn: async (): Promise<Label[]> => {
      const { data, error } = await supabase
        .from("labels")
        .select("*")
        .eq("org_id", orgId)
        .order("name")
      if (error) throw error
      return data ?? []
    },
  })
}

export function useCreateLabel() {
  const supabase = useSupabase()
  const qc = useQueryClient()
  const { orgId } = useOrg()
  return useMutation({
    mutationFn: async ({ name, color }: { name: string; color: string }) => {
      const { data, error } = await supabase
        .from("labels")
        .insert({ org_id: orgId, name, color })
        .select("*")
        .single()
      if (error) throw error
      return data as Label
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: labelsKey(orgId) }),
  })
}

/** Attach/detach a label to a task, then refresh task lists (which embed labels). */
export function useToggleTaskLabel() {
  const supabase = useSupabase()
  const qc = useQueryClient()
  const { orgId } = useOrg()
  return useMutation({
    mutationFn: async ({
      taskId,
      labelId,
      attached,
    }: {
      taskId: string
      labelId: string
      attached: boolean
    }) => {
      if (attached) {
        const { error } = await supabase
          .from("task_labels")
          .delete()
          .eq("task_id", taskId)
          .eq("label_id", labelId)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from("task_labels")
          .insert({ task_id: taskId, label_id: labelId })
        if (error) throw error
      }
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["tasks", orgId] }),
  })
}
