"use client"

import { useState } from "react"
import { Send } from "lucide-react"
import { toast } from "sonner"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { formatDate, formatTime } from "@/lib/format"
import { useComments, useAddComment } from "@/features/tasks/comments-hooks"

export function TaskComments({ taskId }: { taskId: string }) {
  const { data: comments = [] } = useComments(taskId)
  const add = useAddComment(taskId)
  const [body, setBody] = useState("")

  function submit() {
    const trimmed = body.trim()
    if (!trimmed) return
    add.mutate(trimmed, { onError: () => toast.error("שליחת התגובה נכשלה") })
    setBody("")
  }

  return (
    <div className="space-y-3">
      <div className="space-y-3">
        {comments.map((c) => {
          const name = c.author?.full_name ?? "משתמש"
          return (
            <div key={c.id} className="flex gap-2">
              <Avatar className="size-7 shrink-0">
                {c.author?.avatar_url && <AvatarImage src={c.author.avatar_url} alt={name} />}
                <AvatarFallback>{name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-medium">{name}</span>
                  <span className="text-muted-foreground text-xs">
                    {formatDate(c.created_at)} {formatTime(c.created_at)}
                  </span>
                </div>
                <p className="text-sm whitespace-pre-wrap">{c.body}</p>
              </div>
            </div>
          )
        })}
        {comments.length === 0 && (
          <p className="text-muted-foreground text-xs">אין תגובות עדיין.</p>
        )}
      </div>

      <div className="flex items-end gap-2">
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit()
          }}
          placeholder="כתבו תגובה… (⌘+Enter לשליחה)"
          rows={2}
          className="flex-1"
        />
        <Button size="icon" onClick={submit} disabled={add.isPending} aria-label="שליחה">
          <Send className="size-4" />
        </Button>
      </div>
    </div>
  )
}
