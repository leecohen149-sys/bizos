import {
  LayoutDashboard,
  CheckSquare,
  FolderKanban,
  Users,
  Bell,
  type LucideIcon,
} from "lucide-react"

export type NavItem = {
  href: string
  label: string
  icon: LucideIcon
  /** Not yet shipped (Phase 1+). Rendered but non-navigable. */
  soon?: boolean
}

/** Primary navigation. Items marked `soon` arrive in later phases. */
export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "דשבורד", icon: LayoutDashboard },
  { href: "/tasks", label: "המשימות שלי", icon: CheckSquare, soon: true },
  { href: "/projects", label: "פרויקטים", icon: FolderKanban, soon: true },
  { href: "/crm", label: "לקוחות (CRM)", icon: Users, soon: true },
  { href: "/notifications", label: "התראות", icon: Bell, soon: true },
]
