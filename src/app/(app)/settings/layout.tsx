import { SettingsNav } from "@/features/settings/settings-nav"

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">הגדרות</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          נהלו את העסק, הצוות והאינטגרציות שלכם.
        </p>
      </div>
      <SettingsNav />
      {children}
    </div>
  )
}
