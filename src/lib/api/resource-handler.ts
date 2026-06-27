import "server-only"

import { authenticateApiKey, hasScope, type ApiAuthContext } from "./auth"
import { checkRateLimit, rateLimitHeaders } from "./rate-limit"
import { repo } from "./repo"
import { ok, created, noContent, ERRORS } from "./response"
import type { ResourceConfig } from "./resources"
import { listQuerySchema } from "./schemas"

/**
 * DRY factory that turns a ResourceConfig into Next route handlers.
 * Every handler runs the same pipeline:
 *   authenticate → rate-limit → scope-check → Zod-validate → repo → envelope.
 * The repo layer is the sole place tenant isolation (org_id scoping) lives.
 */

type ItemCtx = { params: Promise<{ id: string }> }

export async function gate(
  req: Request,
  scope: string
): Promise<{ ctx: ApiAuthContext; headers: Record<string, string> } | Response> {
  const ctx = await authenticateApiKey(req)
  if (!ctx) return ERRORS.unauthorized()

  const rl = await checkRateLimit(ctx.keyId)
  const headers = rateLimitHeaders(rl)
  if (!rl.allowed) return ERRORS.rateLimited(rl.resetSeconds, headers)

  if (!hasScope(ctx, scope)) return ERRORS.forbidden()
  return { ctx, headers }
}

async function parseBody(req: Request): Promise<Record<string, unknown>> {
  const text = await req.text()
  if (!text.trim()) return {}
  return JSON.parse(text) as Record<string, unknown>
}

function zodMessage(error: { issues: { path: PropertyKey[]; message: string }[] }): string {
  return error.issues
    .map((i) => `${i.path.map(String).join(".") || "body"}: ${i.message}`)
    .join("; ")
}

export function makeCollectionRoute(cfg: ResourceConfig) {
  async function GET(req: Request) {
    const g = await gate(req, cfg.readScope)
    if (g instanceof Response) return g
    try {
      const url = new URL(req.url)
      const parsed = listQuerySchema.safeParse(Object.fromEntries(url.searchParams))
      if (!parsed.success) return ERRORS.invalidRequest(zodMessage(parsed.error))

      // Exact-match filters; repo whitelists per resource, so passing all is safe.
      const filters: Record<string, string> = {}
      for (const k of ["phone", "email", "contact_id", "company_id"] as const) {
        const v = parsed.data[k]
        if (typeof v === "string" && v !== "") filters[k] = v
      }

      const result = await repo.list(g.ctx.orgId, cfg.resource, {
        cursor: parsed.data.cursor,
        limit: parsed.data.limit,
        updatedSince: parsed.data.updated_since,
        filters,
      })
      return ok(result.data, {
        meta: { next_cursor: result.nextCursor, has_more: result.hasMore },
        headers: g.headers,
      })
    } catch (e) {
      return ERRORS.serverError((e as Error).message)
    }
  }

  async function POST(req: Request) {
    const g = await gate(req, cfg.writeScope)
    if (g instanceof Response) return g
    try {
      let body: Record<string, unknown>
      try {
        body = await parseBody(req)
      } catch {
        return ERRORS.invalidRequest("Request body must be valid JSON.")
      }
      const parsed = cfg.createSchema.safeParse(body)
      if (!parsed.success) return ERRORS.invalidRequest(zodMessage(parsed.error))

      let input = parsed.data as Record<string, unknown>
      if (cfg.prepareCreate) {
        try {
          input = await cfg.prepareCreate(g.ctx.orgId, input)
        } catch (e) {
          return ERRORS.invalidRequest((e as Error).message)
        }
      }
      const row = await repo.create(g.ctx.orgId, cfg.resource, input)
      // Best-effort side effect (e.g. new-lead notification). Never fail the write.
      if (cfg.afterCreate) {
        try {
          await cfg.afterCreate(g.ctx.orgId, row)
        } catch {
          /* swallowed — the resource was created successfully */
        }
      }
      return created(row, g.headers)
    } catch (e) {
      return ERRORS.serverError((e as Error).message)
    }
  }

  return { GET, POST }
}

export function makeItemRoute(cfg: ResourceConfig) {
  async function GET(req: Request, { params }: ItemCtx) {
    const g = await gate(req, cfg.readScope)
    if (g instanceof Response) return g
    try {
      const { id } = await params
      const row = await repo.get(g.ctx.orgId, cfg.resource, id)
      if (!row) return ERRORS.notFound()
      return ok(row, { headers: g.headers })
    } catch (e) {
      return ERRORS.serverError((e as Error).message)
    }
  }

  async function PATCH(req: Request, { params }: ItemCtx) {
    const g = await gate(req, cfg.writeScope)
    if (g instanceof Response) return g
    try {
      const { id } = await params
      let body: Record<string, unknown>
      try {
        body = await parseBody(req)
      } catch {
        return ERRORS.invalidRequest("Request body must be valid JSON.")
      }
      const parsed = cfg.updateSchema.safeParse(body)
      if (!parsed.success) return ERRORS.invalidRequest(zodMessage(parsed.error))

      const row = await repo.update(
        g.ctx.orgId,
        cfg.resource,
        id,
        parsed.data as Record<string, unknown>
      )
      if (!row) return ERRORS.notFound()
      return ok(row, { headers: g.headers })
    } catch (e) {
      return ERRORS.serverError((e as Error).message)
    }
  }

  async function DELETE(req: Request, { params }: ItemCtx) {
    const g = await gate(req, cfg.writeScope)
    if (g instanceof Response) return g
    try {
      const { id } = await params
      const removed = await repo.remove(g.ctx.orgId, cfg.resource, id)
      if (!removed) return ERRORS.notFound()
      return noContent(g.headers)
    } catch (e) {
      return ERRORS.serverError((e as Error).message)
    }
  }

  return { GET, PATCH, DELETE }
}
