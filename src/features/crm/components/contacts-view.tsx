"use client"

import { useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  Plus,
  Pencil,
  Trash2,
  Mail,
  Phone,
  Search,
  ArrowDownWideNarrow,
  ArrowDownAZ,
} from "lucide-react"
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  useContacts,
  useCreateContact,
  useUpdateContact,
  useDeleteContact,
  type ContactWithCompany,
} from "@/features/crm/contacts-hooks"
import { useCompanies } from "@/features/crm/companies-hooks"
import { useCanManage } from "@/features/org/org-context"
import { createContactSchema, type CreateContactInput } from "@/features/crm/validations"

type SortMode = "date" | "name"

export function ContactsView() {
  const { data: contacts = [], isLoading } = useContacts()
  const del = useDeleteContact()
  const canManage = useCanManage()
  const [query, setQuery] = useState("")
  const [sort, setSort] = useState<SortMode>("date")

  const fullName = (c: ContactWithCompany) => `${c.first_name} ${c.last_name ?? ""}`.trim()

  const visibleContacts = useMemo(() => {
    const q = query.trim().toLowerCase()
    const filtered = q
      ? contacts.filter((c) =>
          [c.first_name, c.last_name, c.email, c.phone, c.title, c.company?.name]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .includes(q)
        )
      : contacts
    const sorted = [...filtered]
    if (sort === "name") {
      sorted.sort((a, b) => fullName(a).localeCompare(fullName(b), "he"))
    } else {
      // Newest first; `created_at` is an ISO string so a string compare works.
      sorted.sort((a, b) => b.created_at.localeCompare(a.created_at))
    }
    return sorted
  }, [contacts, query, sort])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative max-w-xs flex-1">
          <Search className="text-muted-foreground absolute start-2.5 top-1/2 size-4 -translate-y-1/2" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="חיפוש אנשי קשר…"
            className="h-8 ps-8"
          />
        </div>
        <Button
          variant={sort === "date" ? "secondary" : "ghost"}
          size="sm"
          aria-pressed={sort === "date"}
          onClick={() => setSort("date")}
        >
          <ArrowDownWideNarrow className="size-4" />
          לפי תאריך
        </Button>
        <Button
          variant={sort === "name" ? "secondary" : "ghost"}
          size="sm"
          aria-pressed={sort === "name"}
          onClick={() => setSort("name")}
        >
          <ArrowDownAZ className="size-4" />
          לפי א-ב
        </Button>
        {canManage && (
          <ContactFormDialog
            trigger={
              <Button className="ms-auto">
                <Plus className="size-4" />
                איש קשר חדש
              </Button>
            }
          />
        )}
      </div>
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
      ) : visibleContacts.length === 0 ? (
        <div className="text-muted-foreground flex flex-col items-center gap-2 py-10 text-center text-sm">
          לא נמצאו תוצאות.
        </div>
      ) : (
        <div className="space-y-2">
          {visibleContacts.map((c) => {
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
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                      <ContactFormDialog
                        contact={c}
                        trigger={
                          <button
                            className="text-muted-foreground hover:text-foreground"
                            aria-label="עריכה"
                          >
                            <Pencil className="size-4" />
                          </button>
                        }
                      />
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <button
                            className="text-muted-foreground hover:text-destructive"
                            aria-label="מחיקה"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>מחיקת איש קשר</AlertDialogTitle>
                            <AlertDialogDescription>
                              האם למחוק את {name}? לא ניתן לבטל פעולה זו.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>ביטול</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-destructive text-white hover:bg-destructive/90"
                              onClick={() =>
                                del.mutate(c.id, {
                                  onError: () => toast.error("מחיקה נכשלה"),
                                })
                              }
                            >
                              מחיקה
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
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

function ContactFormDialog({
  contact,
  trigger,
}: {
  contact?: ContactWithCompany
  trigger: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const create = useCreateContact()
  const update = useUpdateContact()
  const { data: companies = [] } = useCompanies()
  const isEdit = !!contact
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

  // Reset the form to the editing contact (or blank) whenever the dialog opens.
  function onOpenChange(next: boolean) {
    if (next) {
      form.reset({
        first_name: contact?.first_name ?? "",
        last_name: contact?.last_name ?? "",
        email: contact?.email ?? "",
        phone: contact?.phone ?? "",
        title: contact?.title ?? "",
        company_id: contact?.company_id ?? null,
      })
    }
    setOpen(next)
  }

  function onSubmit(values: CreateContactInput) {
    const payload = { ...values, email: values.email || null }
    if (isEdit) {
      update.mutate(
        { id: contact.id, ...payload },
        {
          onSuccess: () => {
            toast.success("איש הקשר עודכן")
            setOpen(false)
          },
          onError: () => toast.error("עדכון נכשל"),
        }
      )
    } else {
      create.mutate(payload, {
        onSuccess: () => {
          toast.success("איש הקשר נוסף")
          setOpen(false)
          form.reset()
        },
        onError: () => toast.error("יצירה נכשלה"),
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "עריכת איש קשר" : "איש קשר חדש"}</DialogTitle>
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
              <Button type="submit" disabled={create.isPending || update.isPending}>
                {isEdit ? "שמירה" : "יצירה"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
