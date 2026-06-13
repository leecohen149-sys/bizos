"use client"

import { Trash2, Trophy, XCircle } from "lucide-react"
import { toast } from "sonner"

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Separator } from "@/components/ui/separator"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { formatCurrency } from "@/lib/format"
import { cn } from "@/lib/utils"
import {
  useStages,
  usePipeline,
  useUpdateDeal,
  useDeleteDeal,
  type DealWithRelations,
} from "@/features/crm/deals-hooks"
import { ActivityFeed } from "./activity-feed"

export function DealDetailSheet({
  deal,
  open,
  onOpenChange,
}: {
  deal: DealWithRelations | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { data: pipelineId } = usePipeline()
  const { data: stages = [] } = useStages(pipelineId)
  const update = useUpdateDeal()
  const del = useDeleteDeal()

  if (!deal) return null
  const contactName = deal.contact
    ? `${deal.contact.first_name} ${deal.contact.last_name ?? ""}`.trim()
    : null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{deal.title}</SheetTitle>
        </SheetHeader>

        <div className="space-y-3 px-4 py-2 text-sm">
          <div className="text-2xl font-semibold">
            {formatCurrency(deal.value, deal.currency)}
          </div>

          <div className="grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-2">
            <span className="text-muted-foreground">שלב</span>
            <Select
              value={deal.stage_id}
              onValueChange={(stage_id) => update.mutate({ id: deal.id, patch: { stage_id } })}
            >
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {stages.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <span className="text-muted-foreground">סטטוס</span>
            <span
              className={cn(
                "font-medium",
                deal.status === "won" && "text-status-done",
                deal.status === "lost" && "text-status-blocked"
              )}
            >
              {deal.status === "won" ? "נסגרה בזכייה" : deal.status === "lost" ? "אבודה" : "פתוחה"}
            </span>

            {deal.company && (
              <>
                <span className="text-muted-foreground">חברה</span>
                <span>{deal.company.name}</span>
              </>
            )}
            {contactName && (
              <>
                <span className="text-muted-foreground">איש קשר</span>
                <span>{contactName}</span>
              </>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => update.mutate({ id: deal.id, patch: { status: "won" } })}
            >
              <Trophy className="text-status-done size-4" />
              זכייה
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => update.mutate({ id: deal.id, patch: { status: "lost" } })}
            >
              <XCircle className="text-status-blocked size-4" />
              אבודה
            </Button>
          </div>
        </div>

        <Separator className="my-3" />
        <div className="space-y-2 px-4">
          <Label className="text-muted-foreground text-xs">פעילות</Label>
          <ActivityFeed dealId={deal.id} />
        </div>

        <div className="mt-auto flex justify-end p-4">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Trash2 className="size-4" />
                מחיקת עסקה
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>מחיקת עסקה</AlertDialogTitle>
                <AlertDialogDescription>
                  האם למחוק את {deal.title}? לא ניתן לבטל פעולה זו.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>ביטול</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-white hover:bg-destructive/90"
                  onClick={() => {
                    del.mutate(deal.id, {
                      onError: () => toast.error("מחיקה נכשלה"),
                    })
                    onOpenChange(false)
                  }}
                >
                  מחיקה
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </SheetContent>
    </Sheet>
  )
}
