"use client"

import Link from "next/link"
import { useState, useTransition } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { MailCheck } from "lucide-react"

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
import { Separator } from "@/components/ui/separator"
import { signUpAction } from "@/features/auth/actions"
import { GoogleButton } from "@/features/auth/components/google-button"
import { isGoogleOAuthEnabled } from "@/lib/env"
import { signUpSchema, type SignUpInput } from "@/lib/validations/auth"
import { withSkewRecovery } from "@/lib/actions/with-skew-recovery"

export function SignupForm({ redirectTo }: { redirectTo: string | null }) {
  const [isPending, startTransition] = useTransition()
  const [sentTo, setSentTo] = useState<string | null>(null)
  const form = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { fullName: "", email: "", password: "" },
  })

  const loginHref = redirectTo
    ? `/login?redirectedFrom=${encodeURIComponent(redirectTo)}`
    : "/login"

  function onSubmit(values: SignUpInput) {
    startTransition(async () => {
      const res = await withSkewRecovery(() =>
        signUpAction(values, redirectTo ?? undefined)
      )
      if (res && "error" in res) {
        toast.error(res.error)
      } else if (res && "message" in res) {
        setSentTo(values.email)
      }
    })
  }

  if (sentTo) {
    return (
      <Card>
        <CardHeader className="items-center text-center">
          <MailCheck className="text-primary mb-2 size-10" />
          <CardTitle className="text-xl">בדקו את האימייל</CardTitle>
          <CardDescription>
            שלחנו קישור אישור אל <span dir="ltr">{sentTo}</span>. לחצו עליו כדי
            להמשיך.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline" className="w-full">
            <Link href={loginHref}>חזרה להתחברות</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-xl">יצירת חשבון</CardTitle>
        <CardDescription>התחילו לנהל את העסק שלכם ב‑BizOS</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>שם מלא</FormLabel>
                  <FormControl>
                    <Input autoComplete="name" placeholder="ישראל ישראלי" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>סיסמה</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      autoComplete="new-password"
                      dir="ltr"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? "יוצר חשבון…" : "הרשמה"}
            </Button>
          </form>
        </Form>

        {isGoogleOAuthEnabled && (
          <>
            <div className="flex items-center gap-3">
              <Separator className="flex-1" />
              <span className="text-muted-foreground text-xs">או</span>
              <Separator className="flex-1" />
            </div>
            <GoogleButton />
          </>
        )}

        <p className="text-muted-foreground text-center text-sm">
          כבר יש לכם חשבון?{" "}
          <Link href={loginHref} className="text-foreground font-medium hover:underline">
            התחברות
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
