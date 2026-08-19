"use client"

import * as React from "react"
import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryKey,
} from "@tanstack/react-query"

import { createClient } from "@/lib/supabase/client"
import { optimisticMutation } from "@/lib/query/optimistic"
import { useOrg } from "@/features/org/org-context"
import type { TaskWithRelations } from "@/lib/types"
import type { Database } from "@/lib/supabase/database.types"
import {
  fetchTasks,
  createTask,
  updateTask,
  deleteTask,
  type TaskScope,
} from "./api"

type TaskUpdate = Database["public"]["Tables"]["tasks"]["Update"]
/** Insert payload from the UI — org_id/created_by are filled by the hook. */
export type NewTask = Omit<
  Database["public"]["Tables"]["tasks"]["Insert"],
  "org_id" | "created_by"
>
type TaskInsert = NewTask

export function useSupabase() {
  return React.useMemo(() => createClient(), [])
}

export function taskListKey(orgId: string, scope: TaskScope): QueryKey {
  const tail =
    scope.kind === "project"
      ? scope.projectId
      : scope.kind === "assignee"
        ? scope.userId
        : "-"
  return ["tasks", orgId, scope.kind, tail]
}

export function useTasks(scope: TaskScope) {
  const supabase = useSupabase()
  const { orgId } = useOrg()
  return useQuery({
    queryKey: taskListKey(orgId, scope),
    queryFn: () => fetchTasks(supabase, orgId, scope),
  })
}

/** Fields a scope implies — a task created in a scope must stay visible in it. */
function scopeDefaults(scope: TaskScope): Partial<TaskInsert> {
  if (scope.kind === "project") return { project_id: scope.projectId }
  if (scope.kind === "inbox") return { project_id: null }
  if (scope.kind === "assignee") return { assignee_id: scope.userId }
  return {}
}

function withScopeDefaults(scope: TaskScope, input: TaskInsert): TaskInsert {
  const defined = Object.fromEntries(
    Object.entries(input).filter(([, v]) => v !== undefined)
  ) as TaskInsert
  return { ...scopeDefaults(scope), ...defined }
}

export function useCreateTask(scope: TaskScope) {
  const supabase = useSupabase()
  const qc = useQueryClient()
  const { orgId, currentUserId, members } = useOrg()
  const key = taskListKey(orgId, scope)

  return useMutation({
    mutationFn: (input: TaskInsert) =>
      createTask(supabase, {
        ...withScopeDefaults(scope, input),
        org_id: orgId,
        created_by: currentUserId,
      }),
    ...optimisticMutation<TaskWithRelations[], TaskInsert>(qc, {
      queryKey: key,
      applyOptimistic: (prev, raw) => {
        const input = withScopeDefaults(scope, raw)
        const me = members.find((m) => m.user_id === input.assignee_id)
        const now = new Date().toISOString()
        const optimistic: TaskWithRelations = {
          id: `optimistic-${crypto.randomUUID()}`,
          org_id: orgId,
          project_id: input.project_id ?? null,
          parent_task_id: input.parent_task_id ?? null,
          title: input.title ?? "",
          description: input.description ?? null,
          status: input.status ?? "not_started",
          priority: input.priority ?? "medium",
          assignee_id: input.assignee_id ?? null,
          created_by: currentUserId,
          start_date: input.start_date ?? null,
          due_date: input.due_date ?? null,
          position: input.position ?? 1000,
          completed_at: null,
          created_at: now,
          updated_at: now,
          assignee: me
            ? { id: me.user_id, full_name: me.full_name, avatar_url: me.avatar_url }
            : null,
          project: null,
          labels: [],
        }
        return [...(prev ?? []), optimistic]
      },
    }),
  })
}

export function useUpdateTask(scope: TaskScope) {
  const supabase = useSupabase()
  const qc = useQueryClient()
  const { orgId } = useOrg()
  const key = taskListKey(orgId, scope)

  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: TaskUpdate }) =>
      updateTask(supabase, id, patch),
    ...optimisticMutation<
      TaskWithRelations[],
      { id: string; patch: TaskUpdate }
    >(qc, {
      queryKey: key,
      applyOptimistic: (prev, { id, patch }) =>
        (prev ?? []).map((t) =>
          t.id === id ? { ...t, ...patch, updated_at: new Date().toISOString() } : t
        ),
    }),
  })
}

export function useDeleteTask(scope: TaskScope) {
  const supabase = useSupabase()
  const qc = useQueryClient()
  const { orgId } = useOrg()
  const key = taskListKey(orgId, scope)

  return useMutation({
    mutationFn: (id: string) => deleteTask(supabase, id),
    ...optimisticMutation<TaskWithRelations[], string>(qc, {
      queryKey: key,
      applyOptimistic: (prev, id) => (prev ?? []).filter((t) => t.id !== id),
    }),
  })
}

/** Toggle done/not-started, stamping completed_at. */
export function useToggleComplete(scope: TaskScope) {
  const update = useUpdateTask(scope)
  return (task: TaskWithRelations) => {
    const done = task.status === "done"
    update.mutate({
      id: task.id,
      patch: {
        status: done ? "not_started" : "done",
        completed_at: done ? null : new Date().toISOString(),
      },
    })
  }
}

/** Live-sync: invalidate this org's task queries on any remote change. */
export function useTasksRealtime() {
  const supabase = useSupabase()
  const qc = useQueryClient()
  const { orgId } = useOrg()

  React.useEffect(() => {
    const channel = supabase
      .channel(`tasks:${orgId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tasks",
          filter: `org_id=eq.${orgId}`,
        },
        () => {
          void qc.invalidateQueries({ queryKey: ["tasks", orgId] })
        }
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [supabase, qc, orgId])
}
