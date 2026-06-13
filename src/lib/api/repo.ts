import "server-only"

import type { SupabaseClient } from "@supabase/supabase-js"

import { createAdminClient } from "@/lib/supabase/admin"

/**
 * THE tenant-isolation chokepoint for the public API.
 *
 * Every function takes `orgId` as its first argument and ALWAYS injects
 * `.eq('org_id', orgId)`, and create/update always force `org_id` and strip any
 * client-supplied `org_id`/`id`. The API routes use the service-role client
 * (which bypasses RLS), so this module is the single place where cross-tenant
 * isolation is enforced for API traffic — keep all `/api/v1` DB access here.
 */

export type ApiResource =
  | "deals"
  | "contacts"
  | "companies"
  | "tasks"
  | "projects"
  | "activities"

/** URL slug → physical table name. */
export const RESOURCE_TABLES: Record<ApiResource, string> = {
  deals: "crm_deals",
  contacts: "crm_contacts",
  companies: "crm_companies",
  tasks: "tasks",
  projects: "projects",
  activities: "crm_activities",
}

type Row = Record<string, unknown>

export type ListParams = {
  cursor?: string | null
  limit?: number
  updatedSince?: string | null
}

export type ListResult = {
  data: Row[]
  nextCursor: string | null
  hasMore: boolean
}

const DEFAULT_LIMIT = 50
const MAX_LIMIT = 200

// Loosely-typed client: the repo selects tables dynamically, so we opt out of
// the per-table generics (which collapse to `never` on dynamic table names).
function db(): SupabaseClient {
  return createAdminClient() as unknown as SupabaseClient
}

function table(resource: ApiResource): string {
  return RESOURCE_TABLES[resource]
}

// --- cursor helpers (keyset on (updated_at, id)) ----------------------------
function encodeCursor(row: Row): string {
  const raw = `${String(row.updated_at)}|${String(row.id)}`
  return Buffer.from(raw, "utf8").toString("base64url")
}

function decodeCursor(cursor: string): { updatedAt: string; id: string } | null {
  try {
    const raw = Buffer.from(cursor, "base64url").toString("utf8")
    const idx = raw.lastIndexOf("|")
    if (idx === -1) return null
    return { updatedAt: raw.slice(0, idx), id: raw.slice(idx + 1) }
  } catch {
    return null
  }
}

export const repo = {
  async list(orgId: string, resource: ApiResource, params: ListParams): Promise<ListResult> {
    const limit = Math.min(MAX_LIMIT, Math.max(1, params.limit ?? DEFAULT_LIMIT))
    // updated_since → walk forward chronologically (ascending); otherwise newest-first.
    const ascending = Boolean(params.updatedSince)

    let query = db()
      .from(table(resource))
      .select("*")
      .eq("org_id", orgId)
      .order("updated_at", { ascending })
      .order("id", { ascending })
      .limit(limit + 1)

    if (params.updatedSince) {
      query = query.gte("updated_at", params.updatedSince)
    }

    if (params.cursor) {
      const c = decodeCursor(params.cursor)
      if (c) {
        // Keyset predicate: strictly past the cursor row in the chosen order.
        const op = ascending ? "gt" : "lt"
        query = query.or(
          `updated_at.${op}.${c.updatedAt},and(updated_at.eq.${c.updatedAt},id.${op}.${c.id})`
        )
      }
    }

    const { data, error } = await query
    if (error) throw new Error(error.message)

    const rows = (data ?? []) as Row[]
    const hasMore = rows.length > limit
    const page = hasMore ? rows.slice(0, limit) : rows
    const nextCursor = hasMore && page.length > 0 ? encodeCursor(page[page.length - 1]) : null

    return { data: page, nextCursor, hasMore }
  },

  async get(orgId: string, resource: ApiResource, id: string): Promise<Row | null> {
    const { data, error } = await db()
      .from(table(resource))
      .select("*")
      .eq("org_id", orgId)
      .eq("id", id)
      .maybeSingle()
    if (error) throw new Error(error.message)
    return (data as Row | null) ?? null
  },

  async create(orgId: string, resource: ApiResource, input: Row): Promise<Row> {
    // Force org_id; never trust a client-supplied org_id or id.
    const { org_id: _o, id: _i, ...rest } = input
    void _o
    void _i
    const { data, error } = await db()
      .from(table(resource))
      .insert({ ...rest, org_id: orgId })
      .select("*")
      .single()
    if (error) throw new Error(error.message)
    return data as Row
  },

  async update(orgId: string, resource: ApiResource, id: string, input: Row): Promise<Row | null> {
    const { org_id: _o, id: _i, ...rest } = input
    void _o
    void _i
    const { data, error } = await db()
      .from(table(resource))
      .update(rest)
      .eq("org_id", orgId)
      .eq("id", id)
      .select("*")
      .maybeSingle()
    if (error) throw new Error(error.message)
    return (data as Row | null) ?? null
  },

  async remove(orgId: string, resource: ApiResource, id: string): Promise<boolean> {
    const { data, error } = await db()
      .from(table(resource))
      .delete()
      .eq("org_id", orgId)
      .eq("id", id)
      .select("id")
      .maybeSingle()
    if (error) throw new Error(error.message)
    return data != null
  },
}
