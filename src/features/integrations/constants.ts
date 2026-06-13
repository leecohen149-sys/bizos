/** Webhook event catalog (one created/updated pair per public resource). */
export const WEBHOOK_RESOURCES = [
  { key: "deal", label: "עסקה" },
  { key: "contact", label: "איש קשר" },
  { key: "company", label: "חברה" },
  { key: "task", label: "משימה" },
  { key: "project", label: "פרויקט" },
  { key: "activity", label: "פעילות" },
] as const

export const WEBHOOK_EVENTS: string[] = WEBHOOK_RESOURCES.flatMap((r) => [
  `${r.key}.created`,
  `${r.key}.updated`,
])

/**
 * Canonical API resource list (client-safe — no server imports). The API
 * scopes and the server-side resource registry both derive from this so the
 * scope catalog can be shared with client UI without pulling server-only code.
 */
export const API_RESOURCES = [
  { key: "deals", label: "עסקאות" },
  { key: "contacts", label: "אנשי קשר" },
  { key: "companies", label: "חברות" },
  { key: "tasks", label: "משימות" },
  { key: "projects", label: "פרויקטים" },
  { key: "activities", label: "פעילויות" },
] as const

/** ['*', 'deals:read', 'deals:write', ...] */
export const API_SCOPES: string[] = [
  "*",
  ...API_RESOURCES.flatMap((r) => [`${r.key}:read`, `${r.key}:write`]),
]
