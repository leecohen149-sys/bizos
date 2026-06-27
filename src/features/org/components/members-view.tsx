"use client"

import { useState, useTransition } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { UserPlus, Trash2, Copy } from "lucide-react"
import { toast } from "sonner"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ORG_ROLES,
  ORG_ROLE_LABELS,
  ADMIN_ROLES,
} from "@/lib/constants/domain"
import { useOrg } from "@/features/org/org-context"
import {
  inviteMemberAction,
  updateMemberRoleAction,
  removeMemberAction,
} from "@/features/org/actions"
import { inviteMemberSchema, type InviteMemberInput } from "@/lib/validations/org"
import { publicEnv } from "@/lib/env"
import { withSkewRecovery } from "@/lib/actions/with-skew-recovery"

export function MembersView() {
  const { orgId, members, role, currentUserId } = useOrg()
  const isAdmin = ADMIN_ROLES.includes(role)
  const [, startTransition] = useTransition()

  return (
    <div className="space-y-6">
      {isAdmin && <InviteForm orgId={orgId} />}

      <div className="space-y-2">
        <h2 className="text-sm font-medium">חברי הצוות ({members.length})</h2>
        {members.map((m) => {
          const name = m.full_name ?? "משתמש"
          const isSelf = m.user_id === currentUserId
          return (
            <Card key={m.user_id}>
              <CardContent className="flex items-center gap-3 py-3">
                <Avatar className="size-9">
                  {m.avatar_url && <AvatarImage src={m.avatar_url} alt={name} />}
                  <AvatarFallback>{name.charAt(0)}</AvatarFallback>
                </Avatar>
                <span className="flex-1 truncate font-medium">
                  {name} {isSelf && <span className="text-muted-foreground text-xs">(אתה)</span>}
                </span>

                {isAdmin && m.role !== "owner" && !isSelf ? (
                  <Select
                    defaultValue={m.role}
                    onValueChange={(value) =>
                      startTransition(async () => {
                        const res = await withSkewRecovery(() =>
                          updateMemberRoleAction(orgId, m.user_id, value)
                        )
                        if ("error" in res) toast.error(res.error)
                        else toast.success("התפקיד עודכן")
                      })
                    }
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ORG_ROLES.filter((r) => r !== "owner").map((r) => (
                        <SelectItem key={r} value={r}>
                          {ORG_ROLE_LABELS[r]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <span className="text-muted-foreground text-sm">
                    {ORG_ROLE_LABELS[m.role]}
                  </span>
                )}

                {isAdmin && m.role !== "owner" && !isSelf && (
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="הסרה"
                    onClick={() =>
                      startTransition(async () => {
                        const res = await withSkewRecovery(() =>
                          removeMemberAction(orgId, m.user_id)
                        )
                        if ("error" in res) toast.error(res.error)
                        else toast.success("החבר הוסר")
                      })
                    }
                  >
                    <Trash2 className="text-muted-foreground hover:text-destructive size-4" />
                  </Button>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

function InviteForm({ orgId }: { orgId: string }) {
  const [isPending, startTransition] = useTransition()
  const [lastLink, setLastLink] = useState<string | null>(null)
  const form = useForm<InviteMemberInput>({
    resolver: zodResolver(inviteMemberSchema),
    defaultValues: { email: "", role: "member" },
  })

  function onSubmit(values: InviteMemberInput) {
    startTransition(async () => {
      const res = await withSkewRecovery(() => inviteMemberAction(orgId, values))
      if ("error" in res) {
        toast.error(res.error)
        return
      }
      const link = `${publicEnv.NEXT_PUBLIC_APP_URL}/invite/${res.token}`
      setLastLink(link)
      form.reset({ email: "", role: values.role })
      navigator.clipboard?.writeText(link).then(
        () => toast.success("ההזמנה נוצרה והקישור הועתק"),
        () => toast.success("ההזמנה נוצרה")
      )
    })
  }

  return (
    <Card>
      <CardContent className="py-4">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-medium">
          <UserPlus className="size-4" />
          הזמנת חבר צוות
        </h2>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-wrap gap-2">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem className="min-w-48 flex-1">
                  <FormControl>
                    <Input type="email" dir="ltr" placeholder="teammate@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {ORG_ROLES.filter((r) => r !== "owner").map((r) => (
                        <SelectItem key={r} value={r}>
                          {ORG_ROLE_LABELS[r]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isPending}>
              הזמנה
            </Button>
          </form>
        </Form>
        {lastLink && (
          <div className="text-muted-foreground mt-3 flex items-center gap-2 text-xs">
            <Copy className="size-3.5" />
            <span className="truncate" dir="ltr">{lastLink}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
