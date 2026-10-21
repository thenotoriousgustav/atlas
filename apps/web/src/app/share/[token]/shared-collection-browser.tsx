"use client"

import * as React from "react"
import { ArrowSquareOut, Copy, FolderSimple, List, MagnifyingGlass, SquaresFour, X } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Empty, EmptyHeader, EmptyTitle, EmptyDescription, EmptyMedia } from "@/components/ui/empty"
import { Masonry, MasonryItem } from "@/components/ui/masonry"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"
import type { SharedCollectionItem } from "@/lib/shared-collection"

const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"

function SharedBookmarkLink({ item, view }: { item: SharedCollectionItem; view: "grid" | "list" }) {
  const [imageFailed, setImageFailed] = React.useState(false)
  return (
    <a href={item.href} target="_blank" rel="noopener noreferrer"
      className={cn(
        "group flex w-full border-border bg-card text-card-foreground transition-colors hover:border-foreground/40 focus-visible:outline-2 focus-visible:outline-offset-4",
        view === "grid" ? "flex-col overflow-hidden rounded-lg border" : "items-start gap-4 py-4 sm:items-center",
      )}
    >
      {view === "grid" && item.preview && !imageFailed && (
        <div className="overflow-hidden border-b border-border bg-muted/40">
          <img src={item.preview} alt="" loading="lazy" decoding="async" onError={() => setImageFailed(true)}
            className="block max-h-80 w-full object-cover" />
        </div>
      )}
      <div className={cn("flex min-w-0 flex-1 flex-col gap-2", view === "grid" && "p-4")}>
        <h2 className="break-words text-sm leading-snug font-semibold group-hover:underline">{item.title || item.hostname}</h2>
        {item.description && <p className={cn("break-words text-xs leading-relaxed text-muted-foreground", view === "grid" ? "line-clamp-3" : "line-clamp-2")}>{item.description}</p>}
        {view === "list" && <span className="truncate text-xs text-muted-foreground">{item.hostname}</span>}
      </div>
      <div className={cn("flex shrink-0 items-center gap-2 text-muted-foreground", view === "grid" && "justify-between border-t border-border px-4 py-2.5")}>
        {view === "grid" && <span className="min-w-0 truncate text-xs">{item.hostname}</span>}
        <ArrowSquareOut className="size-3.5 shrink-0" aria-hidden="true" />
        <span className="sr-only">Opens in a new tab</span>
      </div>
    </a>
  )
}

export function SharedCollectionBrowser({ token, items }: { token: string; items: SharedCollectionItem[] }) {
  const [query, setQuery] = React.useState("")
  const [view, setView] = React.useState<"grid" | "list">("grid")
  const [columns, setColumns] = React.useState(1)
  const containerRef = React.useRef<HTMLDivElement>(null)
  const copyInFlight = React.useRef(false)
  const [isCopying, setIsCopying] = React.useState(false)
  const [copyError, setCopyError] = React.useState<string | null>(null)
  const [copied, setCopied] = React.useState<{ folderId: string; count: number } | null>(null)
  const search = query.trim().toLowerCase()
  const filtered = React.useMemo(() => items.filter((item) => item.searchText.includes(search)), [items, search])

  React.useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const resize = () => setColumns(Math.max(1, Math.min(3, Math.floor((container.clientWidth + 16) / 280))))
    resize()
    const observer = new ResizeObserver(resize)
    observer.observe(container)
    return () => observer.disconnect()
  }, [])

  async function copyCollection() {
    if (copyInFlight.current || copied) return
    copyInFlight.current = true
    setIsCopying(true)
    setCopyError(null)
    try {
      const response = await fetch(`${apiUrl}/v1/folders/shared/${token}/copy`, {
        method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: "{}",
      })
      if (response.status === 401) {
        window.location.assign(`/login?next=${encodeURIComponent(`/share/${token}`)}`)
        return
      }
      if (response.status === 404) throw new Error("This collection is no longer shared. Reload the page to check its availability.")
      if (!response.ok) throw new Error("Could not copy this collection. Please try again.")
      const { data } = await response.json() as { data: { folderId: string; copied: number } }
      if (!data || !/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(data.folderId) || !Number.isInteger(data.copied) || data.copied < 0) throw new Error("Could not confirm the copied collection. Please reload your Cabinet.")
      setCopied({ folderId: data.folderId, count: data.copied })
    } catch (error) {
      setCopyError(error instanceof Error ? error.message : "Could not copy this collection. Please try again.")
    } finally {
      copyInFlight.current = false
      setIsCopying(false)
    }
  }

  return (
    <section ref={containerRef} className="flex flex-1 flex-col gap-6 py-6 sm:py-8" aria-label="Shared bookmarks">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:flex-wrap">
        <div className="flex w-full min-w-0 flex-1 items-center gap-3 sm:w-auto">
          <InputGroup className="h-9 min-w-0 flex-1 sm:w-72 sm:flex-initial">
            <InputGroupAddon><MagnifyingGlass /></InputGroupAddon>
            <InputGroupInput type="search" aria-label="Search this collection" placeholder="Search this collection…" value={query} onChange={(event) => setQuery(event.target.value)} />
            {query && <InputGroupAddon align="inline-end"><Button variant="ghost" size="icon-xs" onClick={() => setQuery("")} aria-label="Clear search"><X /></Button></InputGroupAddon>}
          </InputGroup>
          <ToggleGroup type="single" variant="outline" spacing={0} size="lg" value={view} aria-label="Collection view"
            onValueChange={(value) => { if (value === "grid" || value === "list") setView(value) }}>
            <ToggleGroupItem value="grid" aria-label="Grid view"><SquaresFour /><span className="sr-only">Grid</span></ToggleGroupItem>
            <ToggleGroupItem value="list" aria-label="List view"><List /><span className="sr-only">List</span></ToggleGroupItem>
          </ToggleGroup>
        </div>
        <div className="flex max-w-full flex-col items-start gap-2 sm:items-end">
          {copied ? (
            // A full navigation gives Cabinet a fresh query cache after copying.
            <Button asChild><a href={`/cabinet?folder=${copied.folderId}`}>Open copied collection<ArrowSquareOut data-icon="inline-end" /></a></Button>
          ) : (
            <Button onClick={copyCollection} disabled={isCopying} aria-busy={isCopying}>
              {isCopying ? <Spinner data-icon="inline-start" aria-hidden="true" /> : <Copy data-icon="inline-start" />}
              {isCopying ? "Copying…" : "Copy Collection"}
            </Button>
          )}
          {copyError && <p role="alert" className="max-w-sm text-xs text-destructive">{copyError}</p>}
          <p className="text-xs text-muted-foreground" role={copied ? "status" : undefined}>
            {copied ? `${copied.count} bookmarks copied to your Cabinet.` : `Save all ${items.length} bookmarks as a private copy.`}
          </p>
        </div>
      </div>
      <p role="status" aria-live="polite" className="text-xs text-muted-foreground">
        {search ? `${filtered.length} of ${items.length}` : items.length} bookmark{(search ? filtered.length : items.length) === 1 ? "" : "s"}
      </p>
      {!filtered.length ? (
        <Empty className="border border-border py-16">
          <EmptyHeader>
            <EmptyMedia variant="icon"><FolderSimple /></EmptyMedia>
            <EmptyTitle>{items.length ? "No matching bookmarks" : "No bookmarks in this collection"}</EmptyTitle>
            <EmptyDescription>{items.length ? "Try a different title, description, or website." : "Shared links added directly to this folder will appear here."}</EmptyDescription>
          </EmptyHeader>
          {search && <Button variant="outline" onClick={() => setQuery("")}>Clear search</Button>}
        </Empty>
      ) : view === "grid" ? (
        <Masonry columnCount={columns} gap={16} linear virtualize={false} role="list" aria-label="Bookmarks" data-view="grid">
          {filtered.map((item) => <MasonryItem key={item.id} role="listitem"><SharedBookmarkLink item={item} view="grid" /></MasonryItem>)}
        </Masonry>
      ) : (
        <ul aria-label="Bookmarks" data-view="list" className="flex flex-col divide-y divide-border">
          {filtered.map((item) => <li key={item.id}><SharedBookmarkLink item={item} view="list" /></li>)}
        </ul>
      )}
    </section>
  )
}
