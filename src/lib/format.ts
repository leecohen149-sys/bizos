import { format, isToday, isTomorrow, isYesterday, isPast } from "date-fns"
import { he } from "date-fns/locale"

export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return ""
  const d = typeof value === "string" ? new Date(value) : value
  if (isToday(d)) return "היום"
  if (isTomorrow(d)) return "מחר"
  if (isYesterday(d)) return "אתמול"
  return format(d, "d בMMM", { locale: he })
}

export function formatDateLong(value: string | Date | null | undefined): string {
  if (!value) return ""
  const d = typeof value === "string" ? new Date(value) : value
  return format(d, "EEEE, d בMMMM yyyy", { locale: he })
}

export function formatTime(value: string | Date | null | undefined): string {
  if (!value) return ""
  const d = typeof value === "string" ? new Date(value) : value
  return format(d, "HH:mm", { locale: he })
}

/** True if a due date is in the past (and not today). */
export function isOverdue(value: string | null | undefined): boolean {
  if (!value) return false
  const d = new Date(value)
  return isPast(d) && !isToday(d)
}

const currencyFmt = new Intl.NumberFormat("he-IL", {
  style: "currency",
  currency: "ILS",
  maximumFractionDigits: 0,
})

export function formatCurrency(value: number, currency = "ILS"): string {
  if (currency === "ILS") return currencyFmt.format(value)
  return new Intl.NumberFormat("he-IL", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value)
}
