"use client"

import { useState } from "react"
import { Phone, Users, Mail, StickyNote, CheckSquare, Send } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { formatDate, formatTime } from "@/lib/format"
import { useActivities, useAddActivity } from "@/features/crm/activities-hooks"
import { ACTIVITY_TYPES, ACTIVITY_TYPE_LABELS } from "@/features/crm/validations"
import type { Enums } from "@/lib/types"

const ICON: Record<Enums<"crm_activity_type">, typeof Phone> = {
  call: Phone,
  meeting: Users,
  email: Mail,
  note: StickyNote,
  task: CheckSquare,
}

export function ActivityFeed(scope: { dealId?: string; contactId?: string }) {
  const { data: activities = [] } = useActivities(scope)
  const add = useAddActivity(scope)
  const [type, setType] = useState<Enums<"crm_activity_type">>("note")
  const [note, setNote] = useState("")

  function submit() {
    const trimmed = note.trim()
    if (!trimmed) return
    add.mutate({
      type,
      note: trimmed,
      deal_id: scope.dealId ?? null,
      contact_id: scope.contactId ?? null,
    })
    setNote("")
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <div className="flex gap-2">
          <Select value={type} onValueChange={(v) => setType(v as Enums<"crm_activity_type">)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ACTIVITY_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {ACTIVITY_TYPE_LABELS[t]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="תיעוד פעילות…"
            rows={1}
            className="flex-1"
          />
          <Button size="icon" onClick={submit} aria-label="הוספה">
            <Send className="size-4" />
          </Button>
        </div>
      </div>

      <ul className="space-y-2.5">
        {activities.map((a) => {
          const Icon = ICON[a.type]
          return (
            <li key={a.id} className="flex gap-2">
              <span className="bg-muted mt-0.5 grid size-7 shrink-0 place-items-center rounded-full">
                <Icon className="size-3.5" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-medium">
                    {ACTIVITY_TYPE_LABELS[a.type]}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    {formatDate(a.occurred_at)} {formatTime(a.occurred_at)}
                  </span>
                </div>
                {a.note && <p className="text-sm whitespace-pre-wrap">{a.note}</p>}
              </div>
            </li>
          )
        })}
        {activities.length === 0 && (
          <li className="text-muted-foreground text-xs">אין פעילות עדיין.</li>
        )}
      </ul>
    </div>
  )
}
