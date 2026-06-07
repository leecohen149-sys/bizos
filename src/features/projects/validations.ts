import { z } from "zod"

import { PROJECT_STATUSES } from "@/lib/constants/domain"

export const PROJECT_COLORS = [
  "#6366f1",
  "#0ea5e9",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#ec4899",
  "#8b5cf6",
  "#64748b",
] as const

export const createProjectSchema = z.object({
  name: z.string().trim().min(1, "נא להזין שם פרויקט").max(120),
  description: z.string().max(2000).optional().nullable(),
  color: z.string(),
  status: z.enum(PROJECT_STATUSES),
  due_date: z.string().optional().nullable(),
})
export type CreateProjectInput = z.infer<typeof createProjectSchema>

export const updateProjectSchema = createProjectSchema.partial().extend({
  archived_at: z.string().optional().nullable(),
})
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>
