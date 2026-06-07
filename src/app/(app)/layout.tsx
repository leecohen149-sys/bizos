import { redirect } from "next/navigation"

import { Logo } from "@/components/brand/logo"
import { ThemeToggle } from "@/components/theme-toggle"
import { SidebarNav, MobileNav } from "@/components/app-nav"
import { createClient } from "@/lib/supabase/server"
import {
  getSessionUser,
  getUserOrgs,
  getActiveOrg,
} from "@/features/org/queries"
import { OrgSwitcher } from "@/features/org/components/org-switcher"
import { UserMenu } from "@/features/auth/components/user-menu"

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getSessionUser()
  if (!user) redirect("/login")

  const orgs = await getUserOrgs()
  if (orgs.length === 0) redirect("/onboarding")
  const activeOrg = (await getActiveOrg())!

  const supabase = await createClient()
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, avatar_url")
    .eq("id", user.id)
    .maybeSingle()

  const fullName = (profile?.full_name as string | null) ?? ""
  const avatarUrl = (profile?.avatar_url as string | null) ?? null

  return (
    <div className="flex min-h-dvh">
      {/* Desktop sidebar (RTL → appears on the right) */}
      <aside className="bg-sidebar text-sidebar-foreground hidden w-64 shrink-0 flex-col border-e p-3 md:flex">
        <div className="px-2 py-1.5">
          <Logo />
        </div>
        <div className="mt-3">
          <OrgSwitcher orgs={orgs} activeOrgId={activeOrg.id} />
        </div>
        <div className="mt-4 flex-1">
          <SidebarNav />
        </div>
        <div className="flex items-center justify-between border-t pt-3">
          <UserMenu fullName={fullName} email={user.email ?? ""} avatarUrl={avatarUrl} />
          <ThemeToggle />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="bg-background/95 supports-[backdrop-filter]:bg-background/80 sticky top-0 z-30 flex h-14 items-center gap-3 border-b px-4 backdrop-blur">
          <div className="md:hidden">
            <Logo showText={false} />
          </div>
          <div className="ms-auto flex items-center gap-1">
            <span className="md:hidden">
              <ThemeToggle />
            </span>
            <span className="md:hidden">
              <UserMenu
                fullName={fullName}
                email={user.email ?? ""}
                avatarUrl={avatarUrl}
              />
            </span>
          </div>
        </header>

        <main className="flex-1 p-4 pb-20 md:p-6 md:pb-6">{children}</main>
      </div>

      <MobileNav />
    </div>
  )
}
