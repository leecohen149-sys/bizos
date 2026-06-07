"use client"

import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  TASK_STATUSES,
  TASK_STATUS_LABELS,
  TASK_PRIORITIES,
  TASK_PRIORITY_LABELS,
  type TaskStatus,
  type TaskPriority,
} from "@/lib/constants/domain"

const STATUS_DOT: Record<TaskStatus, string> = {
  not_started: "bg-status-not-started",
  in_progress: "bg-status-in-progress",
  blocked: "bg-status-blocked",
  done: "bg-status-done",
}

export function StatusBadge({
  status,
  className,
}: {
  status: TaskStatus
  className?: string
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium",
        "bg-muted text-foreground",
        className
      )}
    >
      <span className={cn("size-2 rounded-full", STATUS_DOT[status])} />
      {TASK_STATUS_LABELS[status]}
    </span>
  )
}

export function StatusSelect({
  status,
  onChange,
  className,
}: {
  status: TaskStatus
  onChange: (status: TaskStatus) => void
  className?: string
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn("rounded-full outline-none focus-visible:ring-2", className)}
        aria-label="שינוי סטטוס"
      >
        <StatusBadge status={status} className="hover:bg-accent cursor-pointer" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {TASK_STATUSES.map((s) => (
          <DropdownMenuItem key={s} onClick={() => onChange(s)} className="gap-2">
            <span className={cn("size-2 rounded-full", STATUS_DOT[s])} />
            {TASK_STATUS_LABELS[s]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

const PRIORITY_COLOR: Record<TaskPriority, string> = {
  low: "text-priority-low",
  medium: "text-priority-medium",
  high: "text-priority-high",
  urgent: "text-priority-urgent",
}

export function PriorityFlag({
  priority,
  withLabel = false,
  className,
}: {
  priority: TaskPriority
  withLabel?: boolean
  className?: string
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-xs font-medium",
        PRIORITY_COLOR[priority],
        className
      )}
      title={TASK_PRIORITY_LABELS[priority]}
    >
      <svg viewBox="0 0 16 16" className="size-3.5 fill-current" aria-hidden>
        <path d="M3 1a1 1 0 0 1 1-1h0a1 1 0 0 1 1 1v14a1 1 0 1 1-2 0V1Zm3 1h7l-2 2.5L14 7H6V2Z" />
      </svg>
      {withLabel && TASK_PRIORITY_LABELS[priority]}
    </span>
  )
}

export function PrioritySelect({
  priority,
  onChange,
}: {
  priority: TaskPriority
  onChange: (p: TaskPriority) => void
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="rounded outline-none focus-visible:ring-2" aria-label="שינוי עדיפות">
        <PriorityFlag priority={priority} withLabel className="hover:bg-accent cursor-pointer rounded px-1.5 py-0.5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {TASK_PRIORITIES.map((p) => (
          <DropdownMenuItem key={p} onClick={() => onChange(p)} className="gap-2">
            <PriorityFlag priority={p} />
            {TASK_PRIORITY_LABELS[p]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
