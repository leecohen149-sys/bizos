import { z } from "zod"

export const createCompanySchema = z.object({
  name: z.string().trim().min(1, "נא להזין שם חברה").max(160),
  domain: z.string().max(160).optional().nullable(),
  industry: z.string().max(120).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
})
export type CreateCompanyInput = z.infer<typeof createCompanySchema>

export const createContactSchema = z.object({
  first_name: z.string().trim().min(1, "נא להזין שם פרטי").max(80),
  last_name: z.string().max(80).optional().nullable(),
  email: z.string().email("אימייל לא תקין").optional().or(z.literal("")).nullable(),
  phone: z.string().max(40).optional().nullable(),
  title: z.string().max(120).optional().nullable(),
  company_id: z.string().uuid().optional().nullable(),
})
export type CreateContactInput = z.infer<typeof createContactSchema>

export const createDealSchema = z.object({
  title: z.string().trim().min(1, "נא להזין כותרת").max(160),
  value: z.number().min(0),
  stage_id: z.string().uuid(),
  contact_id: z.string().uuid().optional().nullable(),
  company_id: z.string().uuid().optional().nullable(),
  expected_close_date: z.string().optional().nullable(),
})
export type CreateDealInput = z.infer<typeof createDealSchema>

export const ACTIVITY_TYPES = ["call", "meeting", "email", "note", "task"] as const
export const ACTIVITY_TYPE_LABELS: Record<(typeof ACTIVITY_TYPES)[number], string> = {
  call: "שיחה",
  meeting: "פגישה",
  email: "אימייל",
  note: "הערה",
  task: "משימה",
}
