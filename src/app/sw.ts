/// <reference lib="webworker" />
/// <reference types="@serwist/next/typings" />
import { defaultCache } from "@serwist/next/worker"
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist"
import { Serwist } from "serwist"

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined
  }
}

declare const self: ServiceWorkerGlobalScope

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
  fallbacks: {
    entries: [
      {
        url: "/~offline",
        matcher: ({ request }) => request.destination === "document",
      },
    ],
  },
})

serwist.addEventListeners()

// --- Web Push (wired in Phase 3; handlers present so the SW is push-ready) ---
self.addEventListener("push", (event) => {
  if (!event.data) return
  const data = (() => {
    try {
      return event.data.json()
    } catch {
      return { title: "BizOS", body: event.data.text() }
    }
  })()
  event.waitUntil(
    self.registration.showNotification(data.title ?? "BizOS", {
      body: data.body,
      icon: data.icon ?? "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      dir: "rtl",
      lang: "he",
      data: data.data ?? {},
    })
  )
})

self.addEventListener("notificationclick", (event) => {
  event.notification.close()
  const url = (event.notification.data?.url as string) ?? "/"
  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then((clients) => {
      for (const client of clients) {
        if ("focus" in client) return client.focus()
      }
      return self.clients.openWindow(url)
    })
  )
})
