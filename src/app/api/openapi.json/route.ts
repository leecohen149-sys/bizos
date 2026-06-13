import { NextResponse } from "next/server"

import { getApiConfig } from "@/lib/env"
import { buildOpenApiDocument } from "@/lib/api/openapi"

export const runtime = "nodejs"

/**
 * Public OpenAPI 3.1 spec. Importable directly into n8n / Make / Postman.
 * No auth — the spec documents the surface; calling it still needs a key.
 */
export function GET() {
  const { appUrl } = getApiConfig()
  return NextResponse.json(buildOpenApiDocument(appUrl), {
    headers: { "Cache-Control": "public, max-age=300" },
  })
}
