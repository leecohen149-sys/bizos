"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Plus } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { cn } from "@/lib/utils"
import { useCreateProject } from "@/features/projects/hooks"
import {
  createProjectSchema,
  PROJECT_COLORS,
  type CreateProjectInput,
} from "@/features/projects/validations"

export function CreateProjectDialog() {
  const [open, setOpen] = useState(false)
  const create = useCreateProject()
  const form = useForm<CreateProjectInput>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: { name: "", description: "", color: "#6366f1", status: "active" },
  })

  function onSubmit(values: CreateProjectInput) {
    create.mutate(values, {
      onSuccess: () => {
        toast.success("הפרויקט נוצר")
        setOpen(false)
        form.reset()
      },
      onError: () => toast.error("יצירת הפרויקט נכשלה"),
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" />
          פרויקט חדש
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>פרויקט חדש</DialogTitle>
          <DialogDescription>ארגנו משימות תחת פרויקט משותף.</DialogDescription>
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
                    <Input autoFocus placeholder="לדוגמה: אתר חדש" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>תיאור (אופציונלי)</FormLabel>
                  <FormControl>
                    <Textarea rows={2} {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>צבע</FormLabel>
                  <div className="flex flex-wrap gap-2">
                    {PROJECT_COLORS.map((c) => (
                      <button
                        type="button"
                        key={c}
                        onClick={() => field.onChange(c)}
                        aria-label={c}
                        className={cn(
                          "size-7 rounded-full border-2 transition-transform",
                          field.value === c
                            ? "border-foreground scale-110"
                            : "border-transparent"
                        )}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={create.isPending}>
                {create.isPending ? "יוצר…" : "יצירה"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
