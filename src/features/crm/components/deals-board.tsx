"use client"

import { useState } from "react"
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  useDroppable,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import { formatCurrency } from "@/lib/format"
import {
  usePipeline,
  useStages,
  useDeals,
  useUpdateDeal,
  type DealWithRelations,
} from "@/features/crm/deals-hooks"
import type { CrmStage } from "@/lib/types"
import { DealCardContent } from "./deal-card"
import { CreateDealDialog } from "./create-deal-dialog"

function SortableDeal({
  deal,
  onOpen,
}: {
  deal: DealWithRelations
  onOpen?: (d: DealWithRelations) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: deal.id })
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn(
        "bg-card hover:border-primary/40 cursor-grab rounded-lg border p-3 shadow-sm active:cursor-grabbing",
        isDragging && "opacity-40"
      )}
      {...attributes}
      {...listeners}
      onClick={() => onOpen?.(deal)}
    >
      <DealCardContent deal={deal} />
    </div>
  )
}

function StageColumn({
  stage,
  deals,
  pipelineId,
  onOpen,
}: {
  stage: CrmStage
  deals: DealWithRelations[]
  pipelineId: string
  onOpen?: (d: DealWithRelations) => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `stage:${stage.id}` })
  const total = deals.reduce((sum, d) => sum + (d.value ?? 0), 0)

  return (
    <div className="flex w-72 shrink-0 flex-col">
      <div className="mb-2 flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span
            className="size-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: stage.color }}
          />
          <span className="text-sm font-medium">{stage.name}</span>
          <span className="text-muted-foreground text-xs">{deals.length}</span>
        </div>
        <span className="text-muted-foreground text-xs">{formatCurrency(total)}</span>
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          "bg-muted/40 flex min-h-24 flex-1 flex-col gap-2 rounded-lg p-2 transition-colors",
          isOver && "ring-primary/40 ring-2"
        )}
      >
        <SortableContext items={deals.map((d) => d.id)} strategy={verticalListSortingStrategy}>
          {deals.map((deal) => (
            <SortableDeal key={deal.id} deal={deal} onOpen={onOpen} />
          ))}
        </SortableContext>
        <CreateDealDialog pipelineId={pipelineId} stageId={stage.id} compact />
      </div>
    </div>
  )
}

export function DealsBoard({
  onOpen,
}: {
  onOpen?: (d: DealWithRelations) => void
}) {
  const { data: pipelineId } = usePipeline()
  const { data: stages = [] } = useStages(pipelineId)
  const { data: deals = [], isLoading } = useDeals()
  const update = useUpdateDeal()
  const [activeId, setActiveId] = useState<string | null>(null)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  if (isLoading || !pipelineId) {
    return (
      <div className="flex gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-64 w-72" />
        ))}
      </div>
    )
  }

  // Within each stage column, order deals chronologically — oldest at the top,
  // newest at the bottom. `created_at` is an ISO string so a string compare works.
  const byStage = (stageId: string) =>
    deals
      .filter((d) => d.stage_id === stageId)
      .sort((a, b) => a.created_at.localeCompare(b.created_at))

  const activeDeal = deals.find((d) => d.id === activeId) ?? null

  function onDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id))
  }

  function onDragEnd(e: DragEndEvent) {
    setActiveId(null)
    const { active, over } = e
    if (!over) return
    const deal = deals.find((d) => d.id === String(active.id))
    if (!deal) return

    const overId = String(over.id)
    let destStage: string
    let overDealId: string | null = null
    if (overId.startsWith("stage:")) {
      destStage = overId.slice(6)
    } else {
      overDealId = overId
      destStage = deals.find((d) => d.id === overId)?.stage_id ?? deal.stage_id
    }

    const column = byStage(destStage).filter((d) => d.id !== deal.id)
    const idx = overDealId
      ? Math.max(0, column.findIndex((d) => d.id === overDealId))
      : column.length
    const before = column[idx - 1]?.position ?? 0
    const after = column[idx]?.position ?? before + 2000
    const position = (before + after) / 2

    if (deal.stage_id === destStage && deal.position === position) return
    update.mutate({ id: deal.id, patch: { stage_id: destStage, position } })
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-2">
        {stages.map((stage) => (
          <StageColumn
            key={stage.id}
            stage={stage}
            deals={byStage(stage.id)}
            pipelineId={pipelineId}
            onOpen={onOpen}
          />
        ))}
      </div>
      <DragOverlay>
        {activeDeal && (
          <div className="bg-card w-72 rounded-lg border p-3 shadow-lg">
            <DealCardContent deal={activeDeal} />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}
