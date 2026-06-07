import { z } from "zod"

import { TASK_STATUSES, TASK_PRIORITIES } from "@/lib/constants/domain"

export const taskStatusSchema = z.enum(TASK_STATUSES)
export const taskPrioritySchema = z.enum(TASK_PRIORITIES)

export const createTaskSchema = z.object({
  title: z.string().trim().min(1, "נא להזין כותרת").max(200),
  description: z.string().max(5000).optional().nullable(),
  status: taskStatusSchema.default("not_started"),
  priority: taskPrioritySchema.default("medium"),
  project_id: z.string().uuid().optional().nullable(),
  parent_task_id: z.string().uuid().optional().nullable(),
  assignee_id: z.string().uuid().optional().nullable(),
  due_date: z.string().optional().nullable(),
  start_date: z.string().optional().nullable(),
})
export type CreateTaskInput = z.infer<typeof createTaskSchema>

export const updateTaskSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  description: z.string().max(5000).optional().nullable(),
  status: taskStatusSchema.optional(),
  priority: taskPrioritySchema.optional(),
  project_id: z.string().uuid().optional().nullable(),
  assignee_id: z.string().uuid().optional().nullable(),
  due_date: z.string().optional().nullable(),
  start_date: z.string().optional().nullable(),
  position: z.number().optional(),
  completed_at: z.string().optional().nullable(),
})
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>
