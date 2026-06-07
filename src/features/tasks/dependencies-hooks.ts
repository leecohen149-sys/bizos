"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { useOrg } from "@/features/org/org-context"
import { useSupabase } from "@/features/tasks/hooks"
import type { TaskStatus } from "@/lib/constants/domain"

export type DepTask = { id: string; title: string; status: TaskStatus }
export type DependencyRow = { depId: string; task: DepTask }

export function depsKey(taskId: string) {
  return ["deps", taskId] as const
}

export function useDependencies(taskId: string) {
  const supabase = useSupabase()
  return useQuery({
    queryKey: depsKey(taskId),
    queryFn: async (): Promise<{ blocks: DependencyRow[]; blockedBy: DependencyRow[] }> => {
      const [blocks, blockedBy] = await Promise.all([
        supabase
          .from("task_dependencies")
          .select(
            "id, successor:tasks!task_dependencies_successor_task_id_fkey(id, title, status)"
          )
          .eq("predecessor_task_id", taskId)
          .eq("type", "blocks"),
        supabase
          .from("task_dependencies")
          .select(
            "id, predecessor:tasks!task_dependencies_predecessor_task_id_fkey(id, title, status)"
          )
          .eq("successor_task_id", taskId)
          .eq("type", "blocks"),
      ])
      const mapRows = (
        rows: Record<string, unknown>[] | null,
        key: string
      ): DependencyRow[] =>
        (rows ?? [])
          .map((r) => ({ depId: r.id as string, task: r[key] as DepTask | null }))
          .filter((r): r is DependencyRow => r.task !== null)

      return {
        blocks: mapRows(blocks.data, "successor"),
        blockedBy: mapRows(blockedBy.data, "predecessor"),
      }
    },
  })
}

export function useAddDependency(taskId: string) {
  const supabase = useSupabase()
  const qc = useQueryClient()
  const { orgId } = useOrg()
  return useMutation({
    mutationFn: async ({
      otherId,
      direction,
    }: {
      otherId: string
      direction: "blocks" | "blockedBy"
    }) => {
      const predecessor = direction === "blocks" ? taskId : otherId
      const successor = direction === "blocks" ? otherId : taskId
      const { error } = await supabase.from("task_dependencies").insert({
        org_id: orgId,
        predecessor_task_id: predecessor,
        successor_task_id: successor,
        type: "blocks",
      })
      if (error) throw error
    },
    onSettled: () => qc.invalidateQueries({ queryKey: depsKey(taskId) }),
  })
}

export function useRemoveDependency(taskId: string) {
  const supabase = useSupabase()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (depId: string) => {
      const { error } = await supabase.from("task_dependencies").delete().eq("id", depId)
      if (error) throw error
    },
    onSettled: () => qc.invalidateQueries({ queryKey: depsKey(taskId) }),
  })
}
