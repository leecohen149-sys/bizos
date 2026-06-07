"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { toast } from "sonner"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useCreateTask } from "@/features/tasks/hooks"
import type { TaskScope } from "@/features/tasks/api"
import type { NewTask } from "@/features/tasks/hooks"

type Defaults = Partial<NewTask>

export function QuickAddTask({
  scope,
  defaults,
  placeholder = "הוספת משימה…",
  className,
}: {
  scope: TaskScope
  defaults?: Defaults
  placeholder?: string
  className?: string
}) {
  const [title, setTitle] = useState("")
  const create = useCreateTask(scope)

  function submit() {
    const trimmed = title.trim()
    if (!trimmed) return
    create.mutate(
      { title: trimmed, ...defaults },
      { onError: () => toast.error("יצירת המשימה נכשלה") }
    )
    setTitle("")
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Plus className="text-muted-foreground size-4 shrink-0" />
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault()
            submit()
          }
        }}
        placeholder={placeholder}
        className="h-8 border-none bg-transparent px-0 shadow-none focus-visible:ring-0"
      />
      {title.trim() && (
        <Button size="sm" onClick={submit} disabled={create.isPending}>
          הוסף
        </Button>
      )}
    </div>
  )
}
