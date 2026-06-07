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
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?)$).*)",
  ],
}
