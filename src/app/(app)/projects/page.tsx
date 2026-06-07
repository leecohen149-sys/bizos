import { ProjectsView } from "@/features/projects/components/projects-view"

export const metadata = { title: "פרויקטים" }

export default function ProjectsPage() {
  return (
    <div className="mx-auto max-w-5xl">
      <ProjectsView />
    </div>
  )
}
