"use client"

import { useRef } from "react"
import { Paperclip, Download, X, FileText } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  useAttachments,
  useUploadAttachment,
  useDeleteAttachment,
  useDownloadAttachment,
} from "@/features/tasks/attachments-hooks"

function humanSize(bytes: number | null) {
  if (!bytes) return ""
  const units = ["B", "KB", "MB", "GB"]
  let n = bytes
  let i = 0
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024
    i++
  }
  return `${n.toFixed(n < 10 && i > 0 ? 1 : 0)} ${units[i]}`
}

export function TaskAttachments({ taskId }: { taskId: string }) {
  const { data: files = [] } = useAttachments(taskId)
  const upload = useUploadAttachment(taskId)
  const del = useDeleteAttachment(taskId)
  const download = useDownloadAttachment()
  const inputRef = useRef<HTMLInputElement>(null)

  async function open(path: string) {
    try {
      const url = await download(path)
      window.open(url, "_blank", "noopener")
    } catch {
      toast.error("פתיחת הקובץ נכשלה")
    }
  }

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) {
            upload.mutate(file, { onError: () => toast.error("העלאה נכשלה") })
          }
          e.target.value = ""
        }}
      />

      {files.map((f) => (
        <div
          key={f.id}
          className="bg-muted/40 group flex items-center gap-2 rounded px-2 py-1.5 text-sm"
        >
          <FileText className="text-muted-foreground size-4 shrink-0" />
          <span className="flex-1 truncate">{f.file_name}</span>
          <span className="text-muted-foreground text-xs">{humanSize(f.size)}</span>
          <button
            onClick={() => open(f.storage_path)}
            className="text-muted-foreground hover:text-foreground"
            aria-label="הורדה"
          >
            <Download className="size-4" />
          </button>
          <button
            onClick={() => del.mutate(f)}
            className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100"
            aria-label="מחיקה"
          >
            <X className="size-4" />
          </button>
        </div>
      ))}

      <Button
        variant="outline"
        size="sm"
        onClick={() => inputRef.current?.click()}
        disabled={upload.isPending}
        className="gap-1.5"
      >
        <Paperclip className="size-3.5" />
        {upload.isPending ? "מעלה…" : "צירוף קובץ"}
      </Button>
    </div>
  )
}
