"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Webhook, Plus, Trash2, Send, Eye, EyeOff, Copy } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { WEBHOOK_RESOURCES } from "@/features/integrations/constants"
import {
  createWebhookAction,
  deleteWebhookAction,
  toggleWebhookAction,
  testWebhookAction,
} from "@/features/integrations/actions"

export type WebhookEndpointRow = {
  id: string
  url: string
  secret: string
  events: string[]
  is_active: boolean
  description: string | null
  created_at: string
}

export type WebhookDeliveryRow = {
  id: string
  endpoint_id: string
  event_type: string
  status: string
  attempts: number
  last_status_code: number | null
  created_at: string
}

const STATUS_LABELS: Record<string, string> = {
  pending: "ממתין",
  delivered: "נשלח",
  failed: "נכשל",
  dead: "בוטל",
}
const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive"> = {
  delivered: "default",
  pending: "secondary",
  failed: "destructive",
  dead: "destructive",
}

export function WebhooksView({
  endpoints,
  deliveries,
}: {
  endpoints: WebhookEndpointRow[]
  deliveries: WebhookDeliveryRow[]
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  const [open, setOpen] = useState(false)
  const [url, setUrl] = useState("")
  const [description, setDescription] = useState("")
  const [events, setEvents] = useState<string[]>([])
  const [revealed, setRevealed] = useState<Record<string, boolean>>({})

  function toggleEvent(e: string) {
    setEvents((prev) => (prev.includes(e) ? prev.filter((x) => x !== e) : [...prev, e]))
  }

  function submit() {
    startTransition(async () => {
      const res = await createWebhookAction({ url, events, description: description || null })
      if ("error" in res) {
        toast.error(res.error)
        return
      }
      setOpen(false)
      setUrl("")
      setDescription("")
      setEvents([])
      toast.success("ה-Webhook נוצר")
      router.refresh()
    })
  }

  function runAction(fn: () => Promise<{ error: string } | { ok: true }>, okMsg: string) {
    startTransition(async () => {
      const res = await fn()
      if ("error" in res) toast.error(res.error)
      else {
        toast.success(okMsg)
        router.refresh()
      }
    })
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Webhook className="size-4.5" />
          <h2 className="text-sm font-medium">Webhooks</h2>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5">
              <Plus className="size-4" />
              Webhook חדש
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>הוספת Webhook</DialogTitle>
              <DialogDescription>
                כתובת HTTPS שתקבל אירועים חתומים ב-HMAC.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="wh-url">כתובת (URL)</Label>
                <Input
                  id="wh-url"
                  dir="ltr"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://hook.eu2.make.com/…"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="wh-desc">תיאור (אופציונלי)</Label>
                <Input
                  id="wh-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="סנכרון לידים ל-Make"
                />
              </div>
              <div className="space-y-2">
                <Label>אירועים</Label>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                  {WEBHOOK_RESOURCES.map((r) => (
                    <div key={r.key} className="space-y-1">
                      <p className="text-muted-foreground text-xs font-medium">{r.label}</p>
                      {["created", "updated"].map((action) => {
                        const ev = `${r.key}.${action}`
                        return (
                          <label key={ev} className="flex items-center gap-2 text-sm">
                            <Checkbox
                              checked={events.includes(ev)}
                              onCheckedChange={() => toggleEvent(ev)}
                            />
                            <span className="font-mono text-xs">{ev}</span>
                          </label>
                        )
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={submit}
                disabled={pending || !url.trim() || events.length === 0}
              >
                צור Webhook
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {endpoints.length === 0 ? (
        <p className="text-muted-foreground text-sm">עדיין אין Webhooks.</p>
      ) : (
        <div className="space-y-2">
          {endpoints.map((ep) => (
            <Card key={ep.id} className={ep.is_active ? undefined : "opacity-60"}>
              <CardContent className="space-y-2 py-3">
                <div className="flex items-center gap-2">
                  <code dir="ltr" className="min-w-0 flex-1 truncate font-mono text-xs">
                    {ep.url}
                  </code>
                  {!ep.is_active && (
                    <Badge variant="secondary" className="text-[10px]">
                      כבוי
                    </Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="שלח בדיקה"
                    disabled={pending}
                    onClick={() => runAction(() => testWebhookAction(ep.id), "אירוע בדיקה נשלח")}
                  >
                    <Send className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={ep.is_active ? "כבה" : "הפעל"}
                    disabled={pending}
                    onClick={() =>
                      runAction(
                        () => toggleWebhookAction(ep.id, !ep.is_active),
                        ep.is_active ? "הושבת" : "הופעל"
                      )
                    }
                  >
                    {ep.is_active ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="מחק"
                    disabled={pending}
                    onClick={() => runAction(() => deleteWebhookAction(ep.id), "נמחק")}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>

                <div className="flex flex-wrap gap-1">
                  {ep.events.map((e) => (
                    <Badge key={e} variant="secondary" className="font-mono text-[10px]">
                      {e}
                    </Badge>
                  ))}
                </div>

                <div className="text-muted-foreground flex items-center gap-2 text-xs">
                  <span>Secret (HMAC):</span>
                  <code dir="ltr" className="font-mono">
                    {revealed[ep.id] ? ep.secret : "••••••••••••"}
                  </code>
                  <button
                    type="button"
                    className="hover:text-foreground"
                    onClick={() => setRevealed((p) => ({ ...p, [ep.id]: !p[ep.id] }))}
                  >
                    {revealed[ep.id] ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                  </button>
                  <button
                    type="button"
                    className="hover:text-foreground"
                    onClick={() => {
                      navigator.clipboard.writeText(ep.secret)
                      toast.success("הסוד הועתק")
                    }}
                    aria-label="העתק סוד"
                  >
                    <Copy className="size-3.5" />
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {deliveries.length > 0 && (
        <div className="space-y-2 pt-2">
          <h3 className="text-muted-foreground text-xs font-medium">משלוחים אחרונים</h3>
          <div className="overflow-hidden rounded-md border text-xs">
            {deliveries.map((d) => (
              <div
                key={d.id}
                className="flex items-center gap-3 border-b px-3 py-2 last:border-b-0"
              >
                <Badge variant={STATUS_VARIANT[d.status] ?? "secondary"} className="text-[10px]">
                  {STATUS_LABELS[d.status] ?? d.status}
                </Badge>
                <span className="font-mono">{d.event_type}</span>
                <span className="text-muted-foreground ms-auto">
                  {d.last_status_code ? `HTTP ${d.last_status_code}` : `ניסיון ${d.attempts}`}
                </span>
                <span className="text-muted-foreground">
                  {new Date(d.created_at).toLocaleString("he-IL")}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
