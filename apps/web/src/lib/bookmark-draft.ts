export interface BookmarkDraft {
  title: string
  description: string
  notes: string
  folderId: string
  tags: string[]
}

export function bookmarkDraft(bookmark: any): BookmarkDraft {
  return {
    title: bookmark?.title || '', description: bookmark?.description || '', notes: bookmark?.notes || '',
    folderId: bookmark?.folderId || 'none',
    tags: (bookmark?.tags || []).map((tag: any) => typeof tag === 'string' ? tag : tag.name),
  }
}

export function parseBookmarkDraft(raw: string | null): BookmarkDraft | null {
  try {
    const value = JSON.parse(raw || 'null')
    if (!value || !['title', 'description', 'notes', 'folderId'].every((key) => typeof value[key] === 'string') || !Array.isArray(value.tags) || !value.tags.every((tag: unknown) => typeof tag === 'string')) return null
    return { title: value.title, description: value.description, notes: value.notes, folderId: value.folderId, tags: value.tags }
  } catch { return null }
}
