import "server-only"

import { createClient } from "@/lib/supabase/server"
import type { TaskStatus } from "@/lib/constants/domain"

export type DashboardData = {
  myTasks: {
    id: string
    title: string
    status: TaskStatus
    due_date: string | null
    project_id: string | null
  }[]
  reminders: { id: string; remind_at: string; message: string | null; title: string }[]
  dealsByStage: { stage: string; count: number; value: number }[]
  openDealsTotal: number
  recentTasks: { id: string; title: string; status: TaskStatus; updated_at: string }[]
}

export async function getDashboardData(
  orgId: string,
  userId: string
): Promise<DashboardData> {
  const supabase = await createClient()
  const today = new Date().toISOString().slice(0, 10)

  const [myTasks, reminders, stages, deals, recentTasks] = await Promise.all([
    supabase
      .from("tasks")
      .select("id, title, status, due_date, project_id")
      .eq("org_id", orgId)
      .eq("assignee_id", userId)
      .neq("status", "done")
      .not("due_date", "is", null)
      .lte("due_date", today)
      .order("due_date")
      .limit(8),
    supabase
      .from("reminders")
      .select("id, remind_at, message, tasks(title)")
      .eq("org_id", orgId)
      .eq("user_id", userId)
      .eq("status", "pending")
      .gte("remind_at", new Date().toISOString())
      .order("remind_at")
      .limit(5),
    supabase.from("crm_stages").select("id, name, position").eq("org_id", orgId).order("position"),
    supabase
      .from("crm_deals")
      .select("stage_id, value")
      .eq("org_id", orgId)
      .eq("status", "open"),
    supabase
      .from("tasks")
      .select("id, title, status, updated_at")
      .eq("org_id", orgId)
      .order("updated_at", { ascending: false })
      .limit(6),
  ])

  const dealRows = deals.data ?? []
  const dealsByStage = (stages.data ?? []).map((s) => {
    const rows = dealRows.filter((d) => d.stage_id === s.id)
    return {
      stage: s.name as string,
      count: rows.length,
      value: rows.reduce((sum, d) => sum + (d.value ?? 0), 0),
    }
  })
  const openDealsTotal = dealRows.reduce((sum, d) => sum + (d.value ?? 0), 0)

  return {
    myTasks: (myTasks.data ?? []) as DashboardData["myTasks"],
    reminders: (reminders.data ?? []).map((r) => ({
      id: r.id as string,
      remind_at: r.remind_at as string,
      message: (r.message as string | null) ?? null,
      title: (r.tasks as unknown as { title: string } | null)?.title ?? "תזכורת",
    })),
    dealsByStage,
    openDealsTotal,
    recentTasks: (recentTasks.data ?? []) as DashboardData["recentTasks"],
  }
}
