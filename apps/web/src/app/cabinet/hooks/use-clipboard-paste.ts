"use client"

import { useEffect } from "react"
import { toast } from "@/components/ui/sonner"

interface ClipboardPasteOptions {
  createBookmarkMutation: any
  invalidateAllQueries: () => void
  selectedFolderId?: string
  isModalOpen: boolean
}

export function useClipboardPaste({
  createBookmarkMutation,
  invalidateAllQueries,
  selectedFolderId,
  isModalOpen,
}: ClipboardPasteOptions) {
  useEffect(() => {
    const saveBookmarkFromUrl = async (rawText: string) => {
      const text = rawText.trim()
      if (!text) return false

      let targetUrl = ""
      try {
        const urlObj = new URL(text)
        if (urlObj.protocol === "http:" || urlObj.protocol === "https:") {
          targetUrl = urlObj.toString()
        }
      } catch {
        if (/^(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(?:\/.*)?$/i.test(text)) {
          targetUrl = `https://${text}`
        }
      }

      if (!targetUrl) return false

      const toastId = toast.loading("Saving bookmark from clipboard...")

      try {
        const res = await createBookmarkMutation.mutateAsync({
          data: {
            url: targetUrl,
            folderId: selectedFolderId || undefined,
          },
        })
        invalidateAllQueries()
        const savedTitle =
          (res as any)?.data?.title || (res as any)?.title || targetUrl
        toast.success(`Saved: ${savedTitle}`, { id: toastId })
        return true
      } catch (err: any) {
        toast.error(err?.message || "Failed to save bookmark from clipboard", {
          id: toastId,
        })
        return false
      }
    }

    const handlePaste = async (e: ClipboardEvent) => {
      const activeTag = (document.activeElement?.tagName || "").toLowerCase()
      const isEditable =
        activeTag === "input" ||
        activeTag === "textarea" ||
        (document.activeElement as HTMLElement)?.isContentEditable

      if (isEditable || isModalOpen) return

      const clipboardText =
        e.clipboardData?.getData("text/plain") ||
        e.clipboardData?.getData("text") ||
        ""

      if (!clipboardText) return

      const saved = await saveBookmarkFromUrl(clipboardText)
      if (saved) e.preventDefault()
    }

    window.addEventListener("paste", handlePaste)
    return () => {
      window.removeEventListener("paste", handlePaste)
    }
  }, [
    createBookmarkMutation,
    invalidateAllQueries,
    isModalOpen,
    selectedFolderId,
  ])
}
