"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Target } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { updateLeadRecipientsAction } from "@/features/notifications/actions"
import { withSkewRecovery } from "@/lib/actions/with-skew-recovery"

export type LeadRecipientMember = {
  user_id: string
  full_name: string | null
  is_owner: boolean
}

export function LeadRecipients({
  members,
  initialSelected,
}: {
  members: LeadRecipientMember[]
  /** null/empty → default to the owner. */
  initialSelected: string[] | null
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  const fallback = members.filter((m) => m.is_owner).map((m) => m.user_id)
  const [selected, setSelected] = useState<string[]>(
    initialSelected && initialSelected.length > 0 ? initialSelected : fallback
  )

  function toggle(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  function save() {
    startTransition(async () => {
      const res = await withSkewRecovery(() => updateLeadRecipientsAction(selected))
      if ("error" in res) toast.error(res.error)
      else {
        toast.success("ההגדרה נשמרה")
        router.refresh()
      }
    })
  }

  return (
    <Card>
      <CardContent className="space-y-3 py-4">
        <div className="flex items-center gap-2">
          <Target className="size-4.5" />
          <h2 className="text-sm font-medium">מי מקבל התראות על לידים חדשים</h2>
        </div>
        <p className="text-muted-foreground text-xs">
          בחרו אילו חברי צוות יקבלו התראה ופוש כשנכנס ליד חדש מאוטומציה.
        </p>

        <div className="space-y-2">
          {members.map((m) => (
            <label key={m.user_id} className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={selected.includes(m.user_id)}
                onCheckedChange={() => toggle(m.user_id)}
              />
              <span>{m.full_name ?? "משתמש"}</span>
              {m.is_owner && (
                <span className="text-muted-foreground text-xs">(בעלים)</span>
              )}
            </label>
          ))}
        </div>

        <Button size="sm" onClick={save} disabled={pending}>
          שמירה
        </Button>
      </CardContent>
    </Card>
  )
}
