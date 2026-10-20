"use client"

import { useEffect, useState, type ReactNode } from "react"
import { ArrowClockwise, ArrowSquareOut, CaretLeft, CaretRight } from "@phosphor-icons/react"
import { Spinner } from "@/components/ui/spinner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"
import { safeHttpUrl } from "@/lib/shared-collection"

type PreviewBookmark = { id: string; url: string; title?: string }

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

  useEffect(() => {
    if (status !== "loading") return
    const timeout = window.setTimeout(() => setStatus("slow"), 12000)
    return () => window.clearTimeout(timeout)
  }, [status, reload])

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent
        className="flex h-[94dvh] max-w-[calc(100%-1rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-[calc(100%-3rem)]"
        onKeyDown={(event) => {
          if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return
          if ((event.target as HTMLElement).closest("input, textarea, select, [contenteditable]")) return
          const navigate = event.key === "ArrowLeft" ? onPrevious : event.key === "ArrowRight" ? onNext : undefined
          if (navigate) {
            event.preventDefault()
            navigate()
          }
        }}
      >
        <header className="flex shrink-0 flex-wrap items-center gap-3 border-b p-3 pr-12">
          <div className="min-w-0 flex-1">
            <DialogTitle className="truncate">{bookmark.title || website?.hostname || "Website preview"}</DialogTitle>
            <DialogDescription className="truncate">{website?.hostname || "Invalid website URL"}</DialogDescription>
          </div>
          <div className="flex items-center gap-1" aria-label="Bookmark navigation">
            <Button variant="ghost" size="icon-sm" aria-label="Previous bookmark (Left arrow)" disabled={!onPrevious} onClick={onPrevious}>
              <CaretLeft />
            </Button>
            <Button variant="ghost" size="icon-sm" aria-label="Next bookmark (Right arrow)" disabled={!onNext} onClick={onNext}>
              <CaretRight />
            </Button>
          </div>
          {inspector && <Button variant="outline" size="sm" onClick={onToggleDetails}>{showDetails ? "Hide details" : "Show details"}</Button>}
          {website && (
            <>
              <Button variant="ghost" size="icon-sm" aria-label="Reload website" onClick={() => { setStatus("loading"); setReload((value) => value + 1) }}>
                <ArrowClockwise />
              </Button>
              <Button variant="outline" size="sm" asChild>
                <a href={website.href} target="_blank" rel="noopener noreferrer">
                  <ArrowSquareOut data-icon="inline-start" />
                  Open original
                </a>
              </Button>
            </>
          )}
        </header>
        <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
          <section className="flex min-h-0 min-w-0 flex-1 flex-col">
            <p className="shrink-0 border-b px-3 py-2 text-xs text-muted-foreground">
              Some websites block embedded previews. If the page stays blank or refuses to connect, use Open original.
            </p>
        {website && status === "loading" && (
          <div className="flex items-center gap-2 border-b px-3 py-2" role="status">
            <Spinner aria-hidden="true" /> Loading website…
          </div>
        )}
        {website && (status === "slow" || status === "error") && (
          <p role="status" className="border-b px-3 py-2 text-muted-foreground">
            {status === "slow"
              ? "The website is taking longer than expected. It may be slow or block embedded previews. Try Reload or Open original."
              : "The preview could not load. Try Reload or Open original."}
          </p>
        )}
        {website ? (
          <iframe
            key={reload}
            src={website.href}
            title={bookmark.title || website.hostname}
            className="min-h-0 w-full flex-1 border-0 bg-white"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
            referrerPolicy="no-referrer"
            onLoad={() => setStatus("loaded")}
            onError={() => setStatus("error")}
            allowFullScreen
          />
        ) : (
          <p role="alert" className="p-6">Only valid HTTP and HTTPS websites can be previewed.</p>
        )}
          </section>
          {inspector && showDetails && (
            <div className="h-[42%] min-h-0 shrink-0 overflow-y-auto border-t lg:h-full lg:w-[22rem] lg:border-t-0 lg:border-l">
              {inspector}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
