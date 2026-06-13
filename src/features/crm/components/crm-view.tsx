"use client"

import { useState } from "react"
import { useQueryState, parseAsStringLiteral } from "nuqs"
import { LayoutGrid, List } from "lucide-react"

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { usePipeline } from "@/features/crm/deals-hooks"
import { useCanManage } from "@/features/org/org-context"
import { DealsBoard } from "./deals-board"
import { DealsTable } from "./deals-table"
import { DealDetailSheet } from "./deal-detail-sheet"
import { CreateDealDialog } from "./create-deal-dialog"
import { ManageStagesDialog } from "./manage-stages-dialog"
import { ContactsView } from "./contacts-view"
import { CompaniesView } from "./companies-view"
import type { DealWithRelations } from "@/features/crm/deals-hooks"
import { useStages, useDeals, useDealsRealtime } from "@/features/crm/deals-hooks"

const TABS = ["deals", "contacts", "companies"] as const
const DEAL_VIEWS = ["kanban", "table"] as const

export function CrmView() {
  const [tab, setTab] = useQueryState(
    "tab",
    parseAsStringLiteral(TABS).withDefault("deals")
  )
  const [view, setView] = useQueryState(
    "view",
    parseAsStringLiteral(DEAL_VIEWS).withDefault("kanban")
  )
  useDealsRealtime()
  const { data: pipelineId } = usePipeline()
  const { data: stages = [] } = useStages(pipelineId)
  const { data: deals = [] } = useDeals()
  const canManage = useCanManage()
  const [selected, setSelected] = useState<DealWithRelations | null>(null)
  const [open, setOpen] = useState(false)

  const liveSelected = selected
    ? (deals.find((d) => d.id === selected.id) ?? selected)
    : null

  return (
    <Tabs value={tab} onValueChange={(v) => setTab(v as (typeof TABS)[number])}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <TabsList>
          <TabsTrigger value="deals">עסקאות</TabsTrigger>
          <TabsTrigger value="contacts">אנשי קשר</TabsTrigger>
          <TabsTrigger value="companies">חברות</TabsTrigger>
        </TabsList>
        {tab === "deals" && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <Button
                variant={view === "kanban" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setView("kanban")}
                aria-pressed={view === "kanban"}
              >
                <LayoutGrid className="size-4" />
                לוח
              </Button>
              <Button
                variant={view === "table" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setView("table")}
                aria-pressed={view === "table"}
              >
                <List className="size-4" />
                טבלה
              </Button>
            </div>
            {canManage && pipelineId && stages[0] && (
              <>
                <ManageStagesDialog pipelineId={pipelineId} />
                <CreateDealDialog pipelineId={pipelineId} stageId={stages[0].id} />
              </>
            )}
          </div>
        )}
      </div>

      <TabsContent
        value="deals"
        className={view === "kanban" ? "-mx-4 mt-4 px-4 md:-mx-6 md:px-6" : "mt-4"}
      >
        {view === "kanban" ? (
          <DealsBoard
            onOpen={(d) => {
              setSelected(d)
              setOpen(true)
            }}
          />
        ) : (
          <DealsTable
            onOpen={(d) => {
              setSelected(d)
              setOpen(true)
            }}
          />
        )}
        <DealDetailSheet deal={liveSelected} open={open} onOpenChange={setOpen} />
      </TabsContent>

      <TabsContent value="contacts" className="mt-4">
        <ContactsView />
      </TabsContent>

      <TabsContent value="companies" className="mt-4">
        <CompaniesView />
      </TabsContent>
    </Tabs>
  )
}
