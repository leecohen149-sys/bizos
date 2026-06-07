import type { Database } from "@/lib/supabase/database.types"

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"]
export type Insert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"]
export type Update<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"]
export type Enums<T extends keyof Database["public"]["Enums"]> =
  Database["public"]["Enums"][T]

export type Task = Tables<"tasks">
export type Project = Tables<"projects">
export type Profile = Tables<"profiles">
export type Label = Tables<"labels">
export type TaskComment = Tables<"task_comments">
export type TaskDependency = Tables<"task_dependencies">
export type Notification = Tables<"notifications">
export type Reminder = Tables<"reminders">

export type CrmCompany = Tables<"crm_companies">
export type CrmContact = Tables<"crm_contacts">
export type CrmPipeline = Tables<"crm_pipelines">
export type CrmStage = Tables<"crm_stages">
export type CrmDeal = Tables<"crm_deals">
export type CrmActivity = Tables<"crm_activities">

/** A task enriched with the joined data the UI needs. */
export type TaskWithRelations = Task & {
  assignee: Pick<Profile, "id" | "full_name" | "avatar_url"> | null
  project: Pick<Project, "id" | "name" | "color"> | null
  labels: Pick<Label, "id" | "name" | "color">[]
}

/** A member of the active org, for assignee pickers. */
export type OrgMember = {
  user_id: string
  full_name: string | null
  avatar_url: string | null
  role: Enums<"org_role">
}
