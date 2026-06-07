"use client"

import { CheckCircle2 } from "lucide-react"

import { Skeleton } from "@/components/ui/skeleton"
import type { TaskScope } from "@/features/tasks/api"
import { subtaskProgress } from "@/features/tasks/api"
import type { TaskWithRelations } from "@/lib/types"
import { TaskRow } from "./task-row"
import { QuickAddTask } from "./quick-add-task"
import type { NewTask } from "@/features/tasks/hooks"

type Defaults = Partial<NewTask>

export function TaskListView({
  tasks,
  scope,
  isLoading,
  onOpen,
  quickAddDefaults,
}: {
  tasks: TaskWithRelations[]
  scope: TaskScope
  isLoading?: boolean
  onOpen?: (task: TaskWithRelations) => void
  quickAddDefaults?: Defaults
}) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-full" />
        ))}
      </div>
    )
  }

  const topLevel = tasks.filter((t) => !t.parent_task_id)

  return (
    <div className="space-y-1">
      {topLevel.length === 0 && (
        <div className="text-muted-foreground flex flex-col items-center gap-2 py-12 text-center text-sm">
          <CheckCircle2 className="size-8 opacity-50" />
          אין משימות עדיין. הוסיפו את הראשונה למטה.
        </div>
      )}

      {topLevel.map((task) => {
        const children = tasks.filter((t) => t.parent_task_id === task.id)
        return (
          <div key={task.id}>
            <TaskRow
              task={task}
              scope={scope}
              onOpen={onOpen}
              subtaskProgress={subtaskProgress(tasks, task.id)}
            />
            {children.map((child) => (
              <TaskRow
                key={child.id}
                task={child}
                scope={scope}
                onOpen={onOpen}
                indent
              />
            ))}
          </div>
        )
      })}

      <div className="border-border/60 mt-2 border-t pt-2">
        <QuickAddTask scope={scope} defaults={quickAddDefaults} />
      </div>
    </div>
  )
}
