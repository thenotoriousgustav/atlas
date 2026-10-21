"use client"

import { useEffect, useState, type ReactNode } from "react"
import { useQuery } from "@tanstack/react-query"
import { AXIOS_INSTANCE } from "@/lib/api-client"
import { ArrowClockwise, ArrowSquareOut, CaretLeft, CaretRight, SidebarSimple, X } from "@phosphor-icons/react"
import { getProxiedImageUrl } from "@/lib/bookmark-image"
import { Spinner } from "@/components/ui/spinner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"
import { safeHttpUrl } from "@/lib/shared-collection"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"

type PreviewBookmark = { id: string; url: string; title?: string; description?: string | null; imageUrl?: string | null }

export function BookmarkWebview({
  bookmark,
  onClose,
  onPrevious,
  onNext,
  inspector,
  showDetails = true,
  onToggleDetails,
}: {
  bookmark: PreviewBookmark
  onClose: () => void
  onPrevious?: () => void
  onNext?: () => void
  inspector?: ReactNode
  showDetails?: boolean
  onToggleDetails?: () => void
}) {
  const [reload, setReload] = useState(0)
  const [status, setStatus] = useState<"loading" | "loaded" | "slow" | "error">("loading")
  const website = safeHttpUrl(bookmark.url)
  // Browsers report a normal load even when a site forbids framing, so ask the server first.
  const embedCheck = useQuery({
    queryKey: ["/v1/bookmarks/embeddable", website?.href],
    queryFn: async () => {
      const response = await AXIOS_INSTANCE.get("/v1/bookmarks/embeddable", { params: { url: website?.href } })
      return Boolean(response.data?.data?.embeddable ?? response.data?.embeddable ?? true)
    },
    enabled: !!website,
    staleTime: 24 * 60 * 60 * 1000,
    retry: false,
  })
  const blocked = embedCheck.data === false
  const [showSummary, setShowSummary] = useState(false)
  const thumbnail = getProxiedImageUrl(bookmark.imageUrl)
  const [thumbnailFailed, setThumbnailFailed] = useState(false)
  const showReference = blocked || showSummary
  const showFrame = !!website && !blocked && !embedCheck.isPending

  useEffect(() => {
    if (!showFrame || status !== "loading") return
    const timeout = window.setTimeout(() => setStatus("slow"), 6000)
    return () => window.clearTimeout(timeout)
  }, [showFrame, status, reload])

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent
        showCloseButton={false}
        className="flex h-[94dvh] max-w-[calc(100%-1rem)] flex-col gap-0 overflow-hidden rounded-xl p-0 sm:max-w-[calc(100%-3rem)]"
        onKeyDown={(event) => {
          if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return
          if ((event.target as HTMLElement).closest('input, textarea, select, [contenteditable], [aria-label="Bookmark inspector"], [role="combobox"], [role="menu"], [role="listbox"]')) return
          const navigate = event.key === "ArrowLeft" ? onPrevious : event.key === "ArrowRight" ? onNext : undefined
          if (navigate) {
            event.preventDefault()
            navigate()
          }
        }}
      >
        <header className="flex min-h-16 shrink-0 flex-wrap items-center gap-2 border-b bg-card px-4 py-3 sm:gap-3">
          <div className="min-w-0 flex-1">
            <DialogTitle className="truncate">{bookmark.title || website?.hostname || "Website preview"}</DialogTitle>
            <DialogDescription className="truncate">{website?.hostname || "Invalid website URL"}</DialogDescription>
          </div>
          <div className="flex items-center gap-1" aria-label="Bookmark navigation">
            <Button variant="ghost" size="icon-sm" aria-label="Previous item (Left arrow)" title="Previous (←)" disabled={!onPrevious} onClick={onPrevious}>
              <CaretLeft />
            </Button>
            <Button variant="ghost" size="icon-sm" aria-label="Next item (Right arrow)" title="Next (→)" disabled={!onNext} onClick={onNext}>
              <CaretRight />
            </Button>
          </div>
          {showFrame && !showSummary && (
            <Button variant="ghost" size="icon-sm" aria-label="Reload website" title="Reload" onClick={() => { setStatus("loading"); setReload((value) => value + 1) }}>
              <ArrowClockwise />
            </Button>
          )}
          {website && (
            <Button size="sm" asChild>
              <a href={website.href} target="_blank" rel="noopener noreferrer">
                <ArrowSquareOut data-icon="inline-start" />
                Open original
              </a>
            </Button>
          )}
          {inspector && (
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={showDetails ? "Hide details panel" : "Show details panel"}
              title={showDetails ? "Hide details" : "Show details"}
              aria-expanded={showDetails}
              aria-pressed={showDetails}
              onClick={onToggleDetails}
              className="aria-pressed:bg-muted aria-pressed:text-foreground"
            >
              {/* Mirrored so the highlighted panel sits on the right, where the details open. */}
              <SidebarSimple className="-scale-x-100" weight={showDetails ? "fill" : "regular"} />
            </Button>
          )}
          <DialogClose asChild>
            <Button variant="ghost" size="icon-sm" aria-label="Close preview" title="Close (Esc)">
              <X />
            </Button>
          </DialogClose>
        </header>
        <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
          <section className="flex min-h-0 min-w-0 flex-1 flex-col">
            {website && embedCheck.isPending && (
              <div className="flex flex-1 items-center justify-center gap-2 text-muted-foreground" role="status">
                <Spinner aria-hidden="true" /> Preparing preview…
              </div>
            )}
            {showFrame && !showSummary && status !== "loaded" && (
              <div className="flex shrink-0 flex-wrap items-center gap-x-2 gap-y-1 border-b px-3 py-2 text-xs text-muted-foreground" role="status">
                {status === "loading" ? <><Spinner aria-hidden="true" /> Loading website…</> : "This website is slow to load, or it may not allow previews."}
                {status !== "loading" && <Button variant="link" size="xs" onClick={() => setShowSummary(true)}>Show saved details instead</Button>}
              </div>
            )}
            {website && showReference && (
              <div className="flex min-h-0 flex-1 items-start justify-center overflow-y-auto bg-muted/30 p-4 sm:items-center">
                <Card role="region" aria-label="Saved details" className="w-full max-w-xl shrink-0">
                  {thumbnail && !thumbnailFailed && (
                    <img
                      src={thumbnail}
                      alt=""
                      onError={() => setThumbnailFailed(true)}
                      className="aspect-[1.91/1] w-full border-b border-border bg-muted object-cover"
                    />
                  )}
                  <CardHeader className="gap-1 p-4">
                    <CardTitle className="line-clamp-2 break-words">{bookmark.title || website.hostname}</CardTitle>
                    <CardDescription>{website.hostname}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col items-start gap-3 px-4 pb-4">
                    {blocked && <p className="text-sm text-muted-foreground">{website.hostname.replace(/^www\./, "")} does not allow previews inside other apps. Open the original to read it.</p>}
                    <p className="line-clamp-4 text-sm">{bookmark.description || "No description saved for this link."}</p>
                    <div className="flex flex-wrap gap-2">
                      <Button asChild><a href={website.href} target="_blank" rel="noopener noreferrer"><ArrowSquareOut data-icon="inline-start" />Open original</a></Button>
                      {!blocked && <Button variant="outline" onClick={() => { setShowSummary(false); setStatus("loading"); setReload((value) => value + 1) }}>Try the live preview</Button>}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
            {showFrame && (
              <iframe
                key={reload}
                hidden={showSummary}
                src={website.href}
                title={bookmark.title || website.hostname}
                className="min-h-0 w-full flex-1 border-0 bg-white"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
                referrerPolicy="no-referrer"
                onLoad={() => setStatus("loaded")}
                onError={() => { setStatus("error"); setShowSummary(true) }}
                allowFullScreen
              />
            )}
            {!website && <p role="alert" className="p-6">Only valid HTTP and HTTPS websites can be previewed.</p>}
          </section>
          {inspector && (
            <div hidden={!showDetails} className="h-[42%] min-h-0 shrink-0 overflow-y-auto border-t lg:h-full lg:w-96 lg:border-t-0 lg:border-l">
              {inspector}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
