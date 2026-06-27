"use client"

import { toast } from "sonner"

/**
 * Next.js Server Actions are addressed by a build-time hash sent in the
 * `next-action` header. Every deploy regenerates those hashes, so a page that
 * was rendered by an older build (an open tab, or a stale PWA shell) calls an
 * action ID the new server no longer knows → the action fetch fails with a
 * "Server action not found" 404 ("version skew").
 *
 * Vercel Skew Protection solves this transparently, but it's a Pro-plan feature
 * and this project is on Hobby. `withSkewRecovery` is the code-only mitigation:
 * it catches the transport-level failure and does a one-time hard reload so the
 * browser picks up the new build, after which the action works.
 */

const RELOAD_TS_KEY = "bizos:skew-reloaded"
// Don't reload again within this window — guards against reload loops if the
// failure persists after a refresh (e.g. a genuine server error misdetected).
const RELOAD_GUARD_MS = 15_000

function isServerActionSkewError(err: unknown): boolean {
  if (!(err instanceof Error)) return false
  const msg = err.message.toLowerCase()
  return (
    msg.includes("failed to find server action") ||
    (msg.includes("server action") && msg.includes("deployment")) ||
    msg.includes("unexpected response") // minified prod transport failure
  )
}

function recentlyReloaded(): boolean {
  try {
    const prev = sessionStorage.getItem(RELOAD_TS_KEY)
    return prev != null && Date.now() - Number(prev) < RELOAD_GUARD_MS
  } catch {
    return false
  }
}

/**
 * Wrap any Server Action call. On a version-skew failure it hard-reloads once
 * (returning a never-resolving promise so the caller's success path never runs
 * before the reload). Any other error is rethrown unchanged.
 */
export async function withSkewRecovery<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn()
  } catch (err) {
    if (isServerActionSkewError(err)) {
      if (!recentlyReloaded()) {
        try {
          sessionStorage.setItem(RELOAD_TS_KEY, String(Date.now()))
        } catch {
          // sessionStorage unavailable — reload anyway, worst case is a re-loop
          // that the user can escape by closing the tab.
        }
        toast.message("גרסה חדשה זמינה, מרעננים…")
        window.location.reload()
        // Never resolve: the page is being replaced.
        return new Promise<T>(() => {})
      }
      toast.error("צריך לרענן את הדף כדי להמשיך")
    }
    throw err
  }
}
