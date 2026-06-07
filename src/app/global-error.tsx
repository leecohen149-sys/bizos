"use client"

import { useEffect } from "react"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Global error boundary:", error)
  }, [error])

  return (
    <html lang="he" dir="rtl">
      <body
        style={{
          display: "flex",
          minHeight: "100dvh",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1rem",
          fontFamily: "system-ui, sans-serif",
          padding: "1.5rem",
          textAlign: "center",
        }}
      >
        <h1 style={{ fontSize: "1.25rem", fontWeight: 600 }}>אירעה שגיאה</h1>
        <p style={{ color: "#666", maxWidth: "24rem", fontSize: "0.875rem" }}>
          משהו השתבש בטעינת האפליקציה. נסו לרענן את הדף.
        </p>
        <pre style={{ direction: "ltr", fontSize: "0.75rem", color: "#999", maxWidth: "28rem", overflow: "auto" }}>
          {error.message}
          {error.digest ? `\ndigest: ${error.digest}` : ""}
        </pre>
        <button
          onClick={reset}
          style={{
            background: "#5b53d6",
            color: "white",
            border: "none",
            borderRadius: "0.5rem",
            padding: "0.5rem 1rem",
            cursor: "pointer",
          }}
        >
          רענון
        </button>
      </body>
    </html>
  )
}
