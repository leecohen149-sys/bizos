import { redirect } from "next/navigation"

import { getActiveOrg } from "@/features/org/queries"
import { ADMIN_ROLES } from "@/lib/constants/domain"
import { MembersView } from "@/features/org/components/members-view"

export const metadata = { title: "חברי צוות" }

export default async function SettingsMembersPage() {
  const org = await getActiveOrg()
  if (!org) redirect("/onboarding")
  if (!ADMIN_ROLES.includes(org.role)) redirect("/settings")

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">חברי צוות</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          נהלו את הצוות, התפקידים וההזמנות לעסק.
        </p>
      </div>
      <MembersView />
    </div>
  )
}
