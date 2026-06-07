"use client"

import { useRouter } from "next/navigation"
import { Bell, CheckCheck } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { formatDate, formatTime } from "@/lib/format"
import {
  useNotifications,
  useNotificationsRealtime,
  useMarkRead,
  useMarkAllRead,
} from "@/features/notifications/hooks"
import type { Notification } from "@/lib/types"

function targetHref(n: Notification): string {
  if (n.entity_type === "task") return "/tasks"
  if (n.entity_type === "deal") return "/crm"
  return "/"
}

export function NotificationBell() {
  useNotificationsRealtime()
  const router = useRouter()
  const { data: notifications = [] } = useNotifications()
  const unread = notifications.filter((n) => !n.read_at).length
  const markRead = useMarkRead()
  const markAll = useMarkAllRead()

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="התראות">
          <Bell className="size-5" />
          {unread > 0 && (
            <span className="bg-status-blocked absolute end-1 top-1 grid min-w-4 place-items-center rounded-full px-1 text-[10px] font-bold text-white">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b px-3 py-2">
          <span className="text-sm font-medium">התראות</span>
          {unread > 0 && (
            <Button
              variant="ghost"
              size="xs"
              onClick={() => markAll.mutate()}
              className="gap-1"
            >
              <CheckCheck className="size-3.5" />
              סמן הכל כנקרא
            </Button>
          )}
        </div>
        <ScrollArea className="max-h-96">
          {notifications.length === 0 ? (
            <p className="text-muted-foreground p-6 text-center text-sm">
              אין התראות.
            </p>
          ) : (
            <ul className="divide-y">
              {notifications.map((n) => (
                <li key={n.id}>
                  <button
                    onClick={() => {
                      if (!n.read_at) markRead.mutate(n.id)
                      router.push(targetHref(n))
                    }}
                    className={cn(
                      "hover:bg-accent flex w-full gap-2 px-3 py-2.5 text-start",
                      !n.read_at && "bg-primary/5"
                    )}
                  >
                    <span
                      className={cn(
                        "mt-1.5 size-2 shrink-0 rounded-full",
                        n.read_at ? "bg-transparent" : "bg-primary"
                      )}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{n.title}</p>
                      {n.body && (
                        <p className="text-muted-foreground truncate text-xs">{n.body}</p>
                      )}
                      <p className="text-muted-foreground mt-0.5 text-[11px]">
                        {formatDate(n.created_at)} {formatTime(n.created_at)}
                      </p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}
