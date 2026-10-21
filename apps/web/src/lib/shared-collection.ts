export type SharedBookmark = {
  id: string
  url: string
  title: string
  description: string | null
  imageUrl: string | null
}

export type SharedNote = { id: string; title: string; text: string }

export type SharedDrawing = { id: string; title: string; preview: string | null }

export type SharedCollection = { name: string; bookmarks: SharedBookmark[]; notes?: SharedNote[]; drawings?: SharedDrawing[] }

/** Shared drawings show only an embedded image preview; any other address is dropped. */
export function sharedDrawingItems(drawings: SharedDrawing[] = []) {
  return drawings.map((drawing) => ({
    ...drawing,
    title: drawing.title || "Untitled drawing",
    preview: drawing.preview && /^data:image\/(png|webp|jpeg);base64,/.test(drawing.preview) ? drawing.preview : null,
    searchText: (drawing.title || "").toLowerCase(),
  }))
}

export type SharedDrawingItem = ReturnType<typeof sharedDrawingItems>[number]

/** Notes shared with a public collection, indexed for the page's local search. */
export function sharedNoteItems(notes: SharedNote[] = []) {
  return notes.map((note) => ({
    ...note,
    title: note.title || "Untitled note",
    searchText: `${note.title} ${note.text}`.toLowerCase(),
  }))
}

export type SharedNoteItem = ReturnType<typeof sharedNoteItems>[number]

export function safeHttpUrl(url: string) {
  try {
    const parsed = new URL(url)
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return { href: parsed.href, hostname: parsed.hostname.replace(/^www\./, "") }
    }
  } catch {}
  return null
}

export function sharedCollectionItems(bookmarks: SharedBookmark[], apiUrl: string) {
  return bookmarks.flatMap((bookmark) => {
    const safe = safeHttpUrl(bookmark.url)
    if (!safe) return []
    const image = bookmark.imageUrl ? safeHttpUrl(bookmark.imageUrl) : null
    return [{
      ...bookmark,
      ...safe,
      preview: image ? `${apiUrl}/v1/bookmarks/proxy-image?v=2&url=${encodeURIComponent(image.href)}` : null,
      searchText: `${bookmark.title} ${bookmark.description || ""} ${safe.href} ${safe.hostname}`.toLowerCase(),
    }]
  })
}

export type SharedCollectionItem = ReturnType<typeof sharedCollectionItems>[number]
