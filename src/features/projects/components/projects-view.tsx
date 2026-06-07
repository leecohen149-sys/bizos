"use client"

import Link from "next/link"
import { FolderKanban, Inbox, MoreHorizontal, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { PROJECT_STATUSES } from "@/lib/constants/domain"
import { useProjects, useDeleteProject } from "@/features/projects/hooks"
import { useCanManage } from "@/features/org/org-context"
import { CreateProjectDialog } from "./create-project-dialog"

const STATUS_LABEL: Record<(typeof PROJECT_STATUSES)[number], string> = {
  active: "פעיל",
  on_hold: "בהמתנה",
  completed: "הושלם",
  archived: "בארכיון",
}

export function ProjectsView() {
  const { data: projects = [], isLoading } = useProjects()
  const del = useDeleteProject()
  const canManage = useCanManage()

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">פרויקטים</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            ארגנו את העבודה בפרויקטים, או עבדו ב‑Inbox ללא פרויקט.
          </p>
        </div>
        {canManage && <CreateProjectDialog />}
      </div>

      <Link href="/projects/inbox" className="block">
        <Card className="hover:border-primary/40 transition-colors">
          <CardContent className="flex items-center gap-3 py-4">
            <span className="bg-muted grid size-10 place-items-center rounded-lg">
              <Inbox className="size-5" />
            </span>
            <div>
              <p className="font-medium">Inbox</p>
              <p className="text-muted-foreground text-xs">משימות ללא פרויקט</p>
            </div>
          </CardContent>
        </Card>
      </Link>

      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="text-muted-foreground flex flex-col items-center gap-2 py-10 text-center text-sm">
          <FolderKanban className="size-8 opacity-50" />
          אין פרויקטים עדיין.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <Card key={p.id} className="hover:border-primary/40 group relative transition-colors">
              <CardContent className="py-4">
                <Link href={`/projects/${p.id}`} className="flex items-start gap-3">
                  <span
                    className="mt-1 size-3 shrink-0 rounded-full"
                    style={{ backgroundColor: p.color }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{p.name}</p>
                    <p className="text-muted-foreground mt-0.5 text-xs">
                      {p.task_count} משימות · {STATUS_LABEL[p.status]}
                    </p>
                  </div>
                </Link>
                {canManage && (
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      className="text-muted-foreground hover:text-foreground absolute end-3 top-3 rounded p-1 opacity-0 group-hover:opacity-100"
                      aria-label="פעולות פרויקט"
                    >
                      <MoreHorizontal className="size-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() =>
                          del.mutate(p.id, { onError: () => toast.error("מחיקה נכשלה") })
                        }
                      >
                        <Trash2 className="size-4" />
                        מחיקה
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
