"use client"

import { useEffect, useState } from "react"
import { useInfiniteQuery } from "@tanstack/react-query"
import { AXIOS_INSTANCE } from "@/lib/api-client"
import { bookmarkUrl } from "@/lib/bookmark-url"

export async function searchBookmarks(search: string, cursor?: string, signal?: AbortSignal, limit = 20) {
  const response = await AXIOS_INSTANCE.get('/v1/bookmarks', {
    params: { search, cursor, limit, sort: 'newest' }, signal,
  })
  const result = response.data?.data ?? response.data
  return result as { data: any[]; nextCursor?: string | null; totalCount?: number }
}

export async function findExistingBookmark(url: string, signal?: AbortSignal, excludeId?: string) {
  const canonical = bookmarkUrl(url)
  if (!canonical) return null
  let cursor: string | undefined
  const seen = new Set<string>()
  do {
    // Match across URL spellings (default ports, fragments and trailing slashes).
    // ponytail: scan this host's pages; add an indexed canonical URL if large libraries make this slow.
    const page = await searchBookmarks(new URL(canonical).hostname, cursor, signal, 100)
    const match = page.data.find((item) => item.id !== excludeId && bookmarkUrl(item.url || '') === canonical)
    if (match) return match
    cursor = page.nextCursor || undefined
    if (cursor && seen.has(cursor)) break
    if (cursor) seen.add(cursor)
  } while (cursor)
  return null
}

export function useBookmarkSearch(value: string, enabled: boolean) {
  const search = value.trim()
  const [debounced, setDebounced] = useState(search)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(search), 250)
    return () => clearTimeout(timer)
  }, [search])
  const query = useInfiniteQuery({
    queryKey: ['/v1/bookmarks', 'search', debounced],
    queryFn: ({ pageParam, signal }) => searchBookmarks(debounced, pageParam, signal),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (page) => page.nextCursor || undefined,
    enabled: enabled && !!debounced && debounced === search,
    retry: false,
  })
  return { ...query, isDebouncing: search !== debounced, items: query.data?.pages.flatMap((page) => page.data) || [] }
}
