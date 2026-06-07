import Link from "next/link"
import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { AlertCircle } from "lucide-react"

import { Logo } from "@/components/brand/logo"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/server"
import { getSessionUser, ACTIVE_ORG_COOKIE } from "@/features/org/queries"

export const metadata = { title: "הצטרפות לעסק" }

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const user = await getSessionUser()
  if (!user) redirect(`/login?redirectedFrom=/invite/${token}`)

  const supabase = await createClient()
  const { data: orgId, error } = await supabase.rpc("accept_invitation", {
    _token: token,
  })

  if (error || !orgId) {
    return (
      <Shell>
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
            <AlertCircle className="text-status-blocked size-10" />
            <p className="font-medium">ההזמנה אינה תקפה</p>
            <p className="text-muted-foreground text-sm">
              ייתכן שפג תוקפה או שכבר נוצלה.
            </p>
            <Button asChild variant="outline">
              <Link href="/">למערכת</Link>
            </Button>
          </CardContent>
        </Card>
      </Shell>
    )
  }

  const cookieStore = await cookies()
  cookieStore.set(ACTIVE_ORG_COOKIE, orgId as string, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  })
  redirect("/")
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm space-y-8">
        <div className="flex justify-center">
          <Logo />
        </div>
        {children}
      </div>
    </div>
  )
}
