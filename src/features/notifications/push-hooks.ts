"use client"

import * as React from "react"
import { toast } from "sonner"

import { useSupabase } from "@/features/tasks/hooks"
import { useOrg } from "@/features/org/org-context"
import { publicEnv, isPushConfigured } from "@/lib/env"

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
  const raw = atob(base64)
  const out = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i)
  return out
}

type PushState = {
  supported: boolean
  configured: boolean
  permission: NotificationPermission | "default"
  subscribed: boolean
  isStandalone: boolean
  isIOS: boolean
}

export function usePush() {
  const supabase = useSupabase()
  const { currentUserId } = useOrg()
  const [state, setState] = React.useState<PushState>({
    supported: false,
    configured: isPushConfigured,
    permission: "default",
    subscribed: false,
    isStandalone: false,
    isIOS: false,
  })

  React.useEffect(() => {
    const supported =
      "serviceWorker" in navigator && "PushManager" in window && "Notification" in window
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      // iOS Safari
      (window.navigator as unknown as { standalone?: boolean }).standalone === true

    async function check() {
      let subscribed = false
      if (supported) {
        try {
          const reg = await navigator.serviceWorker.ready
          subscribed = !!(await reg.pushManager.getSubscription())
        } catch {
          /* ignore */
        }
      }
      setState({
        supported,
        configured: isPushConfigured,
        permission: supported ? Notification.permission : "default",
        subscribed,
        isStandalone,
        isIOS,
      })
    }
    void check()
  }, [])

  const subscribe = React.useCallback(async () => {
    if (!isPushConfigured) {
      toast.error("Web Push לא מוגדר (חסר מפתח VAPID)")
      return
    }
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicEnv.NEXT_PUBLIC_VAPID_PUBLIC_KEY),
      })
      const json = sub.toJSON()
      const { error } = await supabase.from("push_subscriptions").upsert(
        {
          user_id: currentUserId,
          endpoint: sub.endpoint,
          p256dh: json.keys?.p256dh ?? "",
          auth: json.keys?.auth ?? "",
          user_agent: navigator.userAgent,
        },
        { onConflict: "endpoint" }
      )
      if (error) throw error
      setState((s) => ({ ...s, subscribed: true, permission: Notification.permission }))
      toast.success("התראות הופעלו")
    } catch {
      toast.error("הפעלת ההתראות נכשלה")
    }
  }, [supabase, currentUserId])

  const unsubscribe = React.useCallback(async () => {
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (sub) {
        await supabase.from("push_subscriptions").delete().eq("endpoint", sub.endpoint)
        await sub.unsubscribe()
      }
      setState((s) => ({ ...s, subscribed: false }))
    } catch {
      toast.error("כיבוי ההתראות נכשל")
    }
  }, [supabase])

  return { ...state, subscribe, unsubscribe }
}
