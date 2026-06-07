"use client"

import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { Building2, UserPlus, Check, Copy } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
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
  createOrganizationAction,
  inviteMemberAction,
} from "@/features/org/actions"
import {
  createOrgSchema,
  inviteMemberSchema,
  type CreateOrgInput,
  type InviteMemberInput,
} from "@/lib/validations/org"
import { ORG_ROLES, ORG_ROLE_LABELS } from "@/lib/constants/domain"
import { publicEnv } from "@/lib/env"

export function OnboardingWizard() {
  const router = useRouter()
  const [orgId, setOrgId] = useState<string | null>(null)
  const [invites, setInvites] = useState<string[]>([])

  if (!orgId) {
    return <CreateOrgStep onCreated={setOrgId} />
  }
  return (
    <InviteStep
      orgId={orgId}
      invites={invites}
      onInvited={(email) => setInvites((prev) => [...prev, email])}
      onFinish={() => {
        router.push("/")
        router.refresh()
      }}
    />
  )
}

function CreateOrgStep({ onCreated }: { onCreated: (id: string) => void }) {
  const [isPending, startTransition] = useTransition()
  const form = useForm<CreateOrgInput>({
    resolver: zodResolver(createOrgSchema),
    defaultValues: { name: "" },
  })

  function onSubmit(values: CreateOrgInput) {
    startTransition(async () => {
      const res = await createOrganizationAction(values)
      if ("error" in res) toast.error(res.error)
      else onCreated(res.orgId)
    })
  }

  return (
    <Card>
      <CardHeader className="items-center text-center">
        <Building2 className="text-primary mb-2 size-10" />
        <CardTitle className="text-xl">בואו ניצור את העסק שלכם</CardTitle>
        <CardDescription>
          העסק הוא המרחב שבו תנהלו משימות, פרויקטים ולקוחות.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>שם העסק</FormLabel>
                  <FormControl>
                    <Input placeholder="לדוגמה: קליר‑לי בע״מ" autoFocus {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? "יוצר…" : "המשך"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}

function InviteStep({
  orgId,
  invites,
  onInvited,
  onFinish,
}: {
  orgId: string
  invites: string[]
  onInvited: (email: string) => void
  onFinish: () => void
}) {
  const [isPending, startTransition] = useTransition()
  const form = useForm<InviteMemberInput>({
    resolver: zodResolver(inviteMemberSchema),
    defaultValues: { email: "", role: "member" },
  })

  function onSubmit(values: InviteMemberInput) {
    startTransition(async () => {
      const res = await inviteMemberAction(orgId, values)
      if ("error" in res) {
        toast.error(res.error)
        return
      }
      const link = `${publicEnv.NEXT_PUBLIC_APP_URL}/invite/${res.token}`
      onInvited(values.email)
      form.reset({ email: "", role: values.role })
      navigator.clipboard?.writeText(link).then(
        () => toast.success("ההזמנה נוצרה והקישור הועתק", { icon: <Copy className="size-4" /> }),
        () => toast.success("ההזמנה נוצרה")
      )
    })
  }

  return (
    <Card>
      <CardHeader className="items-center text-center">
        <UserPlus className="text-primary mb-2 size-10" />
        <CardTitle className="text-xl">הזמינו את הצוות</CardTitle>
        <CardDescription>
          הוסיפו חברי צוות עכשיו, או דלגו והוסיפו מאוחר יותר.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>אימייל</FormLabel>
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
                  <FormLabel>תפקיד</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
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
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              variant="outline"
              className="w-full"
              disabled={isPending}
            >
              {isPending ? "מזמין…" : "שליחת הזמנה"}
            </Button>
          </form>
        </Form>

        {invites.length > 0 && (
          <ul className="space-y-1.5 text-sm">
            {invites.map((email) => (
              <li key={email} className="text-muted-foreground flex items-center gap-2">
                <Check className="text-status-done size-4" />
                <span dir="ltr">{email}</span>
              </li>
            ))}
          </ul>
        )}

        <Button onClick={onFinish} className="w-full">
          {invites.length > 0 ? "סיום ומעבר לדשבורד" : "דלג ולמערכת"}
        </Button>
      </CardContent>
    </Card>
  )
}
