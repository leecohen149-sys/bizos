"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Building2, Plus, Trash2, Globe } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
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
  useCompanies,
  useCreateCompany,
  useDeleteCompany,
} from "@/features/crm/companies-hooks"
import { useCanManage } from "@/features/org/org-context"
import { createCompanySchema, type CreateCompanyInput } from "@/features/crm/validations"

export function CompaniesView() {
  const { data: companies = [], isLoading } = useCompanies()
  const del = useDeleteCompany()
  const canManage = useCanManage()

  return (
    <div className="space-y-4">
      <div className="flex justify-end">{canManage && <CreateCompanyDialog />}</div>
      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : companies.length === 0 ? (
        <Empty />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {companies.map((c) => (
            <Card key={c.id} className="group relative">
              <CardContent className="flex items-start gap-3 py-4">
                <span className="bg-muted grid size-10 place-items-center rounded-lg">
                  <Building2 className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{c.name}</p>
                  {c.industry && (
                    <p className="text-muted-foreground text-xs">{c.industry}</p>
                  )}
                  {c.domain && (
                    <p className="text-muted-foreground flex items-center gap-1 text-xs" dir="ltr">
                      <Globe className="size-3" />
                      {c.domain}
                    </p>
                  )}
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
          ))}
        </div>
      )}
    </div>
  )
}

function Empty() {
  return (
    <div className="text-muted-foreground flex flex-col items-center gap-2 py-10 text-center text-sm">
      <Building2 className="size-8 opacity-50" />
      אין חברות עדיין.
    </div>
  )
}

function CreateCompanyDialog() {
  const [open, setOpen] = useState(false)
  const create = useCreateCompany()
  const form = useForm<CreateCompanyInput>({
    resolver: zodResolver(createCompanySchema),
    defaultValues: { name: "", domain: "", industry: "", notes: "" },
  })

  function onSubmit(values: CreateCompanyInput) {
    create.mutate(values, {
      onSuccess: () => {
        toast.success("החברה נוספה")
        setOpen(false)
        form.reset()
      },
      onError: () => toast.error("יצירה נכשלה"),
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" />
          חברה חדשה
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>חברה חדשה</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>שם</FormLabel>
                  <FormControl>
                    <Input autoFocus {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="domain"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>דומיין</FormLabel>
                    <FormControl>
                      <Input dir="ltr" placeholder="example.com" {...field} value={field.value ?? ""} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="industry"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>תחום</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ""} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
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
