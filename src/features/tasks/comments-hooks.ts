"use client"

import * as React from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { useOrg } from "@/features/org/org-context"
import { useSupabase } from "@/features/tasks/hooks"
import type { TaskComment, Profile } from "@/lib/types"

export type CommentWithAuthor = TaskComment & {
  author: Pick<Profile, "full_name" | "avatar_url"> | null
}

export function commentsKey(taskId: string) {
  return ["comments", taskId] as const
}

export function useComments(taskId: string) {
  const supabase = useSupabase()
  const qc = useQueryClient()

  React.useEffect(() => {
    const channel = supabase
      .channel(`comments:${taskId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "task_comments", filter: `task_id=eq.${taskId}` },
        () => void qc.invalidateQueries({ queryKey: commentsKey(taskId) })
      )
      .subscribe()
    return () => void supabase.removeChannel(channel)
  }, [supabase, qc, taskId])

  return useQuery({
    queryKey: commentsKey(taskId),
    queryFn: async (): Promise<CommentWithAuthor[]> => {
      const { data, error } = await supabase
        .from("task_comments")
        .select("*, author:profiles(full_name, avatar_url)")
        .eq("task_id", taskId)
        .order("created_at", { ascending: true })
      if (error) throw error
      return (data ?? []) as unknown as CommentWithAuthor[]
    },
  })
}

export function useAddComment(taskId: string) {
  const supabase = useSupabase()
  const qc = useQueryClient()
  const { orgId, currentUserId } = useOrg()
  return useMutation({
    mutationFn: async (body: string) => {
      const { error } = await supabase.from("task_comments").insert({
        org_id: orgId,
        task_id: taskId,
        author_id: currentUserId,
        body,
      })
      if (error) throw error
    },
    onSettled: () => qc.invalidateQueries({ queryKey: commentsKey(taskId) }),
  })
}
