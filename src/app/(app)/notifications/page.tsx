import { NotificationsList } from "@/features/notifications/components/notifications-list"
import { PushSetup } from "@/features/notifications/components/push-setup"

export const metadata = { title: "התראות" }

export default function NotificationsPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">התראות</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          עדכונים על המשימות שלך, ותזכורות.
        </p>
      </div>
      <PushSetup />
      <NotificationsList />
    </div>
  )
}
