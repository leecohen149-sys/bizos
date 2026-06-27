import { gate } from "@/lib/api/resource-handler"
import { repo } from "@/lib/api/repo"
import { ok, ERRORS } from "@/lib/api/response"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * GET /api/v1/stages — read-only list of the org's pipeline stages.
 *
 * Stages aren't a generic CRUD resource (reference data, no write surface), so
 * this is a dedicated handler rather than a registry entry. It reuses the
 * `deals:read` scope (stages belong to the deals/pipeline domain) so existing
 * keys keep working. Lets automations resolve a `stage_id` by name/position
 * before POSTing a deal (see /api/v1/deals).
 */
export async function GET(req: Request) {
  const g = await gate(req, "deals:read")
  if (g instanceof Response) return g
  try {
    const rows = await repo.listStages(g.ctx.orgId)
    return ok(rows, { headers: g.headers })
  } catch (e) {
    return ERRORS.serverError((e as Error).message)
  }
}
