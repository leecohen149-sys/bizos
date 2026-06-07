"use client"

import { TasksView } from "./tasks-view"

export function ProjectTasks({ projectId }: { projectId: string }) {
  return (
    <TasksView
      scope={{ kind: "project", projectId }}
      quickAddDefaults={{ project_id: projectId }}
      defaultView="board"
    />
  )
}

export function InboxTasks() {
  return <TasksView scope={{ kind: "inbox" }} quickAddDefaults={{ project_id: null }} />
}
