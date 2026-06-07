import type { SupabaseClient } from "@supabase/supabase-js"

import type { Database } from "@/lib/supabase/database.types"
import type { TaskWithRelations } from "@/lib/types"

type DB = SupabaseClient<Database>

const TASK_SELECT = `
  *,
  assignee:profiles!tasks_assignee_id_fkey(id, full_name, avatar_url),
  project:projects(id, name, color),
  task_labels(label:labels(id, name, color))
` as const

type RawTask = Record<string, unknown> & {
  assignee: TaskWithRelations["assignee"]
  project: TaskWithRelations["project"]
  task_labels: { label: TaskWithRelations["labels"][number] | null }[] | null
}

function mapTask(row: RawTask): TaskWithRelations {
  const { task_labels, ...rest } = row
  return {
    ...(rest as unknown as TaskWithRelations),
    assignee: row.assignee ?? null,
    project: row.project ?? null,
    labels: (task_labels ?? [])
      .map((tl) => tl.label)
      .filter((l): l is TaskWithRelations["labels"][number] => l !== null),
  }
}

export type TaskScope =
  | { kind: "project"; projectId: string }
  | { kind: "inbox" } // tasks with no project
  | { kind: "assignee"; userId: string } // My Tasks (cross-project)
  | { kind: "all" }

export async function fetchTasks(
  supabase: DB,
  orgId: string,
  scope: TaskScope
): Promise<TaskWithRelations[]> {
  let query = supabase
    .from("tasks")
    .select(TASK_SELECT)
    .eq("org_id", orgId)
    .order("position", { ascending: true })
    .order("created_at", { ascending: true })

  if (scope.kind === "project") query = query.eq("project_id", scope.projectId)
  if (scope.kind === "inbox") query = query.is("project_id", null)
  if (scope.kind === "assignee") query = query.eq("assignee_id", scope.userId)

  const { data, error } = await query
  if (error) throw error
  return (data as unknown as RawTask[]).map(mapTask)
}

export async function createTask(
  supabase: DB,
  values: Database["public"]["Tables"]["tasks"]["Insert"]
): Promise<TaskWithRelations> {
  const { data, error } = await supabase
    .from("tasks")
    .insert(values)
    .select(TASK_SELECT)
    .single()
  if (error) throw error
  return mapTask(data as unknown as RawTask)
}

export async function updateTask(
  supabase: DB,
  id: string,
  patch: Database["public"]["Tables"]["tasks"]["Update"]
): Promise<TaskWithRelations> {
  const { data, error } = await supabase
    .from("tasks")
    .update(patch)
    .eq("id", id)
    .select(TASK_SELECT)
    .single()
  if (error) throw error
  return mapTask(data as unknown as RawTask)
}

export async function deleteTask(supabase: DB, id: string): Promise<void> {
  const { error } = await supabase.from("tasks").delete().eq("id", id)
  if (error) throw error
}

/** Count direct subtasks + completed, from an already-fetched task list. */
export function subtaskProgress(tasks: TaskWithRelations[], parentId: string) {
  const children = tasks.filter((t) => t.parent_task_id === parentId)
  return {
    total: children.length,
    done: children.filter((t) => t.status === "done").length,
  }
}
