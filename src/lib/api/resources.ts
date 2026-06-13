import "server-only"

import type { z } from "zod"

import { createAdminClient } from "@/lib/supabase/admin"
import type { ApiResource } from "./repo"
import * as S from "./schemas"

/**
 * Per-resource configuration consumed by the route factory (resource-handler.ts)
 * and the OpenAPI generator (openapi.ts). One entry per public resource.
 */
export type ResourceConfig = {
  resource: ApiResource
  /** Human label for docs. */
  label: string
  createSchema: z.ZodTypeAny
  updateSchema: z.ZodTypeAny
  readScope: string
  writeScope: string
  /**
   * Optional hook to derive/augment fields the request body doesn't carry
   * (e.g. deals derive pipeline_id from stage_id). Runs before insert, scoped
   * to the caller's org. Throws a user-facing message on bad references.
   */
  prepareCreate?: (
    orgId: string,
    input: Record<string, unknown>
  ) => Promise<Record<string, unknown>>
}

async function derivePipelineFromStage(
  orgId: string,
  input: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const stageId = input.stage_id
  if (typeof stageId !== "string") {
    throw new Error("stage_id is required to create a deal")
  }
  const admin = createAdminClient()
  const { data, error } = await admin
    .from("crm_stages")
    .select("pipeline_id")
    .eq("org_id", orgId)
    .eq("id", stageId)
    .maybeSingle()
  if (error) throw new Error(error.message)
  if (!data) throw new Error("stage_id does not reference a stage in this org")
  return { ...input, pipeline_id: data.pipeline_id }
}

export const RESOURCES: Record<ApiResource, ResourceConfig> = {
  deals: {
    resource: "deals",
    label: "Deal",
    createSchema: S.dealCreateSchema,
    updateSchema: S.dealUpdateSchema,
    readScope: "deals:read",
    writeScope: "deals:write",
    prepareCreate: derivePipelineFromStage,
  },
  contacts: {
    resource: "contacts",
    label: "Contact",
    createSchema: S.contactCreateSchema,
    updateSchema: S.contactUpdateSchema,
    readScope: "contacts:read",
    writeScope: "contacts:write",
  },
  companies: {
    resource: "companies",
    label: "Company",
    createSchema: S.companyCreateSchema,
    updateSchema: S.companyUpdateSchema,
    readScope: "companies:read",
    writeScope: "companies:write",
  },
  tasks: {
    resource: "tasks",
    label: "Task",
    createSchema: S.taskCreateSchema,
    updateSchema: S.taskUpdateSchema,
    readScope: "tasks:read",
    writeScope: "tasks:write",
  },
  projects: {
    resource: "projects",
    label: "Project",
    createSchema: S.projectCreateSchema,
    updateSchema: S.projectUpdateSchema,
    readScope: "projects:read",
    writeScope: "projects:write",
  },
  activities: {
    resource: "activities",
    label: "Activity",
    createSchema: S.activityCreateSchema,
    updateSchema: S.activityUpdateSchema,
    readScope: "activities:read",
    writeScope: "activities:write",
  },
}

/** All scopes, for docs/OpenAPI. Mirrors the client-safe API_SCOPES catalog. */
export { API_SCOPES as ALL_SCOPES } from "@/features/integrations/constants"

export const RESOURCE_LIST = Object.values(RESOURCES)
