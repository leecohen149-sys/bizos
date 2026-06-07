"use client"

import { useOrg } from "@/features/org/org-context"
import { TasksView } from "./tasks-view"

export function MyTasks() {
  const { currentUserId } = useOrg()
  return (
    <TasksView
      scope={{ kind: "assignee", userId: currentUserId }}
      quickAddDefaults={{ assignee_id: currentUserId }}
    />
  )
}
