"use client"

import { CalendarDays, GitBranch } from "lucide-react"

import { cn } from "@/lib/utils"
import { formatDate, isOverdue } from "@/lib/format"
import type { TaskWithRelations } from "@/lib/types"
import { PriorityFlag } from "./status-badge"
import { AssigneeAvatar } from "./assignee-picker"

export function TaskCardContent({
  task,
  progress,
}: {
  task: TaskWithRelations
  progress?: { total: number; done: number }
}) {
  const done = task.status === "done"
  return (
    <div className="space-y-2">
      <p className={cn("text-sm leading-snug", done && "text-muted-foreground line-through")}>
        {task.title}
      </p>

      {task.labels.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {task.labels.map((l) => (
            <span
              key={l.id}
              className="rounded-full px-1.5 py-0.5 text-[10px] font-medium text-white"
              style={{ backgroundColor: l.color }}
            >
              {l.name}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <PriorityFlag priority={task.priority} />
          {progress && progress.total > 0 && (
            <span className="text-muted-foreground flex items-center gap-0.5 text-xs">
              <GitBranch className="size-3" />
              {progress.done}/{progress.total}
            </span>
          )}
          {task.due_date && (
            <span
              className={cn(
                "flex items-center gap-0.5 text-xs",
                isOverdue(task.due_date) && !done
                  ? "text-status-blocked"
                  : "text-muted-foreground"
              )}
            >
              <CalendarDays className="size-3" />
              {formatDate(task.due_date)}
            </span>
          )}
        </div>
        <AssigneeAvatar member={task.assignee} size="xs" />
      </div>
    </div>
  )
}
