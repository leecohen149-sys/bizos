"use client"

import { UserCircle2, Check } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { useOrg } from "@/features/org/org-context"
import type { OrgMember } from "@/lib/types"

function initials(name: string | null) {
  return (name ?? "").trim().charAt(0).toUpperCase() || "?"
}

export function AssigneeAvatar({
  member,
  size = "sm",
}: {
  member: Pick<OrgMember, "full_name" | "avatar_url"> | null
  size?: "xs" | "sm"
}) {
  const cls = size === "xs" ? "size-5 text-[10px]" : "size-6 text-xs"
  if (!member) {
    return (
      <span
        className={cn(
          "text-muted-foreground grid place-items-center rounded-full border border-dashed",
          cls
        )}
        title="לא משויך"
      >
        <UserCircle2 className="size-3.5" />
      </span>
    )
  }
  return (
    <Avatar className={cls}>
      {member.avatar_url && <AvatarImage src={member.avatar_url} alt={member.full_name ?? ""} />}
      <AvatarFallback>{initials(member.full_name)}</AvatarFallback>
    </Avatar>
  )
}

export function AssigneePicker({
  assigneeId,
  onChange,
}: {
  assigneeId: string | null
  onChange: (userId: string | null) => void
}) {
  const { members } = useOrg()
  const current = members.find((m) => m.user_id === assigneeId) ?? null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="rounded-full outline-none focus-visible:ring-2"
        aria-label="שיוך אחראי"
      >
        <AssigneeAvatar member={current} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="max-h-72 overflow-auto">
        <DropdownMenuItem onClick={() => onChange(null)} className="gap-2">
          <span className="text-muted-foreground grid size-6 place-items-center rounded-full border border-dashed">
            <UserCircle2 className="size-3.5" />
          </span>
          ללא אחראי
          {!assigneeId && <Check className="ms-auto size-4" />}
        </DropdownMenuItem>
        {members.map((m) => (
          <DropdownMenuItem
            key={m.user_id}
            onClick={() => onChange(m.user_id)}
            className="gap-2"
          >
            <AssigneeAvatar member={m} />
            <span className="truncate">{m.full_name ?? "משתמש"}</span>
            {assigneeId === m.user_id && <Check className="ms-auto size-4" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
