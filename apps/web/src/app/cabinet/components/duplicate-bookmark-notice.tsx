"use client"

import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { bookmarkUrl } from '@/lib/bookmark-url'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { findExistingBookmark } from '../hooks/use-bookmark-search'

export function DuplicateBookmarkNotice({ url, excludeId }: { url: string; excludeId?: string }) {
  const canonical = bookmarkUrl(url || '')
  const [debounced, setDebounced] = useState(canonical)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(canonical), 350)
    return () => clearTimeout(timer)
  }, [canonical])
  const query = useQuery({
    queryKey: ['/v1/bookmarks', 'duplicate', debounced, excludeId],
    queryFn: ({ signal }) => findExistingBookmark(debounced!, signal, excludeId),
    enabled: !!debounced && debounced === canonical,
    retry: false,
  })
  if (!canonical || debounced !== canonical) return null
  if (query.isError) return <p role="status" className="text-xs text-muted-foreground">Could not check for existing links. You can still save this bookmark. <Button type="button" variant="link" size="xs" onClick={() => void query.refetch()}>Retry check</Button></p>
  if (!query.data) return null
  return <Alert role="status"><AlertTitle>Already in your Cabinet</AlertTitle><AlertDescription>
    <p>{query.data.title || canonical}{query.data.folder?.name ? ` · ${query.data.folder.name}` : ''}. Saving will create another copy.</p>
    <Button type="button" variant="link" size="xs" asChild><a href={canonical} target="_blank" rel="noopener noreferrer">Open existing link</a></Button>
  </AlertDescription></Alert>
}
