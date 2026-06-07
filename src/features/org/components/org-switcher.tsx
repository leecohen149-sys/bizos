"use client"

import { useRouter } from "next/navigation"
import { useTransition } from "react"
import { Check, ChevronsUpDown, Plus } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { ORG_ROLE_LABELS } from "@/lib/constants/domain"
import { switchOrgAction } from "@/features/org/actions"
import type { OrgSummary } from "@/features/org/queries"

export function OrgSwitcher({
  orgs,
  activeOrgId,
}: {
  orgs: OrgSummary[]
  activeOrgId: string
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const active = orgs.find((o) => o.id === activeOrgId) ?? orgs[0]

  function select(orgId: string) {
    if (orgId === activeOrgId) return
    startTransition(async () => {
      const res = await switchOrgAction(orgId)
      if ("error" in res) toast.error(res.error)
      else router.refresh()
    })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          disabled={isPending}
          className="h-auto w-full justify-between gap-2 px-2 py-1.5"
        >
          <span className="flex items-center gap-2 truncate">
            <span className="bg-primary text-primary-foreground grid size-7 shrink-0 place-items-center rounded-md text-xs font-bold">
              {active.name.charAt(0)}
            </span>
            <span className="flex flex-col items-start truncate text-start">
              <span className="truncate text-sm font-medium">{active.name}</span>
              <span className="text-muted-foreground text-xs">
                {ORG_ROLE_LABELS[active.role]}
              </span>
            </span>
          </span>
          <ChevronsUpDown className="text-muted-foreground size-4 shrink-0" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-(--radix-dropdown-menu-trigger-width) min-w-56">
        <DropdownMenuLabel className="text-muted-foreground text-xs">
          העסקים שלי
        </DropdownMenuLabel>
        {orgs.map((org) => (
          <DropdownMenuItem
            key={org.id}
            onClick={() => select(org.id)}
            className="gap-2"
          >
            <span className="bg-muted grid size-6 shrink-0 place-items-center rounded text-xs font-bold">
              {org.name.charAt(0)}
            </span>
            <span className="truncate">{org.name}</span>
            <Check
              className={cn(
                "ms-auto size-4",
                org.id === activeOrgId ? "opacity-100" : "opacity-0"
              )}
            />
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push("/onboarding")} className="gap-2">
          <Plus className="size-4" />
          עסק חדש
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
