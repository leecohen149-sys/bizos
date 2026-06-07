import { cn } from "@/lib/utils"

/** BizOS wordmark + glyph. */
export function Logo({
  className,
  showText = true,
}: {
  className?: string
  showText?: boolean
}) {
  return (
    <span className={cn("flex items-center gap-2", className)}>
      <span
        aria-hidden
        className="bg-primary text-primary-foreground grid size-8 place-items-center rounded-lg font-bold shadow-sm"
      >
        B
      </span>
      {showText && (
        <span className="text-lg font-semibold tracking-tight">BizOS</span>
      )}
    </span>
  )
}
