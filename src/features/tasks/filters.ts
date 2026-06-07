"use client"

import {
  parseAsArrayOf,
  parseAsString,
  parseAsStringLiteral,
  useQueryStates,
} from "nuqs"

import {
  TASK_STATUSES,
  TASK_PRIORITIES,
  type TaskStatus,
  type TaskPriority,
} from "@/lib/constants/domain"
import type { TaskWithRelations } from "@/lib/types"

export const taskFilterParsers = {
  status: parseAsArrayOf(parseAsStringLiteral(TASK_STATUSES)).withDefault([]),
  priority: parseAsArrayOf(parseAsStringLiteral(TASK_PRIORITIES)).withDefault([]),
  assignee: parseAsString.withDefault(""),
  label: parseAsString.withDefault(""),
  q: parseAsString.withDefault(""),
}

export type TaskFilters = {
  status: TaskStatus[]
  priority: TaskPriority[]
  assignee: string
  label: string
  q: string
}

export function useTaskFilters() {
  return useQueryStates(taskFilterParsers, { history: "replace" })
}

export function isFilterActive(f: TaskFilters): boolean {
  return (
    f.status.length > 0 ||
    f.priority.length > 0 ||
    f.assignee !== "" ||
    f.label !== "" ||
    f.q.trim() !== ""
  )
}

/**
 * Apply filters while keeping subtask relationships intact: a parent is kept if
 * it (or any of its children) matches, so the tree stays renderable.
 */
export function filterTasks(
  tasks: TaskWithRelations[],
  f: TaskFilters
): TaskWithRelations[] {
  if (!isFilterActive(f)) return tasks
  const q = f.q.trim().toLowerCase()

  const matches = (t: TaskWithRelations) => {
    if (f.status.length && !f.status.includes(t.status)) return false
    if (f.priority.length && !f.priority.includes(t.priority)) return false
    if (f.assignee && t.assignee_id !== f.assignee) return false
    if (f.label && !t.labels.some((l) => l.id === f.label)) return false
    if (q && !t.title.toLowerCase().includes(q)) return false
    return true
  }

  const directlyMatched = new Set(tasks.filter(matches).map((t) => t.id))
  // Keep parents whose child matched, and children whose parent matched.
  const keep = new Set(directlyMatched)
  for (const t of tasks) {
    if (t.parent_task_id && directlyMatched.has(t.parent_task_id)) keep.add(t.id)
    if (t.parent_task_id && directlyMatched.has(t.id)) keep.add(t.parent_task_id)
  }
  return tasks.filter((t) => keep.has(t.id))
}
