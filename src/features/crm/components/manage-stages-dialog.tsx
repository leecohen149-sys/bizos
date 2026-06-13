"use client"

import { useState } from "react"
import { GripVertical, Plus, Settings2, Trash2 } from "lucide-react"
import { toast } from "sonner"
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { STAGE_COLORS, DEFAULT_STAGE_COLOR } from "@/lib/constants/domain"
import {
  useStages,
  useDeals,
  useCreateStage,
  useUpdateStage,
  useDeleteStage,
  useMoveDealsAndDeleteStage,
} from "@/features/crm/deals-hooks"
import type { CrmStage } from "@/lib/types"

function ColorDot({
  color,
  onChange,
}: {
  color: string
  onChange: (color: string) => void
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="צבע השלב"
          className="size-4 shrink-0 rounded-full border"
          style={{ backgroundColor: color }}
        />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-2">
        <div className="flex flex-wrap gap-1">
          {STAGE_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => onChange(c)}
              aria-label={c}
              className={cn(
                "size-5 rounded-full border-2",
                color === c ? "border-foreground" : "border-transparent"
              )}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}

function StageRow({
  stage,
  dealCount,
  canDelete,
  pipelineId,
  onRequestDelete,
}: {
  stage: CrmStage
  dealCount: number
  canDelete: boolean
  pipelineId: string
  onRequestDelete: (stage: CrmStage) => void
}) {
  const update = useUpdateStage(pipelineId)
  const del = useDeleteStage(pipelineId)
  const [name, setName] = useState(stage.name)
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: stage.id })

  function commitName() {
    const n = name.trim()
    if (!n || n === stage.name) {
      setName(stage.name)
      return
    }
    update.mutate(
      { id: stage.id, patch: { name: n } },
      { onError: () => toast.error("שינוי שם השלב נכשל") }
    )
  }

  function handleDelete() {
    if (dealCount > 0) {
      onRequestDelete(stage)
    } else {
      del.mutate(stage.id, { onError: () => toast.error("מחיקת השלב נכשלה") })
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn(
        "bg-card flex items-center gap-2 rounded-lg border p-2",
        isDragging && "opacity-50"
      )}
    >
      <button
        type="button"
        className="text-muted-foreground hover:text-foreground cursor-grab touch-none active:cursor-grabbing"
        aria-label="גרור לסידור מחדש"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4" />
      </button>
      <ColorDot
        color={stage.color}
        onChange={(color) =>
          update.mutate({ id: stage.id, patch: { color } })
        }
      />
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        onBlur={commitName}
        onKeyDown={(e) => {
          if (e.key === "Enter") (e.target as HTMLInputElement).blur()
        }}
        className="h-8 flex-1"
      />
      <span className="text-muted-foreground w-14 shrink-0 text-center text-xs">
        {dealCount} עסקאות
      </span>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="text-muted-foreground hover:text-destructive size-8 shrink-0"
        disabled={!canDelete}
        title={canDelete ? "מחק שלב" : "לא ניתן למחוק את השלב האחרון"}
        onClick={handleDelete}
      >
        <Trash2 className="size-4" />
      </Button>
    </div>
  )
}

function DeleteStageDialog({
  stage,
  stages,
  pipelineId,
  onClose,
}: {
  stage: CrmStage
  stages: CrmStage[]
  pipelineId: string
  onClose: () => void
}) {
  const moveAndDelete = useMoveDealsAndDeleteStage(pipelineId)
  const others = stages.filter((s) => s.id !== stage.id)
  const [targetId, setTargetId] = useState(others[0]?.id ?? "")

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>מחיקת השלב «{stage.name}»</DialogTitle>
        </DialogHeader>
        <p className="text-muted-foreground text-sm">
          לשלב זה יש עסקאות. בחר/י שלב יעד שאליו יועברו העסקאות לפני המחיקה.
        </p>
        <Select value={targetId} onValueChange={setTargetId}>
          <SelectTrigger>
            <SelectValue placeholder="בחר שלב יעד" />
          </SelectTrigger>
          <SelectContent>
            {others.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            ביטול
          </Button>
          <Button
            variant="destructive"
            disabled={!targetId || moveAndDelete.isPending}
            onClick={() =>
              moveAndDelete.mutate(
                { stageId: stage.id, targetId },
                {
                  onSuccess: onClose,
                  onError: () => toast.error("מחיקת השלב נכשלה"),
                }
              )
            }
          >
            העבר ומחק
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function ManageStagesDialog({ pipelineId }: { pipelineId: string }) {
  const { data: stages = [] } = useStages(pipelineId)
  const { data: deals = [] } = useDeals()
  const create = useCreateStage(pipelineId)
  const update = useUpdateStage(pipelineId)
  const [newName, setNewName] = useState("")
  const [pendingDelete, setPendingDelete] = useState<CrmStage | null>(null)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  const countFor = (stageId: string) =>
    deals.filter((d) => d.stage_id === stageId).length

  function addStage() {
    const n = newName.trim()
    if (!n) return
    create.mutate(
      { name: n, color: DEFAULT_STAGE_COLOR },
      {
        onSuccess: () => setNewName(""),
        onError: () => toast.error("הוספת השלב נכשלה"),
      }
    )
  }

  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e
    if (!over || active.id === over.id) return
    const ids = stages.map((s) => s.id)
    const from = ids.indexOf(String(active.id))
    const to = ids.indexOf(String(over.id))
    if (from < 0 || to < 0) return
    // Compute the dragged stage's new position as the midpoint of its new neighbors.
    const without = stages.filter((s) => s.id !== active.id)
    const before = without[to - 1]?.position ?? 0
    const after = without[to]?.position ?? before + 2000
    const position = (before + after) / 2
    update.mutate({ id: String(active.id), patch: { position } })
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Settings2 className="size-4" />
          ניהול שלבים
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>ניהול שלבי עסקאות</DialogTitle>
        </DialogHeader>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={onDragEnd}
        >
          <SortableContext
            items={stages.map((s) => s.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-1.5">
              {stages.map((stage) => (
                <StageRow
                  key={stage.id}
                  stage={stage}
                  dealCount={countFor(stage.id)}
                  canDelete={stages.length > 1}
                  pipelineId={pipelineId}
                  onRequestDelete={setPendingDelete}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        <div className="flex gap-1 border-t pt-3">
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addStage()}
            placeholder="שלב חדש…"
            className="h-9"
          />
          <Button
            size="icon"
            className="size-9 shrink-0"
            onClick={addStage}
            disabled={create.isPending}
          >
            <Plus className="size-4" />
          </Button>
        </div>
      </DialogContent>

      {pendingDelete && (
        <DeleteStageDialog
          stage={pendingDelete}
          stages={stages}
          pipelineId={pipelineId}
          onClose={() => setPendingDelete(null)}
        />
      )}
    </Dialog>
  )
}
