"use server"

import { redirect } from "next/navigation"
import { headers } from "next/headers"

import { createClient } from "@/lib/supabase/server"
import { publicEnv } from "@/lib/env"
import {
  signInSchema,
  signUpSchema,
  forgotPasswordSchema,
} from "@/lib/validations/auth"

export type ActionResult = { error: string } | { ok: true; message?: string }

async function appOrigin() {
  // Prefer the configured app URL; fall back to the request origin.
  if (publicEnv.NEXT_PUBLIC_APP_URL) return publicEnv.NEXT_PUBLIC_APP_URL
  const h = await headers()
  return `${h.get("x-forwarded-proto") ?? "https"}://${h.get("host")}`
}

export async function signInAction(
  values: unknown
): Promise<ActionResult> {
  const parsed = signInSchema.safeParse(values)
  if (!parsed.success) return { error: "פרטי ההתחברות אינם תקינים" }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword(parsed.data)
  if (error) return { error: "אימייל או סיסמה שגויים" }

  redirect("/")
}

export async function signUpAction(
  values: unknown
): Promise<ActionResult> {
  const parsed = signUpSchema.safeParse(values)
  if (!parsed.success) return { error: "פרטי ההרשמה אינם תקינים" }

  const supabase = await createClient()
  const origin = await appOrigin()
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.fullName },
      emailRedirectTo: `${origin}/auth/callback?next=/onboarding`,
    },
  })
  if (error) {
    if (error.message.toLowerCase().includes("registered")) {
      return { error: "כתובת האימייל כבר רשומה במערכת" }
    }
    return { error: "ההרשמה נכשלה, נסו שוב" }
  }

  // If email confirmation is OFF, a session is returned → go straight in.
  if (data.session) redirect("/onboarding")

  return {
    ok: true,
    message: "שלחנו לך אימייל לאישור הכתובת. בדקו את תיבת הדואר.",
  }
}

export async function forgotPasswordAction(
  values: unknown
): Promise<ActionResult> {
  const parsed = forgotPasswordSchema.safeParse(values)
  if (!parsed.success) return { error: "כתובת אימייל לא תקינה" }

  const supabase = await createClient()
  const origin = await appOrigin()
  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${origin}/auth/callback?next=/`,
  })
  // Always succeed (don't reveal whether the email exists).
  return { ok: true, message: "אם הכתובת קיימת, נשלח אליה קישור לאיפוס." }
}

export async function signOutAction(): Promise<void> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/login")
}

/** Google OAuth (infrastructure ready; enabled via env when creds exist). */
export async function signInWithGoogleAction(): Promise<ActionResult> {
  const supabase = await createClient()
  const origin = await appOrigin()
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${origin}/auth/callback?next=/` },
  })
  if (error || !data.url) return { error: "התחברות עם Google נכשלה" }
  redirect(data.url)
}
