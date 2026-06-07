import Link from "next/link"
import { CheckSquare, Bell, TrendingUp, Activity } from "lucide-react"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { formatDate, formatTime, formatCurrency, isOverdue } from "@/lib/format"
import {
  TASK_STATUS_LABELS,
  type TaskStatus,
} from "@/lib/constants/domain"
import { getSessionUser, getActiveOrg } from "@/features/org/queries"
import { getDashboardData } from "@/features/dashboard/queries"

export const metadata = { title: "דשבורד" }

const STATUS_DOT: Record<TaskStatus, string> = {
  not_started: "bg-status-not-started",
  in_progress: "bg-status-in-progress",
  blocked: "bg-status-blocked",
  done: "bg-status-done",
}

export default async function DashboardPage() {
  const [user, org] = await Promise.all([getSessionUser(), getActiveOrg()])
  if (!user || !org) return null
  const data = await getDashboardData(org.id, user.id)

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">שלום 👋 {org.name}</h1>
        <p className="text-muted-foreground mt-1">תמונת המצב של העסק שלך.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* My tasks today */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CheckSquare className="text-muted-foreground size-4" />
              המשימות שלי להיום
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.myTasks.length === 0 ? (
              <Empty text="אין משימות לתאריך זה. כל הכבוד!" />
            ) : (
              <ul className="space-y-2">
                {data.myTasks.map((t) => (
                  <li key={t.id}>
                    <Link
                      href="/tasks"
                      className="hover:bg-accent flex items-center gap-2 rounded-md px-2 py-1.5 text-sm"
                    >
                      <span className={cn("size-2 rounded-full", STATUS_DOT[t.status])} />
                      <span className="flex-1 truncate">{t.title}</span>
                      {t.due_date && (
                        <span
                          className={cn(
                            "text-xs",
                            isOverdue(t.due_date) ? "text-status-blocked" : "text-muted-foreground"
                          )}
                        >
                          {formatDate(t.due_date)}
                        </span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Upcoming reminders */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Bell className="text-muted-foreground size-4" />
              תזכורות קרובות
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.reminders.length === 0 ? (
              <Empty text="אין תזכורות מתוזמנות." />
            ) : (
              <ul className="space-y-2">
                {data.reminders.map((r) => (
                  <li key={r.id} className="flex items-center gap-2 px-2 py-1 text-sm">
                    <Bell className="text-primary size-3.5" />
                    <span className="flex-1 truncate">{r.message || r.title}</span>
                    <span className="text-muted-foreground text-xs">
                      {formatDate(r.remind_at)} {formatTime(r.remind_at)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Open deals by stage */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-base">
              <span className="flex items-center gap-2">
                <TrendingUp className="text-muted-foreground size-4" />
                עסקאות פתוחות לפי שלב
              </span>
              <span className="text-muted-foreground text-sm font-normal">
                {formatCurrency(data.openDealsTotal)}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.dealsByStage.every((s) => s.count === 0) ? (
              <Empty text="אין עסקאות פתוחות ב‑CRM." />
            ) : (
              <ul className="space-y-2">
                {data.dealsByStage.map((s) => (
                  <li key={s.stage} className="flex items-center gap-2 text-sm">
                    <span className="w-28 shrink-0 truncate">{s.stage}</span>
                    <div className="bg-muted h-2 flex-1 overflow-hidden rounded-full">
                      <div
                        className="bg-primary h-full rounded-full"
                        style={{
                          width: `${data.openDealsTotal ? (s.value / data.openDealsTotal) * 100 : 0}%`,
                        }}
                      />
                    </div>
                    <span className="text-muted-foreground w-10 text-end text-xs">{s.count}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Recent activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="text-muted-foreground size-4" />
              פעילות אחרונה
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.recentTasks.length === 0 ? (
              <Empty text="אין פעילות אחרונה." />
            ) : (
              <ul className="space-y-2">
                {data.recentTasks.map((t) => (
                  <li key={t.id} className="flex items-center gap-2 px-2 py-1 text-sm">
                    <span className={cn("size-2 rounded-full", STATUS_DOT[t.status])} />
                    <span className="flex-1 truncate">{t.title}</span>
                    <span className="text-muted-foreground text-xs">
                      {TASK_STATUS_LABELS[t.status]}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function Empty({ text }: { text: string }) {
  return <p className="text-muted-foreground py-4 text-center text-sm">{text}</p>
}
