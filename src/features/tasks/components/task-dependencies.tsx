"use client"

import { useState } from "react"
import { Ban, X, Plus } from "lucide-react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { useOrg } from "@/features/org/org-context"
import { useSupabase } from "@/features/tasks/hooks"
import {
  useDependencies,
  useAddDependency,
  useRemoveDependency,
  type DependencyRow,
} from "@/features/tasks/dependencies-hooks"
import { useQuery } from "@tanstack/react-query"

export function TaskDependencies({ taskId }: { taskId: string }) {
  const { data } = useDependencies(taskId)
  const remove = useRemoveDependency(taskId)

  return (
    <div className="space-y-3">
      <DepSection
        title="נחסם ע״י"
        rows={data?.blockedBy ?? []}
        taskId={taskId}
        direction="blockedBy"
        onRemove={(id) => remove.mutate(id)}
      />
      <DepSection
        title="חוסם"
        rows={data?.blocks ?? []}
        taskId={taskId}
        direction="blocks"
        onRemove={(id) => remove.mutate(id)}
      />
    </div>
  )
}

function DepSection({
  title,
  rows,
  taskId,
  direction,
  onRemove,
}: {
  title: string
  rows: DependencyRow[]
  taskId: string
  direction: "blocks" | "blockedBy"
  onRemove: (depId: string) => void
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground text-xs">{title}</span>
        <AddDependency taskId={taskId} direction={direction} existing={rows} />
      </div>
      {rows.map((r) => (
        <div
          key={r.depId}
          className="bg-muted/40 group flex items-center gap-2 rounded px-2 py-1 text-sm"
        >
          <Ban className="text-status-blocked size-3.5 shrink-0" />
          <span
            className={cn(
              "flex-1 truncate",
              r.task.status === "done" && "text-muted-foreground line-through"
            )}
          >
            {r.task.title}
          </span>
          <button
            onClick={() => onRemove(r.depId)}
            className="text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100"
            aria-label="הסרת תלות"
          >
            <X className="size-3.5" />
          </button>
        </div>
      ))}
    </div>
  )
}

function AddDependency({
  taskId,
  direction,
  existing,
}: {
  taskId: string
  direction: "blocks" | "blockedBy"
  existing: DependencyRow[]
}) {
  const supabase = useSupabase()
  const { orgId } = useOrg()
  const add = useAddDependency(taskId)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")

  const { data: options = [] } = useQuery({
    queryKey: ["dep-search", orgId, taskId, query],
    enabled: open,
    queryFn: async () => {
      let q = supabase
        .from("tasks")
        .select("id, title, status")
        .eq("org_id", orgId)
        .neq("id", taskId)
        .limit(8)
      if (query.trim()) q = q.ilike("title", `%${query.trim()}%`)
      const { data } = await q
      return data ?? []
    },
  })

  const existingIds = new Set(existing.map((r) => r.task.id))

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="xs" className="gap-1">
          <Plus className="size-3.5" />
          הוסף
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 p-0">
        <Command shouldFilter={false}>
          <CommandInput placeholder="חיפוש משימה…" value={query} onValueChange={setQuery} />
          <CommandList>
            <CommandEmpty>לא נמצאו משימות.</CommandEmpty>
            {options
              .filter((o) => !existingIds.has(o.id))
              .map((o) => (
                <CommandItem
                  key={o.id}
                  value={o.id}
                  onSelect={() => {
                    add.mutate(
                      { otherId: o.id, direction },
                      {
                        onError: () =>
                          toast.error("לא ניתן להוסיף — ייתכן שזה ייצור תלות מעגלית"),
                      }
                    )
                    setOpen(false)
                    setQuery("")
                  }}
                >
                  {o.title}
                </CommandItem>
              ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
