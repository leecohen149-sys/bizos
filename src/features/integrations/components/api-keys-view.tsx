"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { KeyRound, Copy, Trash2, Plus, Check } from "lucide-react"
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
import { API_SCOPES } from "@/features/integrations/constants"
import { createApiKeyAction, revokeApiKeyAction } from "@/features/integrations/actions"

export type ApiKeyRow = {
  id: string
  name: string
  key_prefix: string
  scopes: string[]
  last_used_at: string | null
  expires_at: string | null
  revoked_at: string | null
  created_at: string
}

export function ApiKeysView({ keys }: { keys: ApiKeyRow[] }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  // create dialog state
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [scopes, setScopes] = useState<string[]>(["*"])

  // one-time reveal state
  const [createdKey, setCreatedKey] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  function toggleScope(scope: string) {
    setScopes((prev) =>
      prev.includes(scope) ? prev.filter((s) => s !== scope) : [...prev, scope]
    )
  }

  function submit() {
    startTransition(async () => {
      const res = await createApiKeyAction({ name, scopes })
      if ("error" in res) {
        toast.error(res.error)
        return
      }
      setOpen(false)
      setName("")
      setScopes(["*"])
      setCreatedKey(res.fullKey)
      router.refresh()
    })
  }

  function revoke(id: string) {
    startTransition(async () => {
      const res = await revokeApiKeyAction(id)
      if ("error" in res) toast.error(res.error)
      else {
        toast.success("המפתח בוטל")
        router.refresh()
      }
    })
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <KeyRound className="size-4.5" />
          <h2 className="text-sm font-medium">מפתחות API</h2>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5">
              <Plus className="size-4" />
              מפתח חדש
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>יצירת מפתח API</DialogTitle>
              <DialogDescription>
                בחרו שם והרשאות. המפתח יוצג פעם אחת בלבד לאחר היצירה.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="key-name">שם</Label>
                <Input
                  id="key-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="n8n production"
                />
              </div>
              <div className="space-y-2">
                <Label>הרשאות (scopes)</Label>
                <div className="grid grid-cols-2 gap-2">
                  {API_SCOPES.map((scope) => (
                    <label
                      key={scope}
                      className="flex items-center gap-2 text-sm"
                    >
                      <Checkbox
                        checked={scopes.includes(scope)}
                        onCheckedChange={() => toggleScope(scope)}
                      />
                      <span className="font-mono text-xs">
                        {scope === "*" ? "* (הכול)" : scope}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={submit} disabled={pending || !name.trim() || scopes.length === 0}>
                צור מפתח
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {keys.length === 0 ? (
        <p className="text-muted-foreground text-sm">עדיין אין מפתחות.</p>
      ) : (
        <div className="space-y-2">
          {keys.map((k) => {
            const revoked = Boolean(k.revoked_at)
            return (
              <Card key={k.id} className={revoked ? "opacity-60" : undefined}>
                <CardContent className="flex items-center gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-medium">{k.name}</span>
                      {revoked && (
                        <Badge variant="secondary" className="text-[10px]">
                          בוטל
                        </Badge>
                      )}
                    </div>
                    <div className="text-muted-foreground mt-0.5 flex flex-wrap items-center gap-x-2 text-xs">
                      <code className="font-mono">{k.key_prefix}…</code>
                      <span>·</span>
                      <span>{k.scopes.join(", ")}</span>
                      {k.last_used_at && (
                        <>
                          <span>·</span>
                          <span>
                            שימוש אחרון: {new Date(k.last_used_at).toLocaleDateString("he-IL")}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  {!revoked && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => revoke(k.id)}
                      disabled={pending}
                      aria-label="בטל מפתח"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* One-time key reveal */}
      <Dialog open={Boolean(createdKey)} onOpenChange={(o) => !o && setCreatedKey(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>המפתח נוצר</DialogTitle>
            <DialogDescription>
              העתיקו אותו עכשיו — לא נוכל להציג אותו שוב.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2">
            <code className="bg-muted flex-1 overflow-x-auto rounded-md p-2 font-mono text-xs">
              {createdKey}
            </code>
            <Button
              size="icon"
              variant="outline"
              onClick={() => {
                if (createdKey) navigator.clipboard.writeText(createdKey)
                setCopied(true)
                toast.success("הועתק")
              }}
              aria-label="העתק"
            >
              {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
            </Button>
          </div>
          <DialogFooter>
            <Button onClick={() => setCreatedKey(null)}>סיום</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}
