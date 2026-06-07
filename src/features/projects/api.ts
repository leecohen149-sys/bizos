import type { SupabaseClient } from "@supabase/supabase-js"

import type { Database } from "@/lib/supabase/database.types"
import type { Project } from "@/lib/types"

type DB = SupabaseClient<Database>

export type ProjectWithCounts = Project & { task_count: number }

export async function fetchProjects(
  supabase: DB,
  orgId: string
): Promise<ProjectWithCounts[]> {
  const { data, error } = await supabase
    .from("projects")
    .select("*, tasks(count)")
    .eq("org_id", orgId)
    .order("created_at", { ascending: true })
  if (error) throw error

  return (data ?? []).map((p) => {
    const { tasks, ...rest } = p as Project & {
      tasks: { count: number }[] | null
    }
    return { ...(rest as Project), task_count: tasks?.[0]?.count ?? 0 }
  })
}

export async function createProject(
  supabase: DB,
  values: Database["public"]["Tables"]["projects"]["Insert"]
): Promise<Project> {
  const { data, error } = await supabase
    .from("projects")
    .insert(values)
    .select("*")
    .single()
  if (error) throw error
  return data as Project
}

export async function updateProject(
  supabase: DB,
  id: string,
  patch: Database["public"]["Tables"]["projects"]["Update"]
): Promise<Project> {
  const { data, error } = await supabase
    .from("projects")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single()
  if (error) throw error
  return data as Project
}

export async function deleteProject(supabase: DB, id: string): Promise<void> {
  const { error } = await supabase.from("projects").delete().eq("id", id)
  if (error) throw error
}
