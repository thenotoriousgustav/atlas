import type React from "react"
import { editorPath } from "./bookmark-kind"
import { safeHttpUrl } from "./shared-collection"

/** Where ⌘/Ctrl-click sends an item: the original page, or the note editor. */
export function bookmarkOriginalHref(bookmark: { id: string; url?: string | null; type?: string | null }) {
  return editorPath(bookmark) ?? safeHttpUrl(bookmark.url || "")?.href
}

/**
 * One click rule for every part of a saved item:
 * click opens it in Cabinet, Shift-click (or any click while selecting) toggles selection,
 * and ⌘/Ctrl-click opens the original in a new tab.
 */
export function activateBookmark(
  event: React.MouseEvent,
  {
    bookmark,
    selectionMode,
    onToggleSelect,
    onOpen,
  }: {
    bookmark: { id: string; url?: string | null; type?: string | null }
    selectionMode: boolean
    onToggleSelect: () => void
    onOpen: () => void
  }
) {
  event.stopPropagation()
  if (selectionMode || event.shiftKey) {
    event.preventDefault()
    onToggleSelect()
    return
  }
  if (event.metaKey || event.ctrlKey) {
    // A real link already opens in a new tab with the modifier held.
    if (event.currentTarget instanceof HTMLAnchorElement) return
    event.preventDefault()
    const href = bookmarkOriginalHref(bookmark)
    if (href) window.open(href, "_blank", "noopener,noreferrer")
    return
  }
  event.preventDefault()
  onOpen()
}
