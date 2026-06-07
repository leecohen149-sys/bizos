"use client"

import { useState } from "react"
import { Bell, X, Plus } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { formatDate, formatTime } from "@/lib/format"
import {
  useTaskReminders,
  useCreateReminder,
  useDeleteReminder,
} from "@/features/reminders/hooks"

export function TaskReminders({ taskId }: { taskId: string }) {
  const { data: reminders = [] } = useTaskReminders(taskId)
  const create = useCreateReminder(taskId)
  const del = useDeleteReminder(taskId)
  const [value, setValue] = useState("")
  const [open, setOpen] = useState(false)

  function add() {
    if (!value) return
    create.mutate(
      { remindAt: new Date(value).toISOString() },
      {
        onSuccess: () => {
          setValue("")
          setOpen(false)
        },
        onError: () => toast.error("יצירת התזכורת נכשלה"),
      }
    )
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground text-xs">תזכורות</span>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="xs" className="gap-1">
              <Plus className="size-3.5" />
              תזכורת
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-64 space-y-2">
            <Input
              type="datetime-local"
              dir="ltr"
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
            <Button size="sm" className="w-full" onClick={add} disabled={create.isPending}>
              קביעת תזכורת
            </Button>
          </PopoverContent>
        </Popover>
      </div>
      {reminders.map((r) => (
        <div
          key={r.id}
          className="bg-muted/40 group flex items-center gap-2 rounded px-2 py-1 text-sm"
        >
          <Bell className="text-primary size-3.5 shrink-0" />
          <span className="flex-1">
            {formatDate(r.remind_at)} {formatTime(r.remind_at)}
          </span>
          <span className="text-muted-foreground text-xs">
            {r.status === "sent" ? "נשלחה" : "ממתינה"}
          </span>
          <button
            onClick={() => del.mutate(r.id)}
            className="text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100"
            aria-label="מחיקת תזכורת"
          >
            <X className="size-3.5" />
          </button>
        </div>
      ))}
    </div>
  )
}
