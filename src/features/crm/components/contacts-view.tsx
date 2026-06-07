"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Plus, Trash2, Mail, Phone } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
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
import {
  useContacts,
  useCreateContact,
  useDeleteContact,
} from "@/features/crm/contacts-hooks"
import { useCompanies } from "@/features/crm/companies-hooks"
import { useCanManage } from "@/features/org/org-context"
import { createContactSchema, type CreateContactInput } from "@/features/crm/validations"

export function ContactsView() {
  const { data: contacts = [], isLoading } = useContacts()
  const del = useDeleteContact()
  const canManage = useCanManage()

  return (
    <div className="space-y-4">
      <div className="flex justify-end">{canManage && <CreateContactDialog />}</div>
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : contacts.length === 0 ? (
        <div className="text-muted-foreground flex flex-col items-center gap-2 py-10 text-center text-sm">
          אין אנשי קשר עדיין.
        </div>
      ) : (
        <div className="space-y-2">
          {contacts.map((c) => {
            const name = `${c.first_name} ${c.last_name ?? ""}`.trim()
            return (
              <Card key={c.id} className="group">
                <CardContent className="flex items-center gap-3 py-3">
                  <Avatar className="size-9">
                    <AvatarFallback>{name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{name}</p>
                    <div className="text-muted-foreground flex flex-wrap gap-x-3 text-xs">
                      {c.title && <span>{c.title}</span>}
                      {c.company && <span>{c.company.name}</span>}
                      {c.email && (
                        <span className="flex items-center gap-1" dir="ltr">
                          <Mail className="size-3" />
                          {c.email}
                        </span>
                      )}
                      {c.phone && (
                        <span className="flex items-center gap-1" dir="ltr">
                          <Phone className="size-3" />
                          {c.phone}
                        </span>
                      )}
                    </div>
                  </div>
                  {canManage && (
                    <button
                      onClick={() => del.mutate(c.id, { onError: () => toast.error("מחיקה נכשלה") })}
                      className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100"
                      aria-label="מחיקה"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

function CreateContactDialog() {
  const [open, setOpen] = useState(false)
  const create = useCreateContact()
  const { data: companies = [] } = useCompanies()
  const form = useForm<CreateContactInput>({
    resolver: zodResolver(createContactSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      title: "",
      company_id: null,
    },
  })

  function onSubmit(values: CreateContactInput) {
    create.mutate(
      { ...values, email: values.email || null },
      {
        onSuccess: () => {
          toast.success("איש הקשר נוסף")
          setOpen(false)
          form.reset()
        },
        onError: () => toast.error("יצירה נכשלה"),
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" />
          איש קשר חדש
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>איש קשר חדש</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="first_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>שם פרטי</FormLabel>
                    <FormControl>
                      <Input autoFocus {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="last_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>שם משפחה</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ""} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>אימייל</FormLabel>
                    <FormControl>
                      <Input type="email" dir="ltr" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>טלפון</FormLabel>
                    <FormControl>
                      <Input dir="ltr" {...field} value={field.value ?? ""} />
                    </FormControl>
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
