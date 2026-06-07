"use client"

import * as React from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { useOrg } from "@/features/org/org-context"
import { useSupabase } from "@/features/tasks/hooks"
import type { Notification } from "@/lib/types"

export function notificationsKey(userId: string) {
  return ["notifications", userId] as const
}

export function useNotificationsRealtime() {
  const supabase = useSupabase()
  const qc = useQueryClient()
  const { currentUserId } = useOrg()

  React.useEffect(() => {
    const channel = supabase
      .channel(`notifications:${currentUserId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${currentUserId}`,
        },
        () => void qc.invalidateQueries({ queryKey: notificationsKey(currentUserId) })
      )
      .subscribe()
    return () => void supabase.removeChannel(channel)
  }, [supabase, qc, currentUserId])
}

export function useNotifications() {
  const supabase = useSupabase()
  const { currentUserId } = useOrg()

  return useQuery({
    queryKey: notificationsKey(currentUserId),
    queryFn: async (): Promise<Notification[]> => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", currentUserId)
        .order("created_at", { ascending: false })
        .limit(50)
      if (error) throw error
      return data ?? []
    },
  })
}

export function useUnreadCount() {
  const { data } = useNotifications()
  return (data ?? []).filter((n) => !n.read_at).length
}

export function useMarkRead() {
  const supabase = useSupabase()
  const qc = useQueryClient()
  const { currentUserId } = useOrg()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("notifications")
        .update({ read_at: new Date().toISOString() })
        .eq("id", id)
      if (error) throw error
    },
    onMutate: async (id) => {
      const key = notificationsKey(currentUserId)
      await qc.cancelQueries({ queryKey: key })
      const prev = qc.getQueryData<Notification[]>(key)
      qc.setQueryData<Notification[]>(key, (old) =>
        (old ?? []).map((n) =>
          n.id === id ? { ...n, read_at: new Date().toISOString() } : n
        )
      )
      return { prev }
    },
    onError: (_e, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(notificationsKey(currentUserId), ctx.prev)
    },
    onSettled: () => qc.invalidateQueries({ queryKey: notificationsKey(currentUserId) }),
  })
}

export function useMarkAllRead() {
  const supabase = useSupabase()
  const qc = useQueryClient()
  const { currentUserId } = useOrg()
  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("notifications")
        .update({ read_at: new Date().toISOString() })
        .eq("user_id", currentUserId)
        .is("read_at", null)
      if (error) throw error
    },
    onSettled: () => qc.invalidateQueries({ queryKey: notificationsKey(currentUserId) }),
  })
}
