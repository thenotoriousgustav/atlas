export function moodboardColumnCount(width: number, preferred: number) {
  const available = width < 560 ? 2 : width < 880 ? 3 : 4
  return Math.min(Math.max(1, preferred), available)
}

export function adjacentPreviewBookmark<T extends { id: string; url?: string; type?: string }>(
  bookmarks: T[], currentId: string, offset: -1 | 1,
) {
  const previewable = bookmarks.filter((bookmark) => bookmark.url && bookmark.type !== "NOTE")
  const index = previewable.findIndex((bookmark) => bookmark.id === currentId)
  return index < 0 ? undefined : previewable[index + offset]
}
