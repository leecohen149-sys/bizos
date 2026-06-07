import {
  CheckSquare,
  Bell,
  TrendingUp,
  Activity,
  Sparkles,
} from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { getActiveOrg } from "@/features/org/queries"

export const metadata = { title: "דשבורד" }

const WIDGETS = [
  {
    title: "המשימות שלי להיום",
    description: "אין משימות לתאריך זה.",
    icon: CheckSquare,
  },
  {
    title: "תזכורות קרובות",
    description: "אין תזכורות מתוזמנות.",
    icon: Bell,
  },
  {
    title: "עסקאות פתוחות לפי שלב",
    description: "טרם נוספו עסקאות ל‑CRM.",
    icon: TrendingUp,
  },
  {
    title: "פעילות אחרונה",
    description: "כאן תופיע הפעילות האחרונה של הצוות.",
    icon: Activity,
  },
]

export default async function DashboardPage() {
  const org = await getActiveOrg()

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          שלום 👋 {org?.name}
        </h1>
        <p className="text-muted-foreground mt-1">
          זו תמונת המצב של העסק שלך. ככל שתוסיפו משימות ולקוחות, הדשבורד יתמלא.
        </p>
      </div>

      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="flex items-start gap-3 py-5">
          <Sparkles className="text-primary mt-0.5 size-5 shrink-0" />
          <div className="text-sm">
            <p className="font-medium">המערכת מוכנה לעבודה</p>
            <p className="text-muted-foreground mt-0.5">
              ניהול המשימות והפרויקטים ייפתח בשלב הבא. בינתיים אפשר להזמין עוד
              חברי צוות ולהגדיר את העסק.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        {WIDGETS.map((w) => {
          const Icon = w.icon
          return (
            <Card key={w.title}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Icon className="text-muted-foreground size-4" />
                  {w.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>{w.description}</CardDescription>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
