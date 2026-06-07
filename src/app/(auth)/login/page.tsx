"use client"

import Link from "next/link"
import { useTransition } from "react"
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
import { Separator } from "@/components/ui/separator"
import { signInAction } from "@/features/auth/actions"
import { GoogleButton } from "@/features/auth/components/google-button"
import { isGoogleOAuthEnabled } from "@/lib/env"
import { signInSchema, type SignInInput } from "@/lib/validations/auth"

export default function LoginPage() {
  const [isPending, startTransition] = useTransition()
  const form = useForm<SignInInput>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  })

  function onSubmit(values: SignInInput) {
    startTransition(async () => {
      const res = await signInAction(values)
      if (res && "error" in res) toast.error(res.error)
    })
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-xl">ברוכים השובים</CardTitle>
        <CardDescription>התחברו לחשבון BizOS שלכם</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
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
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel>סיסמה</FormLabel>
                    <Link
                      href="/forgot-password"
                      className="text-muted-foreground hover:text-foreground text-xs"
                    >
                      שכחתם סיסמה?
                    </Link>
                  </div>
                  <FormControl>
                    <Input
                      type="password"
                      autoComplete="current-password"
                      dir="ltr"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? "מתחבר…" : "התחברות"}
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
          אין לכם חשבון?{" "}
          <Link href="/signup" className="text-foreground font-medium hover:underline">
            הרשמה
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
