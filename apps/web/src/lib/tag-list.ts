/** How many tags the sidebar lists before the rest move behind "Show all". */
export const SIDEBAR_TAG_LIMIT = 8

/** The most used tags (the API sorts by usage), plus the active one even when it is rarely used. */
export function visibleSidebarTags<T extends { name: string }>(tags: T[], selectedTag?: string, limit = SIDEBAR_TAG_LIMIT) {
  const top = tags.slice(0, limit)
  const selected = selectedTag && !top.some((tag) => tag.name === selectedTag)
    ? tags.find((tag) => tag.name === selectedTag)
    : undefined
  return selected ? [...top, selected] : top
}
