import { redirect } from "next/navigation"

import { createClient } from "@/lib/supabase/server"
import { getSessionUser, getActiveOrg } from "@/features/org/queries"
import { ORG_ROLE_LABELS } from "@/lib/constants/domain"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export const metadata = { title: "הגדרות כלליות" }

function Field({ label, value, dir }: { label: string; value: string; dir?: "ltr" | "rtl" }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <span className="text-muted-foreground text-sm">{label}</span>
      <span className="truncate text-sm font-medium" dir={dir}>
        {value}
      </span>
    </div>
  )
}

export default async function SettingsGeneralPage() {
  const user = await getSessionUser()
  if (!user) redirect("/login")
  const org = await getActiveOrg()
  if (!org) redirect("/onboarding")

  const supabase = await createClient()
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .maybeSingle()

  const fullName = (profile?.full_name as string | null) ?? "—"

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>פרטי העסק</CardTitle>
          <CardDescription>פרטי הארגון הפעיל והתפקיד שלך בו.</CardDescription>
        </CardHeader>
        <CardContent className="divide-y">
          <Field label="שם העסק" value={org.name} />
          <Field label="מזהה (slug)" value={org.slug} dir="ltr" />
          <Field label="התפקיד שלך" value={ORG_ROLE_LABELS[org.role]} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>הפרופיל שלי</CardTitle>
          <CardDescription>פרטי המשתמש שלך.</CardDescription>
        </CardHeader>
        <CardContent className="divide-y">
          <Field label="שם מלא" value={fullName} />
          <Field label="אימייל" value={user.email ?? "—"} dir="ltr" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            עריכה והעדפות
            <Badge variant="secondary" className="text-[10px]">
              בקרוב
            </Badge>
          </CardTitle>
          <CardDescription>
            עריכת שם העסק והפרופיל, העדפות התראות ושפה — יתווספו בקרוב.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  )
}
