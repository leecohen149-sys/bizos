"use client"

import * as React from "react"
import { CheckCircle2 } from "lucide-react"
import { useVirtualizer } from "@tanstack/react-virtual"

import { Skeleton } from "@/components/ui/skeleton"
import type { TaskScope } from "@/features/tasks/api"
import { subtaskProgress } from "@/features/tasks/api"
import type { TaskWithRelations } from "@/lib/types"
import { TaskRow } from "./task-row"
import { QuickAddTask } from "./quick-add-task"
import type { NewTask } from "@/features/tasks/hooks"

type Defaults = Partial<NewTask>

type RenderItem = { task: TaskWithRelations; indent: boolean }

/** Flatten the parent→children tree into an ordered render list. */
function buildRenderList(tasks: TaskWithRelations[]): RenderItem[] {
  const items: RenderItem[] = []
  for (const task of tasks.filter((t) => !t.parent_task_id)) {
    items.push({ task, indent: false })
    for (const child of tasks.filter((t) => t.parent_task_id === task.id)) {
      items.push({ task: child, indent: true })
    }
  }
  return items
}

const VIRTUALIZE_THRESHOLD = 40

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
  const items = buildRenderList(tasks)

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-full" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-1">
      {items.length === 0 ? (
        <div className="text-muted-foreground flex flex-col items-center gap-2 py-12 text-center text-sm">
          <CheckCircle2 className="size-8 opacity-50" />
          אין משימות תואמות. הוסיפו אחת למטה.
        </div>
      ) : items.length > VIRTUALIZE_THRESHOLD ? (
        <VirtualList items={items} tasks={tasks} scope={scope} onOpen={onOpen} />
      ) : (
        items.map(({ task, indent }) => (
          <TaskRow
            key={task.id}
            task={task}
            scope={scope}
            onOpen={onOpen}
            indent={indent}
            subtaskProgress={indent ? undefined : subtaskProgress(tasks, task.id)}
          />
        ))
      )}

      <div className="border-border/60 mt-2 border-t pt-2">
        <QuickAddTask scope={scope} defaults={quickAddDefaults} />
      </div>
    </div>
  )
}

function VirtualList({
  items,
  tasks,
  scope,
  onOpen,
}: {
  items: RenderItem[]
  tasks: TaskWithRelations[]
  scope: TaskScope
  onOpen?: (t: TaskWithRelations) => void
}) {
  const parentRef = React.useRef<HTMLDivElement>(null)
  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 40,
    overscan: 8,
  })

  return (
    <div ref={parentRef} className="max-h-[70vh] overflow-auto">
      <div style={{ height: virtualizer.getTotalSize(), position: "relative" }}>
        {virtualizer.getVirtualItems().map((row) => {
          const { task, indent } = items[row.index]
          return (
            <div
              key={task.id}
              ref={virtualizer.measureElement}
              data-index={row.index}
              style={{
                position: "absolute",
                top: 0,
                insetInlineStart: 0,
                width: "100%",
                transform: `translateY(${row.start}px)`,
              }}
            >
              <TaskRow
                task={task}
                scope={scope}
                onOpen={onOpen}
                indent={indent}
                subtaskProgress={indent ? undefined : subtaskProgress(tasks, task.id)}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
