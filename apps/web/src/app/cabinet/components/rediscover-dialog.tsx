"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import { Archive, ArrowLeft, ArrowRight, Eye, Shuffle, Star, Trash } from "@phosphor-icons/react"
import { AXIOS_INSTANCE } from "@/lib/api-client"
import { getProxiedImageUrl } from "@/lib/bookmark-image"
import { highlightQuote, isDrawingBookmark, isNoteBookmark } from "@/lib/bookmark-kind"
import { safeHttpUrl } from "@/lib/shared-collection"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"

/** "3 months ago": how long an item has waited in the library. */
export function savedAgo(createdAt: string, now = Date.now()) {
  const days = Math.max(0, Math.round((now - new Date(createdAt).getTime()) / 86_400_000))
  const format = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" })
  if (days < 30) return format.format(-days, "day")
  if (days < 365) return format.format(-Math.round(days / 30), "month")
  return format.format(-Math.round(days / 365), "year")
}

function ItemPreview({ item }: { item: any }) {
  const [imageFailed, setImageFailed] = React.useState(false)
  const quote = highlightQuote(item)
  const site = safeHttpUrl(item.url || "")?.hostname.replace(/^www\./, "")
  const frame = "w-full max-w-xl overflow-hidden rounded-lg bg-card shadow-[0_1px_2px_rgb(0_0_0/0.04),0_12px_32px_-18px_rgb(0_0_0/0.28)] dark:shadow-none dark:ring-1 dark:ring-border/60"

  if (quote) {
    return (
      <figure className={cn(frame, "flex flex-col items-center gap-2 px-10 py-8 text-center font-serif")}>
        <span aria-hidden="true" className="text-3xl leading-none text-muted-foreground">“</span>
        <blockquote className="line-clamp-[12] text-xl leading-relaxed whitespace-pre-line">{quote}</blockquote>
        <span aria-hidden="true" className="text-3xl leading-none text-muted-foreground">”</span>
      </figure>
    )
  }
  if (isDrawingBookmark(item)) {
    return (
      <div className={cn(frame, "flex aspect-[16/10] items-center justify-center bg-white dark:hue-rotate-180 dark:invert")}>
        {item.imageUrl ? <img src={item.imageUrl} alt="" className="size-full object-contain p-4" /> : <span className="text-sm text-neutral-500">Empty drawing</span>}
      </div>
    )
  }
  if (isNoteBookmark(item)) {
    return (
      <div className={cn(frame, "p-8")}>
        <p className="line-clamp-[12] text-sm leading-relaxed whitespace-pre-line">{item.notes || item.description || "This note is empty."}</p>
      </div>
    )
  }
  const image = getProxiedImageUrl(item.imageUrl)
  if (image && !imageFailed) {
    return <img src={image} alt={item.title || site || ""} onError={() => setImageFailed(true)} className={cn(frame, "max-h-[44dvh] w-auto object-contain")} />
  }
  return (
    <div className={cn(frame, "flex min-h-48 flex-col gap-3 p-8")}>
      {site && <span className="truncate font-serif text-base text-muted-foreground">{item.siteName || site}</span>}
      <span className="line-clamp-4 font-serif text-2xl leading-snug">{item.title || item.url}</span>
    </div>
  )
}

/**
 * One saved item at a time, oldest saves first, to keep, favorite, archive or trash.
 * Archive and Trash go through the library's own handlers, so their undo toasts still apply.
 */
export function RediscoverDialog({ session, open, onOpenChange, onOpenItem, onToggleFavorite, onArchive, onTrash }: {
  /** Changes on every opening, so each visit asks the server for a fresh selection. */
  session: number
  open: boolean
  onOpenChange: (open: boolean) => void
  onOpenItem: (item: any) => void
  onToggleFavorite: (item: any) => void
  onArchive: (item: any) => void
  onTrash: (id: string) => void
}) {
  const [round, setRound] = React.useState(0)
  const query = useQuery({
    queryKey: ["/v1/bookmarks/rediscover", session, round],
    queryFn: async () => {
      const response = await AXIOS_INSTANCE.get("/v1/bookmarks/rediscover", { params: { limit: 12 } })
      return (response.data?.data ?? response.data ?? []) as any[]
    },
    enabled: open,
    gcTime: 0,
    refetchOnWindowFocus: false,
  })
  const [index, setIndex] = React.useState(0)
  // Archived or trashed items leave the batch, so the next one slides into place.
  const [dismissed, setDismissed] = React.useState<string[]>([])
  const [favorites, setFavorites] = React.useState<Record<string, boolean>>({})
  const items = (query.data ?? [])
    .filter((entry) => !dismissed.includes(entry.id))
    .map((entry) => entry.id in favorites ? { ...entry, isFavorite: favorites[entry.id] } : entry)

  const item = items[index] as any | undefined
  // Reached the end, or archived and trashed everything in the batch.
  const finished = !!query.data && query.data.length > 0 && !item
  const keep = () => setIndex((value) => Math.min(value + 1, items.length))
  const back = () => setIndex((value) => Math.max(value - 1, 0))
  const shuffle = () => {
    setRound((value) => value + 1)
    setIndex(0)
    setDismissed([])
    setFavorites({})
  }
  const favorite = () => {
    if (!item) return
    onToggleFavorite(item)
    setFavorites((current) => ({ ...current, [item.id]: !item.isFavorite }))
  }
  const archive = () => { if (item) { onArchive(item); setDismissed((current) => [...current, item.id]) } }
  const trash = () => { if (item) { onTrash(item.id); setDismissed((current) => [...current, item.id]) } }
  const openItem = () => { if (item) { onOpenChange(false); onOpenItem(item) } }

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.metaKey || event.ctrlKey || event.altKey || !item) return
    const run = { ArrowRight: keep, ArrowLeft: back, f: favorite, a: archive, o: openItem }[event.key]
    if (run) {
      event.preventDefault()
      run()
    }
  }
  const site = item ? safeHttpUrl(item.url || "")?.hostname.replace(/^www\./, "") : undefined

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[94dvh] flex-col gap-5 overflow-y-auto sm:max-w-2xl" onKeyDown={onKeyDown}>
        <div className="flex flex-col gap-1 pr-8">
          <DialogTitle className="flex items-center gap-2"><Shuffle aria-hidden="true" /> Rediscover</DialogTitle>
          <DialogDescription>Things you saved a while ago. Keep what still matters, clear what doesn&apos;t.</DialogDescription>
        </div>

        {query.isPending && (
          <div role="status" className="flex min-h-72 items-center justify-center gap-2 text-sm text-muted-foreground"><Spinner aria-hidden="true" /> Picking a few old saves…</div>
        )}
        {query.isError && (
          <div role="alert" className="flex min-h-72 flex-col items-center justify-center gap-3 text-sm">
            Could not load items to rediscover.
            <Button variant="outline" onClick={() => void query.refetch()}>Try again</Button>
          </div>
        )}
        {query.data && query.data.length === 0 && (
          <p role="status" className="flex min-h-72 items-center justify-center text-center text-sm text-muted-foreground">Nothing to rediscover yet. Save a few things and come back.</p>
        )}
        {finished && (
          <div role="status" className="flex min-h-72 flex-col items-center justify-center gap-3 text-center text-sm text-muted-foreground">
            <p className="text-base text-foreground">That&apos;s this batch.</p>
            <p>Everything you kept stays in your library.</p>
            <div className="flex gap-2">
              <Button onClick={shuffle}><Shuffle data-icon="inline-start" /> Shuffle again</Button>
              <Button variant="outline" onClick={() => onOpenChange(false)}>Done</Button>
            </div>
          </div>
        )}

        {item && (
          <>
            <div className="flex min-h-0 justify-center bg-muted/30 px-2 py-6 sm:rounded-lg">
              <ItemPreview key={item.id} item={item} />
            </div>
            <div className="flex flex-col gap-1.5" aria-live="polite">
              <p className="line-clamp-2 text-lg font-medium">{item.title || site || "Untitled"}</p>
              <p className="text-sm text-muted-foreground">
                {[site, item.createdAt && `Saved ${savedAgo(item.createdAt)}`, item.folder?.name].filter(Boolean).join(" · ")}
              </p>
              {item.description && !isNoteBookmark(item) && <p className="line-clamp-2 text-sm text-muted-foreground">{item.description}</p>}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" size="icon" aria-label="Previous item (Left arrow)" title="Previous (←)" disabled={index === 0} onClick={back}><ArrowLeft /></Button>
              <span className="text-sm text-muted-foreground tabular-nums">{index + 1} of {items.length}</span>
              <div className="ml-auto flex flex-wrap justify-end gap-2">
                <Button variant="ghost" onClick={openItem} title="Open (O)"><Eye data-icon="inline-start" /> Open</Button>
                <Button variant="ghost" onClick={favorite} aria-pressed={!!item.isFavorite} title="Favorite (F)">
                  <Star data-icon="inline-start" weight={item.isFavorite ? "fill" : "regular"} className={cn(item.isFavorite && "text-amber-500 dark:text-amber-400")} /> {item.isFavorite ? "Favorited" : "Favorite"}
                </Button>
                <Button variant="ghost" onClick={archive} title="Archive (A)"><Archive data-icon="inline-start" /> Archive</Button>
                <Button variant="ghost" className="text-destructive hover:text-destructive" onClick={trash}><Trash data-icon="inline-start" /> Trash</Button>
                <Button onClick={keep} title="Keep (→)">Keep <ArrowRight data-icon="inline-end" /></Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
