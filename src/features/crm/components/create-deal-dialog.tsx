"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Plus } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
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
import { useCreateDeal, useStages } from "@/features/crm/deals-hooks"
import { useContacts } from "@/features/crm/contacts-hooks"
import { useCompanies } from "@/features/crm/companies-hooks"
import { createDealSchema, type CreateDealInput } from "@/features/crm/validations"

export function CreateDealDialog({
  pipelineId,
  stageId,
  compact = false,
}: {
  pipelineId: string
  stageId: string
  compact?: boolean
}) {
  const [open, setOpen] = useState(false)
  const create = useCreateDeal(pipelineId)
  const { data: stages = [] } = useStages(pipelineId)
  const { data: contacts = [] } = useContacts()
  const { data: companies = [] } = useCompanies()

  const form = useForm<CreateDealInput>({
    resolver: zodResolver(createDealSchema),
    defaultValues: {
      title: "",
      value: 0,
      stage_id: stageId,
      contact_id: null,
      company_id: null,
      expected_close_date: null,
    },
  })

  function onSubmit(values: CreateDealInput) {
    create.mutate(values, {
      onSuccess: () => {
        toast.success("העסקה נוצרה")
        setOpen(false)
        form.reset({ ...form.getValues(), title: "", value: 0 })
      },
      onError: () => toast.error("יצירת העסקה נכשלה"),
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {compact ? (
          <Button variant="ghost" size="sm" className="text-muted-foreground justify-start gap-1.5">
            <Plus className="size-3.5" />
            עסקה
          </Button>
        ) : (
          <Button>
            <Plus className="size-4" />
            עסקה חדשה
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>עסקה חדשה</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>כותרת</FormLabel>
                  <FormControl>
                    <Input autoFocus placeholder="לדוגמה: חבילת ייעוץ" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ערך (₪)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        dir="ltr"
                        value={field.value}
                        onChange={(e) =>
                          field.onChange(e.target.value === "" ? 0 : Number(e.target.value))
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="stage_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>שלב</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {stages.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="company_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>חברה</FormLabel>
                  <Select
                    value={field.value ?? "none"}
                    onValueChange={(v) => field.onChange(v === "none" ? null : v)}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="ללא" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">ללא</SelectItem>
                      {companies.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="contact_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>איש קשר</FormLabel>
                  <Select
                    value={field.value ?? "none"}
                    onValueChange={(v) => field.onChange(v === "none" ? null : v)}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="ללא" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">ללא</SelectItem>
                      {contacts.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.first_name} {c.last_name ?? ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={create.isPending}>
                יצירה
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
