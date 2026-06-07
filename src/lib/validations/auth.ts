import { z } from "zod"

export const emailSchema = z
  .string()
  .min(1, "נא להזין אימייל")
  .email("כתובת אימייל לא תקינה")

export const passwordSchema = z
  .string()
  .min(8, "הסיסמה חייבת לכלול לפחות 8 תווים")

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "נא להזין סיסמה"),
})
export type SignInInput = z.infer<typeof signInSchema>

export const signUpSchema = z.object({
  fullName: z.string().min(2, "נא להזין שם מלא"),
  email: emailSchema,
  password: passwordSchema,
})
export type SignUpInput = z.infer<typeof signUpSchema>

export const forgotPasswordSchema = z.object({ email: emailSchema })
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>
