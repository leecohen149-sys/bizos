import type { NextRequest } from "next/server"

import { updateSession } from "@/lib/supabase/middleware"

// Next.js 16 renamed `middleware` to `proxy` (nodejs runtime, no edge).
export async function proxy(request: NextRequest) {
  return updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for static assets and the service worker:
     * - _next/static, _next/image
     * - favicon, icons, manifest, sw.js, offline page assets
     * - common image/font extensions
     */
    // Public/automation API routes authenticate via API key or shared secret
    // (not cookies), so the Supabase session proxy is skipped for them:
    // - api/v1/*            public REST surface (Bearer API key)
    // - api/openapi.json    public spec (no auth)
    // - api/webhooks/*      internal dispatch (x-webhook-secret)
    // - api/cron/*          schedulers (Bearer CRON_SECRET)
    "/((?!_next/static|_next/image|api/v1|api/openapi.json|api/webhooks|api/cron|favicon.ico|manifest.webmanifest|sw.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?)$).*)",
  ],
}
