"use client"

import Link from "next/link"
import { useState, useTransition } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"

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
import { forgotPasswordAction } from "@/features/auth/actions"
import { withSkewRecovery } from "@/lib/actions/with-skew-recovery"
import {
  forgotPasswordSchema,
  type ForgotPasswordInput,
} from "@/lib/validations/auth"

export default function ForgotPasswordPage() {
  const [isPending, startTransition] = useTransition()
  const [done, setDone] = useState(false)
  const form = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  })

  function onSubmit(values: ForgotPasswordInput) {
    startTransition(async () => {
      const res = await withSkewRecovery(() => forgotPasswordAction(values))
      if (res && "error" in res) toast.error(res.error)
      else setDone(true)
    })
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-xl">איפוס סיסמה</CardTitle>
        <CardDescription>
          {done
            ? "אם הכתובת קיימת במערכת, נשלח אליה קישור לאיפוס."
            : "הזינו את האימייל ונשלח לכם קישור לאיפוס."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!done && (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>אימייל</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        inputMode="email"
                        autoComplete="email"
                        dir="ltr"
                        placeholder="you@example.com"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? "שולח…" : "שליחת קישור"}
              </Button>
            </form>
          </Form>
        )}
        <p className="text-muted-foreground text-center text-sm">
          <Link href="/login" className="text-foreground font-medium hover:underline">
            חזרה להתחברות
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
