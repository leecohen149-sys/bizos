"use client"

import { useState } from "react"
import { useQueryState, parseAsStringLiteral } from "nuqs"
import { List, LayoutGrid } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useTasks, useTasksRealtime } from "@/features/tasks/hooks"
import type { TaskScope } from "@/features/tasks/api"
import type { TaskWithRelations } from "@/lib/types"
import type { NewTask } from "@/features/tasks/hooks"
import { TaskListView } from "./task-list"
import { TaskBoardView } from "./task-board"
import { TaskDetailSheet } from "./task-detail-sheet"

type Defaults = Partial<NewTask>
const VIEWS = ["list", "board"] as const

export function TasksView({
  scope,
  quickAddDefaults,
  defaultView = "list",
}: {
  scope: TaskScope
  quickAddDefaults?: Defaults
  defaultView?: (typeof VIEWS)[number]
}) {
  const { data: tasks = [], isLoading } = useTasks(scope)
  useTasksRealtime()
  const [view, setView] = useQueryState(
    "view",
    parseAsStringLiteral(VIEWS).withDefault(defaultView)
  )
  const [selected, setSelected] = useState<TaskWithRelations | null>(null)
  const [open, setOpen] = useState(false)

  function openTask(task: TaskWithRelations) {
    setSelected(task)
    setOpen(true)
  }

  // Keep the open sheet's task in sync with fresh query data.
  const liveSelected = selected
    ? (tasks.find((t) => t.id === selected.id) ?? selected)
    : null

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end gap-1">
        <Button
          variant={view === "list" ? "secondary" : "ghost"}
          size="sm"
          onClick={() => setView("list")}
          aria-pressed={view === "list"}
        >
          <List className="size-4" />
          רשימה
        </Button>
        <Button
          variant={view === "board" ? "secondary" : "ghost"}
          size="sm"
          onClick={() => setView("board")}
          aria-pressed={view === "board"}
        >
          <LayoutGrid className="size-4" />
          לוח
        </Button>
      </div>

      <div className={cn(view === "board" && "-mx-4 px-4 md:-mx-6 md:px-6")}>
        {view === "list" ? (
          <TaskListView
            tasks={tasks}
            scope={scope}
            isLoading={isLoading}
            onOpen={openTask}
            quickAddDefaults={quickAddDefaults}
          />
        ) : (
          <TaskBoardView tasks={tasks} scope={scope} onOpen={openTask} />
        )}
      </div>

      <TaskDetailSheet
        task={liveSelected}
        allTasks={tasks}
        scope={scope}
        open={open}
        onOpenChange={setOpen}
      />
    </div>
  )
}
