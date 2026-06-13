"use client"

import { Skeleton } from "@/components/ui/skeleton"
import { formatCurrency } from "@/lib/format"
import { cn } from "@/lib/utils"
import {
  usePipeline,
  useStages,
  useDeals,
  type DealWithRelations,
} from "@/features/crm/deals-hooks"

const STATUS_LABELS = { open: "פתוחה", won: "נסגרה בזכייה", lost: "אבודה" } as const

export function DealsTable({
  onOpen,
}: {
  onOpen?: (d: DealWithRelations) => void
}) {
  const { data: pipelineId } = usePipeline()
  const { data: stages = [] } = useStages(pipelineId)
  const { data: deals = [], isLoading } = useDeals()

  if (isLoading || !pipelineId) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    )
  }

  if (deals.length === 0) {
    return (
      <div className="text-muted-foreground flex flex-col items-center gap-2 py-10 text-center text-sm">
        אין עסקאות עדיין.
      </div>
    )
  }

  const stageById = new Map(stages.map((s) => [s.id, s]))
  const sorted = [...deals].sort((a, b) => {
    const sa = stageById.get(a.stage_id)?.position ?? 0
    const sb = stageById.get(b.stage_id)?.position ?? 0
    return sa - sb || a.position - b.position
  })

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-muted-foreground text-xs">
          <tr>
            <th className="px-3 py-2 text-start font-medium">עסקה</th>
            <th className="px-3 py-2 text-start font-medium">שלב</th>
            <th className="px-3 py-2 text-start font-medium">סכום</th>
            <th className="px-3 py-2 text-start font-medium">איש קשר</th>
            <th className="px-3 py-2 text-start font-medium">חברה</th>
            <th className="px-3 py-2 text-start font-medium">סטטוס</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((deal) => {
            const stage = stageById.get(deal.stage_id)
            const contactName = deal.contact
              ? `${deal.contact.first_name} ${deal.contact.last_name ?? ""}`.trim()
              : null
            return (
              <tr
                key={deal.id}
                onClick={() => onOpen?.(deal)}
                className="hover:bg-muted/40 cursor-pointer border-t"
              >
                <td className="px-3 py-2 font-medium">{deal.title}</td>
                <td className="px-3 py-2">
                  {stage && (
                    <span className="flex items-center gap-1.5">
                      <span
                        className="size-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: stage.color }}
                      />
                      {stage.name}
                    </span>
                  )}
                </td>
                <td
                  className={cn(
                    "px-3 py-2 font-semibold",
                    deal.status === "won"
                      ? "text-status-done"
                      : deal.status === "lost"
                        ? "text-muted-foreground line-through"
                        : "text-foreground"
                  )}
                >
                  {formatCurrency(deal.value, deal.currency)}
                </td>
                <td className="text-muted-foreground px-3 py-2">{contactName ?? "—"}</td>
                <td className="text-muted-foreground px-3 py-2">
                  {deal.company?.name ?? "—"}
                </td>
                <td className="px-3 py-2">
                  <span
                    className={cn(
                      deal.status === "won" && "text-status-done",
                      deal.status === "lost" && "text-status-blocked"
                    )}
                  >
                    {STATUS_LABELS[deal.status as keyof typeof STATUS_LABELS] ?? "פתוחה"}
                  </span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
