"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { useOrg } from "@/features/org/org-context"
import { useSupabase } from "@/features/tasks/hooks"
import type { CrmActivity, Profile } from "@/lib/types"
import type { Database } from "@/lib/supabase/database.types"

export type ActivityWithAuthor = CrmActivity & {
  author: Pick<Profile, "full_name" | "avatar_url"> | null
}

type ActivityInsert = Omit<
  Database["public"]["Tables"]["crm_activities"]["Insert"],
  "org_id" | "created_by"
>

export function activitiesKey(scope: { dealId?: string; contactId?: string }) {
  return ["crm", "activities", scope.dealId ?? scope.contactId ?? "all"] as const
}

export function useActivities(scope: { dealId?: string; contactId?: string }) {
  const supabase = useSupabase()
  const { orgId } = useOrg()
  return useQuery({
    queryKey: activitiesKey(scope),
    queryFn: async (): Promise<ActivityWithAuthor[]> => {
      let q = supabase
        .from("crm_activities")
        .select("*, author:profiles(full_name, avatar_url)")
        .eq("org_id", orgId)
        .order("occurred_at", { ascending: false })
        .limit(50)
      if (scope.dealId) q = q.eq("deal_id", scope.dealId)
      if (scope.contactId) q = q.eq("contact_id", scope.contactId)
      const { data, error } = await q
      if (error) throw error
      return (data ?? []) as unknown as ActivityWithAuthor[]
    },
  })
}

export function useAddActivity(scope: { dealId?: string; contactId?: string }) {
  const supabase = useSupabase()
  const qc = useQueryClient()
  const { orgId, currentUserId } = useOrg()
  return useMutation({
    mutationFn: async (input: ActivityInsert) => {
      const { error } = await supabase.from("crm_activities").insert({
        ...input,
        org_id: orgId,
        created_by: currentUserId,
      })
      if (error) throw error
    },
    onSettled: () => qc.invalidateQueries({ queryKey: activitiesKey(scope) }),
  })
}
