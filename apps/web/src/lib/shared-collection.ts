export type SharedBookmark = {
  id: string
  url: string
  title: string
  description: string | null
  imageUrl: string | null
}

export type SharedCollection = { name: string; bookmarks: SharedBookmark[] }

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
