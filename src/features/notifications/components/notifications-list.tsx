"use client"

import { useRouter } from "next/navigation"
import { Bell, CheckCheck } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { formatDate, formatTime } from "@/lib/format"
import {
  useNotifications,
  useMarkRead,
  useMarkAllRead,
} from "@/features/notifications/hooks"
import type { Notification } from "@/lib/types"

function targetHref(n: Notification): string {
  if (n.entity_type === "task") return "/tasks"
  if (n.entity_type === "deal") return "/crm"
  return "/"
}

export function NotificationsList() {
  const router = useRouter()
  const { data: notifications = [], isLoading } = useNotifications()
  const unread = notifications.filter((n) => !n.read_at).length
  const markRead = useMarkRead()
  const markAll = useMarkAllRead()

  if (!isLoading && notifications.length === 0) {
    return (
      <div className="text-muted-foreground flex flex-col items-center gap-2 py-12 text-center text-sm">
        <Bell className="size-8 opacity-50" />
        אין התראות עדיין.
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {unread > 0 && (
        <div className="flex justify-end">
          <Button variant="ghost" size="sm" onClick={() => markAll.mutate()} className="gap-1">
            <CheckCheck className="size-4" />
            סמן הכל כנקרא
          </Button>
        </div>
      )}
      {notifications.map((n) => (
        <Card
          key={n.id}
          onClick={() => {
            if (!n.read_at) markRead.mutate(n.id)
            router.push(targetHref(n))
          }}
          className={cn(
            "hover:border-primary/40 cursor-pointer p-3 transition-colors",
            !n.read_at && "bg-primary/5 border-primary/20"
          )}
        >
          <div className="flex gap-2">
            <span
              className={cn(
                "mt-1.5 size-2 shrink-0 rounded-full",
                n.read_at ? "bg-transparent" : "bg-primary"
              )}
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{n.title}</p>
              {n.body && <p className="text-muted-foreground text-sm">{n.body}</p>}
              <p className="text-muted-foreground mt-0.5 text-xs">
                {formatDate(n.created_at)} {formatTime(n.created_at)}
              </p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}
