"use client"

import { useState } from "react"
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  useDroppable,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

import { cn } from "@/lib/utils"
import {
  TASK_STATUSES,
  TASK_STATUS_LABELS,
  type TaskStatus,
} from "@/lib/constants/domain"
import { subtaskProgress } from "@/features/tasks/api"
import type { TaskScope } from "@/features/tasks/api"
import { useUpdateTask } from "@/features/tasks/hooks"
import type { TaskWithRelations } from "@/lib/types"
import type { NewTask } from "@/features/tasks/hooks"
import { TaskCardContent } from "./task-card"
import { QuickAddTask } from "./quick-add-task"

const STATUS_ACCENT: Record<TaskStatus, string> = {
  not_started: "bg-status-not-started",
  in_progress: "bg-status-in-progress",
  blocked: "bg-status-blocked",
  done: "bg-status-done",
}

function SortableCard({
  task,
  allTasks,
  onOpen,
}: {
  task: TaskWithRelations
  allTasks: TaskWithRelations[]
  onOpen?: (t: TaskWithRelations) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: task.id, data: { status: task.status } })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn(
        "bg-card hover:border-primary/40 cursor-grab rounded-lg border p-3 shadow-sm active:cursor-grabbing",
        isDragging && "opacity-40"
      )}
      {...attributes}
      {...listeners}
      onClick={() => onOpen?.(task)}
    >
      <TaskCardContent task={task} progress={subtaskProgress(allTasks, task.id)} />
    </div>
  )
}

function Column({
  status,
  tasks,
  allTasks,
  scope,
  onOpen,
  quickAddDefaults,
}: {
  status: TaskStatus
  tasks: TaskWithRelations[]
  allTasks: TaskWithRelations[]
  scope: TaskScope
  onOpen?: (t: TaskWithRelations) => void
  quickAddDefaults?: Partial<NewTask>
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `col:${status}` })

  return (
    <div className="flex w-72 shrink-0 flex-col">
      <div className="mb-2 flex items-center gap-2 px-1">
        <span className={cn("size-2.5 rounded-full", STATUS_ACCENT[status])} />
        <span className="text-sm font-medium">{TASK_STATUS_LABELS[status]}</span>
        <span className="text-muted-foreground text-xs">{tasks.length}</span>
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          "bg-muted/40 flex min-h-24 flex-1 flex-col gap-2 rounded-lg p-2 transition-colors",
          isOver && "ring-primary/40 ring-2"
        )}
      >
        <SortableContext
          items={tasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {tasks.map((task) => (
            <SortableCard key={task.id} task={task} allTasks={allTasks} onOpen={onOpen} />
          ))}
        </SortableContext>
        <QuickAddTask
          scope={scope}
          defaults={{ ...quickAddDefaults, status }}
          placeholder="הוספה…"
          className="px-1"
        />
      </div>
    </div>
  )
}

export function TaskBoardView({
  tasks,
  scope,
  onOpen,
  quickAddDefaults,
}: {
  tasks: TaskWithRelations[]
  scope: TaskScope
  onOpen?: (t: TaskWithRelations) => void
  quickAddDefaults?: Partial<NewTask>
}) {
  const update = useUpdateTask(scope)
  const [activeId, setActiveId] = useState<string | null>(null)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  const topLevel = tasks.filter((t) => !t.parent_task_id)
  const byStatus = (s: TaskStatus) =>
    topLevel
      .filter((t) => t.status === s)
      .sort((a, b) => a.position - b.position)

  const activeTask = tasks.find((t) => t.id === activeId) ?? null

  function onDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id))
  }

  function onDragEnd(e: DragEndEvent) {
    setActiveId(null)
    const { active, over } = e
    if (!over) return

    const activeTaskId = String(active.id)
    const task = tasks.find((t) => t.id === activeTaskId)
    if (!task) return

    // Destination status: dropped on a column or on another card.
    const overId = String(over.id)
    let destStatus: TaskStatus
    let overTaskId: string | null = null
    if (overId.startsWith("col:")) {
      destStatus = overId.slice(4) as TaskStatus
    } else {
      overTaskId = overId
      const overTask = tasks.find((t) => t.id === overId)
      destStatus = (overTask?.status ?? task.status) as TaskStatus
    }

    const column = byStatus(destStatus).filter((t) => t.id !== activeTaskId)
    const insertIndex = overTaskId
      ? Math.max(0, column.findIndex((t) => t.id === overTaskId))
      : column.length

    const before = column[insertIndex - 1]?.position ?? 0
    const after = column[insertIndex]?.position ?? before + 2000
    const newPosition = (before + after) / 2

    if (task.status === destStatus && task.position === newPosition) return

    update.mutate({
      id: activeTaskId,
      patch: {
        status: destStatus,
        position: newPosition,
        completed_at:
          destStatus === "done"
            ? (task.completed_at ?? new Date().toISOString())
            : null,
      },
    })
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-2">
        {TASK_STATUSES.map((status) => (
          <Column
            key={status}
            status={status}
            tasks={byStatus(status)}
            allTasks={tasks}
            scope={scope}
            onOpen={onOpen}
            quickAddDefaults={quickAddDefaults}
          />
        ))}
      </div>
      <DragOverlay>
        {activeTask && (
          <div className="bg-card w-72 rounded-lg border p-3 shadow-lg">
            <TaskCardContent task={activeTask} />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}
