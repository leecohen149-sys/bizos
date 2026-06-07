"use client"

import { useState } from "react"
import { CalendarDays, GitBranch, MoreHorizontal, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { formatDate, isOverdue } from "@/lib/format"
import {
  useUpdateTask,
  useDeleteTask,
  useToggleComplete,
} from "@/features/tasks/hooks"
import type { TaskScope } from "@/features/tasks/api"
import type { TaskWithRelations } from "@/lib/types"
import { StatusSelect, PrioritySelect } from "./status-badge"
import { AssigneePicker } from "./assignee-picker"

export function TaskRow({
  task,
  scope,
  onOpen,
  subtaskProgress,
  indent = false,
}: {
  task: TaskWithRelations
  scope: TaskScope
  onOpen?: (task: TaskWithRelations) => void
  subtaskProgress?: { total: number; done: number }
  indent?: boolean
}) {
  const update = useUpdateTask(scope)
  const del = useDeleteTask(scope)
  const toggle = useToggleComplete(scope)
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(task.title)
  const done = task.status === "done"
  const optimistic = task.id.startsWith("optimistic-")

  function saveTitle() {
    const trimmed = title.trim()
    setEditing(false)
    if (trimmed && trimmed !== task.title) {
      update.mutate({ id: task.id, patch: { title: trimmed } })
    } else {
      setTitle(task.title)
    }
  }

  return (
    <div
      className={cn(
        "group hover:bg-accent/50 flex items-center gap-2 rounded-md px-2 py-1.5 transition-colors",
        indent && "ms-6",
        optimistic && "opacity-60"
      )}
    >
      <Checkbox
        checked={done}
        onCheckedChange={() => toggle(task)}
        aria-label={done ? "בטל השלמה" : "סמן כהושלם"}
        className="shrink-0"
      />

      {editing ? (
        <Input
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={saveTitle}
          onKeyDown={(e) => {
            if (e.key === "Enter") saveTitle()
            if (e.key === "Escape") {
              setTitle(task.title)
              setEditing(false)
            }
          }}
          className="h-7 flex-1"
        />
      ) : (
        <button
          type="button"
          onClick={() => onOpen?.(task)}
          onDoubleClick={() => setEditing(true)}
          className={cn(
            "flex-1 truncate text-start text-sm",
            done && "text-muted-foreground line-through"
          )}
        >
          {task.title}
        </button>
      )}

      {subtaskProgress && subtaskProgress.total > 0 && (
        <span className="text-muted-foreground hidden items-center gap-1 text-xs sm:flex">
          <GitBranch className="size-3" />
          {subtaskProgress.done}/{subtaskProgress.total}
        </span>
      )}

      {task.due_date && (
        <span
          className={cn(
            "hidden items-center gap-1 text-xs sm:flex",
            isOverdue(task.due_date) && !done
              ? "text-status-blocked"
              : "text-muted-foreground"
          )}
        >
          <CalendarDays className="size-3" />
          {formatDate(task.due_date)}
        </span>
      )}

      <div onClick={(e) => e.stopPropagation()} className="hidden sm:block">
        <PrioritySelect
          priority={task.priority}
          onChange={(priority) => update.mutate({ id: task.id, patch: { priority } })}
        />
      </div>

      <div onClick={(e) => e.stopPropagation()}>
        <StatusSelect
          status={task.status}
          onChange={(status) =>
            update.mutate({
              id: task.id,
              patch: {
                status,
                completed_at: status === "done" ? new Date().toISOString() : null,
              },
            })
          }
        />
      </div>

      <div onClick={(e) => e.stopPropagation()}>
        <AssigneePicker
          assigneeId={task.assignee_id}
          onChange={(assignee_id) => update.mutate({ id: task.id, patch: { assignee_id } })}
        />
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger
          className="text-muted-foreground hover:text-foreground rounded p-1 opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
          aria-label="פעולות"
        >
          <MoreHorizontal className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setEditing(true)}>
            שינוי שם
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={() =>
              del.mutate(task.id, { onError: () => toast.error("מחיקה נכשלה") })
            }
          >
            <Trash2 className="size-4" />
            מחיקה
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
