import type { DragEvent as ReactDragEvent } from "react"

// Prepare this before dragstart so the browser uses a decoded, transparent image.
const emptyImage = typeof Image === "undefined" ? null : new Image()
if (emptyImage) emptyImage.src = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"

export function startBookmarkDrag(event: ReactDragEvent<HTMLElement>, ids: string[], title: string) {
  event.dataTransfer.setData("application/json", JSON.stringify(ids))
  event.dataTransfer.setData("text/plain", JSON.stringify(ids))
  event.dataTransfer.effectAllowed = "move"
  if (emptyImage) event.dataTransfer.setDragImage(emptyImage, 0, 0)

  const rect = event.currentTarget.getBoundingClientRect()
  const offsetX = event.clientX - rect.left
  const offsetY = event.clientY - rect.top
  const preview = document.createElement("div")
  preview.setAttribute("data-bookmark-drag-preview", "card")
  preview.setAttribute("aria-hidden", "true")
  Object.assign(preview.style, { position: "fixed", pointerEvents: "none", zIndex: "2147483647" })
  const card = event.currentTarget.cloneNode(true) as HTMLElement
  card.removeAttribute("id")
  Object.assign(card.style, { width: `${rect.width}px`, height: `${rect.height}px`, margin: "0", boxSizing: "border-box" })
  const badge = document.createElement("div")
  badge.textContent = ids.length > 1 ? `${ids.length} bookmarks` : title
  Object.assign(badge.style, {
    maxWidth: "180px", padding: "6px 10px", borderRadius: "6px",
    background: "var(--popover)", color: "var(--popover-foreground)",
    border: "1px solid var(--border)", font: "500 12px system-ui",
    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
  })
  preview.append(card, badge)

  const move = (event: { clientX: number; clientY: number; target: EventTarget | null }) => {
    const compact = event.target instanceof Element && !!event.target.closest("[data-bookmark-sidebar]")
    preview.setAttribute("data-bookmark-drag-preview", compact ? "compact" : "card")
    card.style.display = compact ? "none" : ""
    badge.style.display = compact ? "block" : "none"
    preview.style.left = `${event.clientX + (compact ? 16 : -offsetX)}px`
    preview.style.top = `${event.clientY + (compact ? 16 : -offsetY)}px`
  }
  move(event)
  document.body.appendChild(preview)
  const cleanup = () => {
    preview.remove()
    document.removeEventListener("dragover", move, { capture: true })
    document.removeEventListener("drop", cleanup, { capture: true })
    document.removeEventListener("dragend", cleanup, { capture: true })
  }
  document.addEventListener("dragover", move, { capture: true })
  document.addEventListener("drop", cleanup, { capture: true })
  document.addEventListener("dragend", cleanup, { capture: true })
}
