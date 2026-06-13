import type { Notification } from "@/lib/types"

/** Where clicking a notification should navigate, based on its linked entity. */
export function notificationHref(n: Notification): string {
  switch (n.entity_type) {
    case "task":
      return "/tasks"
    case "deal":
    case "contact": // new leads from automations
      return "/crm"
    default:
      return "/"
  }
}
