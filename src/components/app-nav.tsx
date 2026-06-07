"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { NAV_ITEMS } from "@/lib/nav"

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/"
  return pathname === href || pathname.startsWith(`${href}/`)
}

/** Desktop sidebar navigation. */
export function SidebarNav() {
  const pathname = usePathname()
  return (
    <nav className="flex flex-col gap-1" aria-label="ניווט ראשי">
      {NAV_ITEMS.map((item) => {
        const active = isActive(pathname, item.href)
        const Icon = item.icon
        const content = (
          <>
            <Icon className="size-4.5 shrink-0" />
            <span className="truncate">{item.label}</span>
            {item.soon && (
              <Badge variant="secondary" className="ms-auto text-[10px]">
                בקרוב
              </Badge>
            )}
          </>
        )
        const className = cn(
          "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
          active
            ? "bg-primary/10 text-primary"
            : "text-muted-foreground hover:bg-accent hover:text-foreground",
          item.soon && "cursor-default opacity-60 hover:bg-transparent hover:text-muted-foreground"
        )
        return item.soon ? (
          <span key={item.href} className={className} aria-disabled>
            {content}
          </span>
        ) : (
          <Link key={item.href} href={item.href} className={className}>
            {content}
          </Link>
        )
      })}
    </nav>
  )
}

/** Mobile bottom navigation (touch targets ≥44px). */
export function MobileNav() {
  const pathname = usePathname()
  return (
    <nav
      className="bg-background/95 supports-[backdrop-filter]:bg-background/80 fixed inset-x-0 bottom-0 z-40 flex border-t backdrop-blur md:hidden"
      aria-label="ניווט תחתון"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {NAV_ITEMS.map((item) => {
        const active = isActive(pathname, item.href)
        const Icon = item.icon
        const inner = (
          <>
            <Icon className="size-5" />
            <span className="text-[11px]">{item.label.split(" ")[0]}</span>
          </>
        )
        const className = cn(
          "flex min-h-12 flex-1 flex-col items-center justify-center gap-0.5 py-2",
          active ? "text-primary" : "text-muted-foreground",
          item.soon && "opacity-50"
        )
        return item.soon ? (
          <span key={item.href} className={className} aria-disabled>
            {inner}
          </span>
        ) : (
          <Link key={item.href} href={item.href} className={className}>
            {inner}
          </Link>
        )
      })}
    </nav>
  )
}
