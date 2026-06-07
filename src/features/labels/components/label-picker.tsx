"use client"

import { useState } from "react"
import { Tag, Check, Plus } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import {
  useLabels,
  useCreateLabel,
  useToggleTaskLabel,
  LABEL_COLORS,
} from "@/features/labels/hooks"
import type { Label } from "@/lib/types"

export function LabelPicker({
  taskId,
  assigned,
}: {
  taskId: string
  assigned: Pick<Label, "id" | "name" | "color">[]
}) {
  const { data: labels = [] } = useLabels()
  const create = useCreateLabel()
  const toggle = useToggleTaskLabel()
  const [name, setName] = useState("")
  const [color, setColor] = useState<string>(LABEL_COLORS[0])
  const assignedIds = new Set(assigned.map((l) => l.id))

  function createAndAttach() {
    const n = name.trim()
    if (!n) return
    create.mutate(
      { name: n, color },
      {
        onSuccess: (label) => {
          toggle.mutate({ taskId, labelId: label.id, attached: false })
          setName("")
        },
        onError: () => toast.error("יצירת התווית נכשלה"),
      }
    )
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Tag className="size-3.5" />
          תוויות
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 p-2">
        <div className="max-h-56 space-y-0.5 overflow-auto">
          {labels.map((l) => {
            const isOn = assignedIds.has(l.id)
            return (
              <button
                key={l.id}
                type="button"
                onClick={() =>
                  toggle.mutate({ taskId, labelId: l.id, attached: isOn })
                }
                className="hover:bg-accent flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm"
              >
                <span className="size-3 rounded-full" style={{ backgroundColor: l.color }} />
                <span className="flex-1 truncate text-start">{l.name}</span>
                {isOn && <Check className="size-4" />}
              </button>
            )
          })}
          {labels.length === 0 && (
            <p className="text-muted-foreground px-2 py-1.5 text-xs">אין תוויות עדיין.</p>
          )}
        </div>
        <div className="mt-2 border-t pt-2">
          <div className="mb-1.5 flex flex-wrap gap-1">
            {LABEL_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                aria-label={c}
                className={cn(
                  "size-5 rounded-full border-2",
                  color === c ? "border-foreground" : "border-transparent"
                )}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
          <div className="flex gap-1">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && createAndAttach()}
              placeholder="תווית חדשה…"
              className="h-8"
            />
            <Button size="icon" className="size-8 shrink-0" onClick={createAndAttach}>
              <Plus className="size-4" />
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
