"use client"

import { useState } from "react"
import { Filter, X, Bookmark, Check, Search } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  TASK_STATUSES,
  TASK_STATUS_LABELS,
  TASK_PRIORITIES,
  TASK_PRIORITY_LABELS,
} from "@/lib/constants/domain"
import { useOrg } from "@/features/org/org-context"
import { useLabels } from "@/features/labels/hooks"
import { useTaskFilters, isFilterActive, type TaskFilters } from "@/features/tasks/filters"
import { useSavedViews } from "@/features/tasks/saved-views"

export function TaskFilterBar({ storageKey }: { storageKey: string }) {
  const { members } = useOrg()
  const { data: labels = [] } = useLabels()
  const [filters, setFilters] = useTaskFilters()
  const { views, saveView, deleteView } = useSavedViews(storageKey)
  const active = isFilterActive(filters as TaskFilters)

  function toggleArray<T extends string>(arr: T[], value: T): T[] {
    return arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value]
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative max-w-xs flex-1">
        <Search className="text-muted-foreground absolute start-2.5 top-1/2 size-4 -translate-y-1/2" />
        <Input
          value={filters.q}
          onChange={(e) => setFilters({ q: e.target.value || null })}
          placeholder="חיפוש משימות…"
          className="h-8 ps-8"
        />
      </div>

      {/* Status */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1.5">
            <Filter className="size-3.5" />
            סטטוס
            {filters.status.length > 0 && (
              <Badge variant="secondary" className="ms-1">{filters.status.length}</Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {TASK_STATUSES.map((s) => (
            <DropdownMenuCheckboxItem
              key={s}
              checked={filters.status.includes(s)}
              onCheckedChange={() =>
                setFilters({ status: toggleArray(filters.status, s) })
              }
            >
              {TASK_STATUS_LABELS[s]}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Priority */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1.5">
            עדיפות
            {filters.priority.length > 0 && (
              <Badge variant="secondary" className="ms-1">{filters.priority.length}</Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {TASK_PRIORITIES.map((p) => (
            <DropdownMenuCheckboxItem
              key={p}
              checked={filters.priority.includes(p)}
              onCheckedChange={() =>
                setFilters({ priority: toggleArray(filters.priority, p) })
              }
            >
              {TASK_PRIORITY_LABELS[p]}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Assignee */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            {filters.assignee
              ? (members.find((m) => m.user_id === filters.assignee)?.full_name ?? "אחראי")
              : "אחראי"}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="max-h-72 overflow-auto">
          <DropdownMenuItem onClick={() => setFilters({ assignee: null })}>
            הכל
            {!filters.assignee && <Check className="ms-auto size-4" />}
          </DropdownMenuItem>
          {members.map((m) => (
            <DropdownMenuItem
              key={m.user_id}
              onClick={() => setFilters({ assignee: m.user_id })}
            >
              {m.full_name ?? "משתמש"}
              {filters.assignee === m.user_id && <Check className="ms-auto size-4" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Label */}
      {labels.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              {filters.label
                ? (labels.find((l) => l.id === filters.label)?.name ?? "תווית")
                : "תווית"}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="max-h-72 overflow-auto">
            <DropdownMenuItem onClick={() => setFilters({ label: null })}>
              הכל
            </DropdownMenuItem>
            {labels.map((l) => (
              <DropdownMenuItem key={l.id} onClick={() => setFilters({ label: l.id })}>
                <span className="size-2.5 rounded-full" style={{ backgroundColor: l.color }} />
                {l.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {active && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() =>
            setFilters({ status: null, priority: null, assignee: null, label: null, q: null })
          }
        >
          <X className="size-3.5" />
          ניקוי
        </Button>
      )}

      {/* Saved views */}
      <div className="ms-auto">
        <SavedViewsMenu
          views={views}
          onApply={(f) => setFilters(f)}
          onSave={(name) => saveView(name, filters as TaskFilters)}
          onDelete={deleteView}
          canSave={active}
        />
      </div>
    </div>
  )
}

function SavedViewsMenu({
  views,
  onApply,
  onSave,
  onDelete,
  canSave,
}: {
  views: { name: string; filters: TaskFilters }[]
  onApply: (f: TaskFilters) => void
  onSave: (name: string) => void
  onDelete: (name: string) => void
  canSave: boolean
}) {
  const [naming, setNaming] = useState(false)
  const [name, setName] = useState("")

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Bookmark className="size-3.5" />
          תצוגות
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="text-xs">תצוגות שמורות</DropdownMenuLabel>
        {views.length === 0 && (
          <p className="text-muted-foreground px-2 py-1 text-xs">אין תצוגות שמורות.</p>
        )}
        {views.map((v) => (
          <DropdownMenuItem
            key={v.name}
            onClick={() => onApply(v.filters)}
            className="group/v justify-between"
          >
            <span className="truncate">{v.name}</span>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onDelete(v.name)
              }}
              className="opacity-0 group-hover/v:opacity-100"
              aria-label="מחיקת תצוגה"
            >
              <X className="size-3.5" />
            </button>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        {naming ? (
          <div className="flex gap-1 p-1">
            <Input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && name.trim()) {
                  onSave(name.trim())
                  setName("")
                  setNaming(false)
                }
              }}
              placeholder="שם התצוגה…"
              className="h-7"
            />
          </div>
        ) : (
          <DropdownMenuItem
            disabled={!canSave}
            onSelect={(e) => {
              e.preventDefault()
              setNaming(true)
            }}
          >
            <Bookmark className="size-3.5" />
            שמירת התצוגה הנוכחית
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
