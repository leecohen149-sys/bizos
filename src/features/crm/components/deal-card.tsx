"use client"

import { Building2, User } from "lucide-react"

import { cn } from "@/lib/utils"
import { formatCurrency } from "@/lib/format"
import type { DealWithRelations } from "@/features/crm/deals-hooks"

export function DealCardContent({ deal }: { deal: DealWithRelations }) {
  const contactName = deal.contact
    ? `${deal.contact.first_name} ${deal.contact.last_name ?? ""}`.trim()
    : null
  return (
    <div className="space-y-1.5">
      <p className="text-sm leading-snug font-medium">{deal.title}</p>
      <p
        className={cn(
          "text-sm font-semibold",
          deal.status === "won"
            ? "text-status-done"
            : deal.status === "lost"
              ? "text-muted-foreground line-through"
              : "text-foreground"
        )}
      >
        {formatCurrency(deal.value, deal.currency)}
      </p>
      {(deal.company || contactName) && (
        <div className="text-muted-foreground space-y-0.5 text-xs">
          {deal.company && (
            <span className="flex items-center gap-1">
              <Building2 className="size-3" />
              {deal.company.name}
            </span>
          )}
          {contactName && (
            <span className="flex items-center gap-1">
              <User className="size-3" />
              {contactName}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
