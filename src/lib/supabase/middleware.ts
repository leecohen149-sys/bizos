import { NextResponse, type NextRequest } from "next/server"
import { createServerClient } from "@supabase/ssr"

import { publicEnv } from "@/lib/env"
import { safeRelativePath } from "@/lib/auth/safe-redirect"
import type { Database } from "./database.types"

/** Public routes that don't require an authenticated session. */
const PUBLIC_PATHS = [
  "/login",
  "/signup",
  "/forgot-password",
  "/auth", // /auth/callback, /auth/confirm
  "/developers", // public API documentation
]

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  )
}

/**
 * Refreshes the Supabase session on every navigation and guards protected
 * routes. Runs inside `proxy.ts` (Next.js 16 nodejs runtime).
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient<Database>(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: do not run code between createServerClient and getUser().
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  if (!user && !isPublicPath(pathname)) {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    url.searchParams.set("redirectedFrom", pathname)
    return NextResponse.redirect(url)
  }

  // Authenticated users shouldn't sit on auth screens. Honor a pending invite
  // (or other internal) target so a logged-in user who opens an invite link
  // still lands on it instead of bouncing to "/".
  if (user && (pathname === "/login" || pathname === "/signup")) {
    const url = request.nextUrl.clone()
    url.pathname = safeRelativePath(url.searchParams.get("redirectedFrom")) ?? "/"
    url.search = ""
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
