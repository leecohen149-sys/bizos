import { CrmView } from "@/features/crm/components/crm-view"

export const metadata = { title: "לקוחות (CRM)" }

export default function CrmPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">לקוחות</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          נהלו עסקאות, אנשי קשר וחברות במקום אחד.
        </p>
      </div>
      <CrmView />
    </div>
  )
}
