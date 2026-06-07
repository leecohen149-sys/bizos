import { WifiOff } from "lucide-react"

export const metadata = { title: "לא מחובר" }

export default function OfflinePage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
      <WifiOff className="text-muted-foreground size-12" />
      <div>
        <h1 className="text-xl font-semibold">אין חיבור לאינטרנט</h1>
        <p className="text-muted-foreground mt-1 max-w-sm text-sm">
          נראה שאתם במצב לא‑מקוון. חלק מהמסכים שכבר נטענו זמינים, אך פעולות
          חדשות ידרשו חיבור. נסו שוב כשהחיבור יחזור.
        </p>
      </div>
    </div>
  )
}
