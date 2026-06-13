/**
 * Shared domain enums + Hebrew labels + design-token class mappings.
 * Keep in sync with the DB enums defined in supabase/migrations.
 */

export const TASK_STATUSES = [
  "not_started",
  "in_progress",
  "blocked",
  "done",
] as const
export type TaskStatus = (typeof TASK_STATUSES)[number]

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  not_started: "לא התחיל",
  in_progress: "בתהליך",
  blocked: "תקוע",
  done: "הושלם",
}

/** Tailwind classes (backed by the status palette tokens in globals.css). */
export const TASK_STATUS_CLASSES: Record<TaskStatus, string> = {
  not_started:
    "bg-status-not-started text-status-not-started-foreground",
  in_progress:
    "bg-status-in-progress text-status-in-progress-foreground",
  blocked: "bg-status-blocked text-status-blocked-foreground",
  done: "bg-status-done text-status-done-foreground",
}

export const TASK_PRIORITIES = ["low", "medium", "high", "urgent"] as const
export type TaskPriority = (typeof TASK_PRIORITIES)[number]

export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: "נמוכה",
  medium: "בינונית",
  high: "גבוהה",
  urgent: "דחופה",
}

export const TASK_PRIORITY_CLASSES: Record<TaskPriority, string> = {
  low: "bg-priority-low text-white",
  medium: "bg-priority-medium text-white",
  high: "bg-priority-high text-white",
  urgent: "bg-priority-urgent text-white",
}

export const ORG_ROLES = [
  "owner",
  "admin",
  "manager",
  "member",
  "guest",
] as const
export type OrgRole = (typeof ORG_ROLES)[number]

export const ORG_ROLE_LABELS: Record<OrgRole, string> = {
  owner: "בעלים",
  admin: "מנהל מערכת",
  manager: "מנהל",
  member: "חבר צוות",
  guest: "אורח",
}

/** Roles allowed to manage members / org settings. */
export const ADMIN_ROLES: OrgRole[] = ["owner", "admin"]
/** Roles allowed to create/manage projects, tasks and CRM. */
export const MANAGER_ROLES: OrgRole[] = ["owner", "admin", "manager"]

export const PROJECT_STATUSES = [
  "active",
  "on_hold",
  "completed",
  "archived",
] as const
export type ProjectStatus = (typeof PROJECT_STATUSES)[number]

export const DEAL_STATUSES = ["open", "won", "lost"] as const
export type DealStatus = (typeof DEAL_STATUSES)[number]

/** Color palette for customizable deal pipeline stages (hex, stored on crm_stages.color). */
export const STAGE_COLORS = [
  "#6366f1",
  "#0ea5e9",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#ec4899",
  "#8b5cf6",
  "#14b8a6",
  "#64748b",
] as const
export const DEFAULT_STAGE_COLOR = STAGE_COLORS[0]

export const DEFAULT_LOCALE = "he"
export const DEFAULT_CURRENCY = "ILS"
