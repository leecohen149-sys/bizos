import Link from "next/link"
import { notFound } from "next/navigation"
import { ChevronRight, Inbox } from "lucide-react"

import { createClient } from "@/lib/supabase/server"
import { ProjectTasks, InboxTasks } from "@/features/tasks/components/scoped-tasks"

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  if (id === "inbox") {
    return (
      <div className="mx-auto max-w-5xl space-y-5">
        <Breadcrumb name="Inbox" icon />
        <InboxTasks />
      </div>
    )
  }

  const supabase = await createClient()
  const { data: project } = await supabase
    .from("projects")
    .select("id, name, color, description")
    .eq("id", id)
    .maybeSingle()

  if (!project) notFound()

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <div className="space-y-1">
        <Breadcrumb name={project.name as string} color={project.color as string} />
        {project.description && (
          <p className="text-muted-foreground text-sm">{project.description as string}</p>
        )}
      </div>
      <ProjectTasks projectId={project.id as string} />
    </div>
  )
}

function Breadcrumb({
  name,
  color,
  icon,
}: {
  name: string
  color?: string
  icon?: boolean
}) {
  return (
    <div className="flex items-center gap-2">
      <Link href="/projects" className="text-muted-foreground hover:text-foreground text-sm">
        פרויקטים
      </Link>
      <ChevronRight className="text-muted-foreground size-4 rtl:rotate-180" />
      <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
        {icon ? (
          <Inbox className="size-5" />
        ) : (
          <span className="size-3 rounded-full" style={{ backgroundColor: color }} />
        )}
        {name}
      </h1>
    </div>
  )
}
