import withSerwistInit from "@serwist/next"
import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  // Serwist injects a webpack config (used by `build --webpack`). The dev
  // server runs on Turbopack, which errors on a bare webpack config — an
  // empty turbopack config silences that and keeps dev on Turbopack.
  turbopack: {},
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ]
  },
}

/**
 * Serwist compiles the service worker via webpack. Next.js 16 builds with
 * Turbopack by default and rejects a webpack config, so `build` runs with
 * `--webpack` (see package.json). The SW is disabled in dev to keep the
 * Turbopack dev server clean.
 */
const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  // Don't let the SW serve a cached HTML shell for online navigations: a stale
  // shell carries old Server Action IDs and triggers "Server action not found"
  // 404s after a deploy (version skew). Online users get the fresh document;
  // the `/~offline` fallback in sw.ts still covers true-offline navigation.
  cacheOnNavigation: false,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === "development",
})

export default withSerwist(nextConfig)
