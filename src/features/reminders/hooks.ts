"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { useOrg } from "@/features/org/org-context"
import { useSupabase } from "@/features/tasks/hooks"
import type { Reminder } from "@/lib/types"

export function remindersKey(taskId: string) {
  return ["reminders", taskId] as const
}

export function useTaskReminders(taskId: string) {
  const supabase = useSupabase()
  const { currentUserId } = useOrg()
  return useQuery({
    queryKey: remindersKey(taskId),
    queryFn: async (): Promise<Reminder[]> => {
      const { data, error } = await supabase
        .from("reminders")
        .select("*")
        .eq("task_id", taskId)
        .eq("user_id", currentUserId)
        .order("remind_at", { ascending: true })
      if (error) throw error
      return data ?? []
    },
  })
}

export function useCreateReminder(taskId: string) {
  const supabase = useSupabase()
  const qc = useQueryClient()
  const { orgId, currentUserId } = useOrg()
  return useMutation({
    mutationFn: async ({ remindAt, message }: { remindAt: string; message?: string }) => {
      const { error } = await supabase.from("reminders").insert({
        org_id: orgId,
        user_id: currentUserId,
        task_id: taskId,
        remind_at: remindAt,
        message: message ?? null,
        status: "pending",
      })
      if (error) throw error
    },
    onSettled: () => qc.invalidateQueries({ queryKey: remindersKey(taskId) }),
  })
}

export function useDeleteReminder(taskId: string) {
  const supabase = useSupabase()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("reminders").delete().eq("id", id)
      if (error) throw error
    },
    onSettled: () => qc.invalidateQueries({ queryKey: remindersKey(taskId) }),
  })
}
