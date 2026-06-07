import { MembersView } from "@/features/org/components/members-view"

export const metadata = { title: "חברי צוות" }

export default function MembersPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">חברי צוות</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          נהלו את הצוות, התפקידים וההזמנות לעסק.
        </p>
      </div>
      <MembersView />
    </div>
  )
}
