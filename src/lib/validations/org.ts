import { z } from "zod"

import { ORG_ROLES } from "@/lib/constants/domain"

export const createOrgSchema = z.object({
  name: z.string().min(2, "שם העסק חייב לכלול לפחות 2 תווים").max(80),
})
export type CreateOrgInput = z.infer<typeof createOrgSchema>

export const inviteMemberSchema = z.object({
  email: z.string().min(1, "נא להזין אימייל").email("אימייל לא תקין"),
  role: z.enum(ORG_ROLES),
})
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>
