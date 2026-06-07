"use client"

import * as React from "react"

import type { TaskFilters } from "@/features/tasks/filters"

export type SavedView = { name: string; filters: TaskFilters }

/**
 * Per-user, per-scope saved filter views, persisted in localStorage.
 * (Device-local; a server-backed table can replace this later without UI change.)
 */
export function useSavedViews(storageKey: string) {
  const key = `bizos:views:${storageKey}`
  const [views, setViews] = React.useState<SavedView[]>([])

  React.useEffect(() => {
    // Load from localStorage after mount to avoid SSR hydration mismatch.
    try {
      const raw = localStorage.getItem(key)
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setViews(raw ? (JSON.parse(raw) as SavedView[]) : [])
    } catch {
      setViews([])
    }
  }, [key])

  const persist = React.useCallback(
    (next: SavedView[]) => {
      setViews(next)
      try {
        localStorage.setItem(key, JSON.stringify(next))
      } catch {
        /* ignore quota / private mode */
      }
    },
    [key]
  )

  const saveView = React.useCallback(
    (name: string, filters: TaskFilters) => {
      persist([...views.filter((v) => v.name !== name), { name, filters }])
    },
    [views, persist]
  )

  const deleteView = React.useCallback(
    (name: string) => persist(views.filter((v) => v.name !== name)),
    [views, persist]
  )

  return { views, saveView, deleteView }
}
