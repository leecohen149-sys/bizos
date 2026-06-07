"use client"

import { useState } from "react"
import { Trash2 } from "lucide-react"
import { toast } from "sonner"

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Label } from "@/components/ui/label"
import {
  TASK_STATUS_LABELS,
  TASK_PRIORITY_LABELS,
} from "@/lib/constants/domain"
import { useUpdateTask, useDeleteTask } from "@/features/tasks/hooks"
import type { TaskScope } from "@/features/tasks/api"
import type { TaskWithRelations } from "@/lib/types"
import { StatusSelect, PrioritySelect } from "./status-badge"
import { AssigneePicker } from "./assignee-picker"
import { TaskRow } from "./task-row"
import { QuickAddTask } from "./quick-add-task"
import { TaskComments } from "./task-comments"
import { TaskDependencies } from "./task-dependencies"
import { TaskAttachments } from "./task-attachments"
import { LabelPicker } from "@/features/labels/components/label-picker"
import { TaskReminders } from "@/features/reminders/components/task-reminders"

export function TaskDetailSheet({
  task,
  allTasks,
  scope,
  open,
  onOpenChange,
}: {
  task: TaskWithRelations | null
  allTasks: TaskWithRelations[]
  scope: TaskScope
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const update = useUpdateTask(scope)
  const del = useDeleteTask(scope)
  const [title, setTitle] = useState(task?.title ?? "")
  const [description, setDescription] = useState(task?.description ?? "")
  const [trackedId, setTrackedId] = useState(task?.id ?? null)

  // Re-initialize local fields when a different task is opened (React's
  // "adjust state during render" pattern — no effect needed).
  if (task && task.id !== trackedId) {
    setTrackedId(task.id)
    setTitle(task.title)
    setDescription(task.description ?? "")
  }

  if (!task) return null
  const subtasks = allTasks.filter((t) => t.parent_task_id === task.id)

  function patch(p: Parameters<typeof update.mutate>[0]["patch"]) {
    update.mutate({ id: task!.id, patch: p })
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="sr-only">פרטי משימה</SheetTitle>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => title.trim() && title !== task.title && patch({ title: title.trim() })}
            className="h-auto border-none px-0 text-lg font-semibold shadow-none focus-visible:ring-0"
          />
        </SheetHeader>

        <div className="grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-3 px-4 py-2 text-sm">
          <span className="text-muted-foreground">סטטוס</span>
          <div>
            <StatusSelect
              status={task.status}
              onChange={(status) =>
                patch({
                  status,
                  completed_at: status === "done" ? new Date().toISOString() : null,
                })
              }
            />
          </div>

          <span className="text-muted-foreground">עדיפות</span>
          <div>
            <PrioritySelect priority={task.priority} onChange={(priority) => patch({ priority })} />
          </div>

          <span className="text-muted-foreground">אחראי</span>
          <div className="flex items-center gap-2">
            <AssigneePicker
              assigneeId={task.assignee_id}
              onChange={(assignee_id) => patch({ assignee_id })}
            />
            <span className="text-muted-foreground text-xs">
              {task.assignee?.full_name ?? "ללא"}
            </span>
          </div>

          <span className="text-muted-foreground">תאריך יעד</span>
          <div>
            <Input
              type="date"
              dir="ltr"
              value={task.due_date ?? ""}
              onChange={(e) => patch({ due_date: e.target.value || null })}
              className="h-8 w-40"
            />
          </div>

          <span className="text-muted-foreground">תוויות</span>
          <div className="flex flex-wrap items-center gap-1.5">
            {task.labels.map((l) => (
              <span
                key={l.id}
                className="rounded-full px-2 py-0.5 text-xs font-medium text-white"
                style={{ backgroundColor: l.color }}
              >
                {l.name}
              </span>
            ))}
            <LabelPicker taskId={task.id} assigned={task.labels} />
          </div>
        </div>

        <Separator className="my-2" />

        <div className="space-y-2 px-4">
          <Label className="text-muted-foreground text-xs">תיאור</Label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={() =>
              description !== (task.description ?? "") &&
              patch({ description: description || null })
            }
            placeholder="הוסיפו תיאור…"
            rows={4}
          />
        </div>

        <Separator className="my-3" />

        <div className="space-y-1 px-4">
          <Label className="text-muted-foreground text-xs">
            תתי‑משימות ({subtasks.filter((s) => s.status === "done").length}/{subtasks.length})
          </Label>
          {subtasks.map((st) => (
            <TaskRow key={st.id} task={st} scope={scope} />
          ))}
          <QuickAddTask
            scope={scope}
            defaults={{ parent_task_id: task.id, project_id: task.project_id }}
            placeholder="הוספת תת‑משימה…"
          />
        </div>

        <Separator className="my-3" />
        <div className="px-4">
          <TaskReminders taskId={task.id} />
        </div>

        <Separator className="my-3" />
        <div className="space-y-2 px-4">
          <Label className="text-muted-foreground text-xs">תלויות</Label>
          <TaskDependencies taskId={task.id} />
        </div>

        <Separator className="my-3" />
        <div className="space-y-2 px-4">
          <Label className="text-muted-foreground text-xs">קבצים מצורפים</Label>
          <TaskAttachments taskId={task.id} />
        </div>

        <Separator className="my-3" />
        <div className="space-y-2 px-4">
          <Label className="text-muted-foreground text-xs">תגובות</Label>
          <TaskComments taskId={task.id} />
        </div>

        <div className="mt-auto flex items-center justify-between p-4">
          <span className="text-muted-foreground text-xs">
            {TASK_STATUS_LABELS[task.status]} · {TASK_PRIORITY_LABELS[task.priority]}
          </span>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              del.mutate(task.id, { onError: () => toast.error("מחיקה נכשלה") })
              onOpenChange(false)
            }}
          >
            <Trash2 className="size-4" />
            מחיקת משימה
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
