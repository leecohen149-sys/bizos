"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import {
  CheckSquare,
  FolderKanban,
  LayoutDashboard,
  Plus,
  Inbox,
} from "lucide-react"

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"
import { useUiStore } from "@/lib/store/ui"
import { useOrg } from "@/features/org/org-context"
import { useSupabase } from "@/features/tasks/hooks"

export function CommandPalette() {
  const router = useRouter()
  const supabase = useSupabase()
  const { orgId } = useOrg()
  const open = useUiStore((s) => s.commandPaletteOpen)
  const setOpen = useUiStore((s) => s.setCommandPaletteOpen)
  const toggle = useUiStore((s) => s.toggleCommandPalette)
  const [query, setQuery] = React.useState("")

  // ⌘K / Ctrl+K
  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        toggle()
      }
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [toggle])

  const { data } = useQuery({
    queryKey: ["search", orgId, query],
    enabled: open && query.trim().length > 1,
    queryFn: async () => {
      const term = `%${query.trim()}%`
      const [tasks, projects] = await Promise.all([
        supabase
          .from("tasks")
          .select("id, title, project_id, status")
          .eq("org_id", orgId)
          .ilike("title", term)
          .limit(6),
        supabase
          .from("projects")
          .select("id, name, color")
          .eq("org_id", orgId)
          .ilike("name", term)
          .limit(5),
      ])
      return {
        tasks: tasks.data ?? [],
        projects: projects.data ?? [],
      }
    },
  })

  function go(href: string) {
    setOpen(false)
    setQuery("")
    router.push(href)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="overflow-hidden p-0 top-1/4 translate-y-0" showCloseButton={false}>
        <DialogTitle className="sr-only">חיפוש וניווט</DialogTitle>
        <DialogDescription className="sr-only">
          חיפוש משימות, פרויקטים ופעולות
        </DialogDescription>
        <Command shouldFilter={false}>
      <CommandInput
        placeholder="חיפוש או מעבר מהיר…"
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>לא נמצאו תוצאות.</CommandEmpty>

        {(data?.projects.length ?? 0) > 0 && (
          <CommandGroup heading="פרויקטים">
            {data!.projects.map((p) => (
              <CommandItem
                key={p.id}
                value={`project-${p.id}`}
                onSelect={() => go(`/projects/${p.id}`)}
              >
                <span
                  className="size-2.5 rounded-full"
                  style={{ backgroundColor: p.color }}
                />
                {p.name}
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {(data?.tasks.length ?? 0) > 0 && (
          <CommandGroup heading="משימות">
            {data!.tasks.map((t) => (
              <CommandItem
                key={t.id}
                value={`task-${t.id}`}
                onSelect={() => go(t.project_id ? `/projects/${t.project_id}` : "/projects/inbox")}
              >
                <CheckSquare className="size-4" />
                {t.title}
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        <CommandSeparator />
        <CommandGroup heading="ניווט">
          <CommandItem value="nav-dashboard" onSelect={() => go("/")}>
            <LayoutDashboard className="size-4" />
            דשבורד
          </CommandItem>
          <CommandItem value="nav-tasks" onSelect={() => go("/tasks")}>
            <CheckSquare className="size-4" />
            המשימות שלי
          </CommandItem>
          <CommandItem value="nav-projects" onSelect={() => go("/projects")}>
            <FolderKanban className="size-4" />
            פרויקטים
          </CommandItem>
          <CommandItem value="nav-inbox" onSelect={() => go("/projects/inbox")}>
            <Inbox className="size-4" />
            Inbox
          </CommandItem>
          <CommandItem value="nav-new-project" onSelect={() => go("/projects?new=1")}>
            <Plus className="size-4" />
            פרויקט חדש
          </CommandItem>
        </CommandGroup>
      </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  )
}
