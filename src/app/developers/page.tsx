import Script from "next/script"

export const metadata = {
  title: "BizOS — API למפתחים",
  description: "תיעוד ה-API הציבורי של BizOS לאוטומציות n8n / Make / Zapier.",
}

/**
 * Interactive API reference (Scalar) pointing at /api/openapi.json.
 * Loaded from the Scalar CDN so it adds zero bundler/webpack surface.
 */
export default function DevelopersPage() {
  return (
    <>
      {/* Scalar reads the spec URL from this element's data-url. */}
      <script
        id="api-reference"
        data-url="/api/openapi.json"
        data-configuration='{"theme":"default","layout":"modern"}'
      />
      <Script
        src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"
        strategy="afterInteractive"
      />
    </>
  )
}
