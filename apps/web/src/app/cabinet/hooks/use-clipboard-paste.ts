"use client"

import { useEffect, useRef } from "react"
import { toast } from "@/components/ui/sonner"
import { bookmarkUrl } from "@/lib/bookmark-url"
import { findExistingBookmark } from "./use-bookmark-search"

interface ClipboardPasteOptions {
  createBookmarkMutation: any
  invalidateAllQueries: () => void
  selectedFolderId?: string
  isModalOpen: boolean
  onEditBookmark?: (bookmark: any) => void
}

export function useClipboardPaste(options: ClipboardPasteOptions) {
  const latest = useRef(options)
  latest.current = options
  const inFlight = useRef(new Set<string>())
  useEffect(() => {
    let mounted = true
    const controllers = new Set<AbortController>()
    const toastIds = new Set<string | number>()
    const handlePaste = (event: ClipboardEvent) => {
      const { createBookmarkMutation, invalidateAllQueries, selectedFolderId, isModalOpen } = latest.current
      const active = document.activeElement as HTMLElement | null
      if (isModalOpen || active?.closest('input, textarea, [contenteditable="true"], [role="dialog"], [role="alertdialog"]') || document.querySelector('[role="dialog"], [role="alertdialog"]')) return
      const text = (event.clipboardData?.getData('text/plain') || '').trim()
      const canonical = bookmarkUrl(text)
      if (!canonical) return
      event.preventDefault()
      if (inFlight.current.has(canonical)) return
      inFlight.current.add(canonical)
      const controller = new AbortController()
      controllers.add(controller)
      const save = async () => {
        const id = toast.loading('Saving bookmark from clipboard…')
        toastIds.add(id)
        const action = (bookmark: any) => latest.current.onEditBookmark && bookmark?.id && bookmark.canEdit !== false
          ? { label: 'Edit', onClick: () => { if (mounted) latest.current.onEditBookmark?.(bookmark) } } : undefined
        try {
          const existing = await findExistingBookmark(canonical, controller.signal)
          if (!mounted) return
          if (existing) {
            toast.info('This link is already in your Cabinet', { id, action: action(existing) })
            return
          }
          // Keep the user's fragment for opening the original; normalization is only for matching.
          const url = /^[a-z][a-z\d+.-]*:/i.test(text) ? text : `https://${text}`
          const response = await createBookmarkMutation.mutateAsync({ data: { url, folderId: selectedFolderId || undefined } })
          if (!mounted) return
          const saved = response?.data?.data ?? response?.data ?? response
          invalidateAllQueries()
          toast.success(`Saved: ${saved?.title || url}`, { id, action: action(saved), duration: 8000 })
        } catch {
          if (mounted) toast.error('Could not check or save this link. Try Add bookmark.', { id })
        } finally {
          controllers.delete(controller)
          inFlight.current.delete(canonical)
        }
      }
      void save()
    }
    window.addEventListener('paste', handlePaste)
    return () => {
      mounted = false
      window.removeEventListener('paste', handlePaste)
      controllers.forEach((controller) => controller.abort())
      toastIds.forEach((id) => toast.dismiss(id))
    }
  }, [])
}
