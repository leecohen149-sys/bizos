import { NotificationsList } from "@/features/notifications/components/notifications-list"
import { PushSetup } from "@/features/notifications/components/push-setup"
import {
  LeadRecipients,
  type LeadRecipientMember,
} from "@/features/notifications/components/lead-recipients"
import { getActiveOrg, getOrgMembers } from "@/features/org/queries"
import { ADMIN_ROLES } from "@/lib/constants/domain"
import { createClient } from "@/lib/supabase/server"

export const metadata = { title: "התראות" }

async function getLeadRecipientsConfig() {
  const org = await getActiveOrg()
  if (!org || !ADMIN_ROLES.includes(org.role)) return null

  const supabase = await createClient()
  const [{ data: orgRow }, members] = await Promise.all([
    supabase.from("organizations").select("settings").eq("id", org.id).maybeSingle(),
    getOrgMembers(org.id),
  ])

  const settings = (orgRow?.settings ?? {}) as { lead_notify_user_ids?: string[] }
  const recipientMembers: LeadRecipientMember[] = members.map((m) => ({
    user_id: m.user_id,
    full_name: m.full_name,
    is_owner: m.role === "owner",
  }))

  return {
    members: recipientMembers,
    initialSelected: settings.lead_notify_user_ids ?? null,
  }
}

export default async function NotificationsPage() {
  const leadConfig = await getLeadRecipientsConfig()

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">התראות</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          עדכונים על המשימות שלך, ותזכורות.
        </p>
      </div>
      <PushSetup />
      {leadConfig && (
        <LeadRecipients
          members={leadConfig.members}
          initialSelected={leadConfig.initialSelected}
        />
      )}
      <NotificationsList />
    </div>
  )
}
