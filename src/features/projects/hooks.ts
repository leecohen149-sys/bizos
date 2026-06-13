"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { optimisticMutation } from "@/lib/query/optimistic"
import { useOrg } from "@/features/org/org-context"
import { useSupabase } from "@/features/tasks/hooks"
import type { Database } from "@/lib/supabase/database.types"
import {
  fetchProjects,
  createProject,
  updateProject,
  deleteProject,
  type ProjectWithCounts,
} from "./api"

type ProjectUpdate = Database["public"]["Tables"]["projects"]["Update"]
/** Insert payload from the UI — org_id/owner_id are filled by the hook. */
type ProjectInsert = Omit<
  Database["public"]["Tables"]["projects"]["Insert"],
  "org_id" | "owner_id"
>

export function projectsKey(orgId: string) {
  return ["projects", orgId] as const
}

export function useProjects() {
  const supabase = useSupabase()
  const { orgId } = useOrg()
  return useQuery({
    queryKey: projectsKey(orgId),
    queryFn: () => fetchProjects(supabase, orgId),
  })
}

export function useCreateProject() {
  const supabase = useSupabase()
  const qc = useQueryClient()
  const { orgId, currentUserId } = useOrg()
  const key = projectsKey(orgId)

  return useMutation({
    mutationFn: (input: ProjectInsert) =>
      createProject(supabase, { ...input, org_id: orgId, owner_id: currentUserId }),
    ...optimisticMutation<ProjectWithCounts[], ProjectInsert>(qc, {
      queryKey: key,
      applyOptimistic: (prev, input) => [
        ...(prev ?? []),
        {
          id: `optimistic-${crypto.randomUUID()}`,
          org_id: orgId,
          name: input.name ?? "",
          description: input.description ?? null,
          status: input.status ?? "active",
          color: input.color ?? "#6366f1",
          owner_id: currentUserId,
          start_date: input.start_date ?? null,
          due_date: input.due_date ?? null,
          archived_at: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          task_count: 0,
        },
      ],
    }),
  })
}

export function useUpdateProject() {
  const supabase = useSupabase()
  const qc = useQueryClient()
  const { orgId } = useOrg()
  const key = projectsKey(orgId)

  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: ProjectUpdate }) =>
      updateProject(supabase, id, patch),
    ...optimisticMutation<ProjectWithCounts[], { id: string; patch: ProjectUpdate }>(
      qc,
      {
        queryKey: key,
        applyOptimistic: (prev, { id, patch }) =>
          (prev ?? []).map((p) => (p.id === id ? { ...p, ...patch } : p)),
      }
    ),
  })
}

export function useDeleteProject() {
  const supabase = useSupabase()
  const qc = useQueryClient()
  const { orgId } = useOrg()
  const key = projectsKey(orgId)

  return useMutation({
    mutationFn: (id: string) => deleteProject(supabase, id),
    ...optimisticMutation<ProjectWithCounts[], string>(qc, {
      queryKey: key,
      applyOptimistic: (prev, id) => (prev ?? []).filter((p) => p.id !== id),
    }),
  })
}
