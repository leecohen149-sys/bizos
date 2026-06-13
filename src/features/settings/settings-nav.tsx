"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Plug, SlidersHorizontal, Users } from "lucide-react"
import type { LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { useOrg } from "@/features/org/org-context"
import { ADMIN_ROLES } from "@/lib/constants/domain"

type SettingsTab = {
  href: string
  label: string
  icon: LucideIcon
  /** Restricted to owner/admin. */
  adminOnly?: boolean
}

const TABS: SettingsTab[] = [
  { href: "/settings", label: "כללי", icon: SlidersHorizontal },
  { href: "/settings/members", label: "חברי צוות", icon: Users, adminOnly: true },
  { href: "/settings/integrations", label: "אינטגרציות", icon: Plug, adminOnly: true },
]

function isActive(pathname: string, href: string) {
  if (href === "/settings") return pathname === "/settings"
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function SettingsNav() {
  const pathname = usePathname()
  const { role } = useOrg()
  const isAdmin = ADMIN_ROLES.includes(role)
  const tabs = TABS.filter((t) => !t.adminOnly || isAdmin)

  return (
    <nav
      className="flex gap-1 overflow-x-auto border-b"
      aria-label="ניווט הגדרות"
    >
      {tabs.map((tab) => {
        const active = isActive(pathname, tab.href)
        const Icon = tab.icon
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "flex items-center gap-2 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
            aria-current={active ? "page" : undefined}
          >
            <Icon className="size-4 shrink-0" />
            {tab.label}
          </Link>
        )
      })}
    </nav>
  )
}
