import { z } from "zod"

import { createCompanySchema, createDealSchema } from "@/features/crm/validations"
import { createTaskSchema, updateTaskSchema } from "@/features/tasks/validations"
import {
  createProjectSchema,
  updateProjectSchema,
} from "@/features/projects/validations"
import { ACTIVITY_TYPES } from "@/features/crm/validations"

/**
 * Request schemas for the public API, reusing the app's existing Zod schemas
 * where they exist. These are the single source of truth for both runtime
 * validation (resource-handler) and the OpenAPI document (openapi.ts).
 */

// --- deals ------------------------------------------------------------------
// crm_deals also requires pipeline_id (derived from stage_id server-side — see
// resources.ts prepareCreate), so it isn't part of the request body.
export const dealCreateSchema = createDealSchema.extend({
  value: z.number().min(0).optional(),
  currency: z.string().length(3).optional(),
  owner_id: z.string().uuid().optional().nullable(),
})
export const dealUpdateSchema = dealCreateSchema.partial().extend({
  status: z.enum(["open", "won", "lost"]).optional(),
  position: z.number().optional(),
})

// --- contacts ---------------------------------------------------------------
// Intentionally lenient (unlike the UI form schema): leads must never be blocked
// by a typo'd email or a missing field. Email is accepted as free text (no
// format check) and first_name is optional — it's defaulted server-side
// (resources.ts prepareCreate) so the row always has a name.
export const contactCreateSchema = z.object({
  first_name: z.string().trim().max(120).optional().nullable(),
  last_name: z.string().max(120).optional().nullable(),
  email: z.string().max(200).optional().nullable(),
  phone: z.string().max(60).optional().nullable(),
  title: z.string().max(160).optional().nullable(),
  company_id: z.string().uuid().optional().nullable(),
  owner_id: z.string().uuid().optional().nullable(),
})
export const contactUpdateSchema = contactCreateSchema.partial()

// --- companies --------------------------------------------------------------
export const companyCreateSchema = createCompanySchema
export const companyUpdateSchema = createCompanySchema.partial()

// --- tasks ------------------------------------------------------------------
export const taskCreateSchema = createTaskSchema
export const taskUpdateSchema = updateTaskSchema

// --- projects ---------------------------------------------------------------
export const projectCreateSchema = createProjectSchema
export const projectUpdateSchema = updateProjectSchema

// --- activities -------------------------------------------------------------
export const activityCreateSchema = z.object({
  type: z.enum(ACTIVITY_TYPES).default("note"),
  contact_id: z.string().uuid().optional().nullable(),
  deal_id: z.string().uuid().optional().nullable(),
  task_id: z.string().uuid().optional().nullable(),
  note: z.string().max(5000).optional().nullable(),
  occurred_at: z.string().optional().nullable(),
})
export const activityUpdateSchema = activityCreateSchema.partial()

// --- shared list query ------------------------------------------------------
export const listQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
  updated_since: z.string().optional(),
})
