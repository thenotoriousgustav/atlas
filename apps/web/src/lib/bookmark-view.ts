export function moodboardColumnCount(width: number, _legacy?: unknown): number {
  if (width > 0 && width < 480) return 1
  if (width > 0 && width < 768) return 2
  if (width > 0 && width < 1024) return 3
  return 4
}

export function adjacentPreviewBookmark<T extends { id: string; url?: string; type?: string }>(
  bookmarks: T[], currentId: string, offset: -1 | 1,
) {
  const previewable = bookmarks.filter((bookmark) => bookmark.url && bookmark.type !== "NOTE")
  const index = previewable.findIndex((bookmark) => bookmark.id === currentId)
  return index < 0 ? undefined : previewable[index + offset]
}
