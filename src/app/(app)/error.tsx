"use client"

import { useEffect, useState } from "react"
import { AlertTriangle, RefreshCw } from "lucide-react"

import { Button } from "@/components/ui/button"

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const [showDetail, setShowDetail] = useState(false)

  useEffect(() => {
    console.error("App error boundary:", error)
  }, [error])

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <AlertTriangle className="text-status-blocked size-12" />
      <div>
        <h1 className="text-xl font-semibold">משהו השתבש</h1>
        <p className="text-muted-foreground mt-1 max-w-sm text-sm">
          אירעה שגיאה בטעינת המסך. נסו לרענן — אם זה חוזר, יש כאן פרטים טכניים.
        </p>
      </div>
      <div className="flex gap-2">
        <Button onClick={reset} className="gap-1.5">
          <RefreshCw className="size-4" />
          נסה שוב
        </Button>
        <Button variant="outline" onClick={() => setShowDetail((s) => !s)}>
          פרטים טכניים
        </Button>
      </div>
      {showDetail && (
        <pre className="bg-muted max-w-md overflow-auto rounded-md p-3 text-start text-xs" dir="ltr">
          {error.message || "Unknown error"}
          {error.digest ? `\n\ndigest: ${error.digest}` : ""}
        </pre>
      )}
    </div>
  )
}
