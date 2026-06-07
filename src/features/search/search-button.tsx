"use client"

import { Search } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useUiStore } from "@/lib/store/ui"

export function SearchIconButton() {
  const setOpen = useUiStore((s) => s.setCommandPaletteOpen)
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setOpen(true)}
      aria-label="חיפוש"
    >
      <Search className="size-5" />
    </Button>
  )
}

export function SearchButton() {
  const setOpen = useUiStore((s) => s.setCommandPaletteOpen)
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => setOpen(true)}
      className="text-muted-foreground w-full max-w-xs justify-start gap-2 font-normal"
    >
      <Search className="size-4" />
      <span className="flex-1 text-start">חיפוש…</span>
      <kbd className="bg-muted pointer-events-none hidden rounded px-1.5 font-mono text-[10px] sm:inline">
        ⌘K
      </kbd>
    </Button>
  )
}
