import { z } from "zod"

import { WEBHOOK_EVENTS, API_SCOPES } from "./constants"

export const createApiKeySchema = z.object({
  name: z.string().trim().min(1, "נא להזין שם").max(80),
  scopes: z
    .array(z.enum(API_SCOPES as [string, ...string[]]))
    .min(1, "בחרו לפחות הרשאה אחת"),
})
export type CreateApiKeyInput = z.infer<typeof createApiKeySchema>

export const createWebhookSchema = z.object({
  url: z.string().url("כתובת לא תקינה").startsWith("https://", "נדרש HTTPS"),
  events: z
    .array(z.enum(WEBHOOK_EVENTS as [string, ...string[]]))
    .min(1, "בחרו לפחות אירוע אחד"),
  description: z.string().max(200).optional().nullable(),
})
export type CreateWebhookInput = z.infer<typeof createWebhookSchema>
