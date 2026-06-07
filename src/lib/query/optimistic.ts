import type { QueryClient, QueryKey } from "@tanstack/react-query"

/**
 * Reusable optimistic-update lifecycle for TanStack Query mutations.
 *
 * Wires the canonical pattern used across the whole app:
 *   onMutate  → cancel in-flight queries → snapshot → apply optimistic patch
 *   onError   → roll back to the snapshot
 *   onSettled → invalidate so the server is the source of truth
 *
 * Usage:
 *   useMutation({
 *     mutationFn,
 *     ...optimisticMutation<Task[], NewTask>(queryClient, {
 *       queryKey: ["tasks", orgId],
 *       applyOptimistic: (prev, vars) => [...(prev ?? []), toOptimistic(vars)],
 *     }),
 *   })
 */
export function optimisticMutation<TData, TVariables>(
  queryClient: QueryClient,
  options: {
    queryKey: QueryKey
    applyOptimistic: (previous: TData | undefined, variables: TVariables) => TData
    /** Extra keys to invalidate on settle (besides queryKey). */
    invalidateKeys?: QueryKey[]
  }
) {
  const { queryKey, applyOptimistic, invalidateKeys = [] } = options

  return {
    onMutate: async (variables: TVariables) => {
      await queryClient.cancelQueries({ queryKey })
      const previous = queryClient.getQueryData<TData>(queryKey)
      queryClient.setQueryData<TData>(queryKey, (prev) =>
        applyOptimistic(prev, variables)
      )
      return { previous }
    },
    onError: (
      _error: unknown,
      _variables: TVariables,
      context: { previous: TData | undefined } | undefined
    ) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData<TData>(queryKey, context.previous)
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey })
      for (const key of invalidateKeys) {
        void queryClient.invalidateQueries({ queryKey: key })
      }
    },
  }
}

/** Stable query-key factory to keep cache keys consistent across the app. */
export const queryKeys = {
  tasks: (orgId: string) => ["tasks", orgId] as const,
  task: (orgId: string, taskId: string) => ["tasks", orgId, taskId] as const,
  projects: (orgId: string) => ["projects", orgId] as const,
  myTasks: (orgId: string, userId: string) =>
    ["tasks", orgId, "assignee", userId] as const,
  notifications: (orgId: string, userId: string) =>
    ["notifications", orgId, userId] as const,
  crmDeals: (orgId: string) => ["crm", "deals", orgId] as const,
  crmContacts: (orgId: string) => ["crm", "contacts", orgId] as const,
  crmCompanies: (orgId: string) => ["crm", "companies", orgId] as const,
}
