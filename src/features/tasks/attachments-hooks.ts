"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { useOrg } from "@/features/org/org-context"
import { useSupabase } from "@/features/tasks/hooks"
import type { Tables } from "@/lib/types"

const BUCKET = "attachments"

export function attachmentsKey(taskId: string) {
  return ["attachments", taskId] as const
}

export function useAttachments(taskId: string) {
  const supabase = useSupabase()
  return useQuery({
    queryKey: attachmentsKey(taskId),
    queryFn: async (): Promise<Tables<"attachments">[]> => {
      const { data, error } = await supabase
        .from("attachments")
        .select("*")
        .eq("task_id", taskId)
        .order("created_at", { ascending: false })
      if (error) throw error
      return data ?? []
    },
  })
}

export function useUploadAttachment(taskId: string) {
  const supabase = useSupabase()
  const qc = useQueryClient()
  const { orgId, currentUserId } = useOrg()
  return useMutation({
    mutationFn: async (file: File) => {
      const path = `${orgId}/${taskId}/${crypto.randomUUID()}-${file.name}`
      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { upsert: false })
      if (upErr) throw upErr
      const { error } = await supabase.from("attachments").insert({
        org_id: orgId,
        task_id: taskId,
        storage_path: path,
        file_name: file.name,
        mime: file.type || null,
        size: file.size,
        uploaded_by: currentUserId,
      })
      if (error) throw error
    },
    onSettled: () => qc.invalidateQueries({ queryKey: attachmentsKey(taskId) }),
  })
}

export function useDeleteAttachment(taskId: string) {
  const supabase = useSupabase()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (att: Tables<"attachments">) => {
      await supabase.storage.from(BUCKET).remove([att.storage_path])
      const { error } = await supabase.from("attachments").delete().eq("id", att.id)
      if (error) throw error
    },
    onSettled: () => qc.invalidateQueries({ queryKey: attachmentsKey(taskId) }),
  })
}

export function useDownloadAttachment() {
  const supabase = useSupabase()
  return async (storagePath: string) => {
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(storagePath, 3600)
    if (error || !data) throw error ?? new Error("signed url failed")
    return data.signedUrl
  }
}
