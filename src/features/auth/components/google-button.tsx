"use client"

import { useTransition } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { isGoogleOAuthEnabled } from "@/lib/env"
import { signInWithGoogleAction } from "@/features/auth/actions"

/** Renders only when Google OAuth is enabled via env. Infra is always present. */
export function GoogleButton() {
  const [isPending, startTransition] = useTransition()
  if (!isGoogleOAuthEnabled) return null

  return (
    <Button
      type="button"
      variant="outline"
      className="w-full"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          const res = await signInWithGoogleAction()
          if (res && "error" in res) toast.error(res.error)
        })
      }
    >
      <svg className="size-4" viewBox="0 0 24 24" aria-hidden>
        <path
          fill="currentColor"
          d="M12 11v2.8h3.9c-.2 1-1.5 3-3.9 3-2.4 0-4.3-2-4.3-4.4S9.6 8 12 8c1.3 0 2.2.6 2.7 1l1.9-1.8C15.4 6 13.9 5.3 12 5.3 8.1 5.3 5 8.4 5 12.4s3.1 7.1 7 7.1c4 0 6.7-2.8 6.7-6.8 0-.5 0-.8-.1-1.2H12z"
        />
      </svg>
      המשך עם Google
    </Button>
  )
}
