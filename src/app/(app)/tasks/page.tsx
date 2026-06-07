import { MyTasks } from "@/features/tasks/components/my-tasks"

export const metadata = { title: "המשימות שלי" }

export default function TasksPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">המשימות שלי</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          כל המשימות שהוקצו לך, לרוחב כל הפרויקטים.
        </p>
      </div>
      <MyTasks />
    </div>
  )
}
