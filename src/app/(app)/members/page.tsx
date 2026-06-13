import { redirect } from "next/navigation"

// Members management moved under Settings.
export default function MembersPage() {
  redirect("/settings/members")
}
