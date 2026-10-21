"use client"

import React from "react"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer"
import {
  ArrowSquareOut,
  LinkSimple,
  PencilSimple,
  Copy,
  Archive,
  PushPin,
  Trash,
  ArrowCounterClockwise,
  DownloadSimple,
  FileText,
  Star,
  CheckSquare,
} from "@phosphor-icons/react"
import { toast } from "@/components/ui/sonner"
import { canDownloadMedia, isNoteBookmark } from "@/lib/bookmark-kind"

interface BookmarkActionSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  bookmark: any | null
  onEditBookmark: (bookmark: any) => void
  onDuplicateBookmark: (bookmark: any) => void
  onTogglePin?: (bookmark: any) => void
  onToggleFavorite?: (bookmark: any) => void
  onSelectBookmark?: (bookmark: any) => void
  onToggleArchive: (bookmark: any) => void
  onDeleteBookmark: (id: string) => void
  isTrashView?: boolean
  onRestoreBookmark?: (id: string) => void
  onPermanentDeleteBookmark?: (id: string) => void
  onOpenDownload?: (bookmark: any) => void
}

export function BookmarkActionSheet({
  open,
  onOpenChange,
  bookmark,
  onEditBookmark,
  onDuplicateBookmark,
  onToggleArchive,
  onTogglePin,
  onToggleFavorite,
  onSelectBookmark,
  onDeleteBookmark,
  isTrashView,
  onRestoreBookmark,
  onPermanentDeleteBookmark,
  onOpenDownload,
}: BookmarkActionSheetProps) {
  if (!bookmark) return null

  const isNote = isNoteBookmark(bookmark)
  const canDownload = canDownloadMedia(bookmark)

  const getHostname = (url: string) => {
    try {
      return new URL(url).hostname
    } catch {
      return url
    }
  }

  const hostname = getHostname(bookmark.url)

  const handleCopy = () => {
    navigator.clipboard?.writeText(bookmark.url)
    toast.success("Link copied")
    onOpenChange(false)
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90dvh] overflow-y-auto rounded-t-xl border-t border-border bg-card px-0 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
        {/* Bookmark Meta Header */}
        <DrawerHeader className="border-b border-brand-border px-5 py-3.5 text-left">
          <div className="flex items-center gap-2">
            <img
              src={`https://www.google.com/s2/favicons?domain=${hostname}&sz=32`}
              alt=""
              className="size-4 shrink-0 rounded-sm object-contain"
              onError={(e) => {
                ;(e.target as HTMLElement).style.display = "none"
              }}
            />
            <span className="text-xs text-muted-foreground">
              {hostname}
            </span>
          </div>
          <DrawerTitle className="mt-1 line-clamp-2 text-base font-medium text-foreground">
            {bookmark.title || hostname}
          </DrawerTitle>
          <DrawerDescription className="sr-only">
            Actions for bookmark {bookmark.title || hostname}
          </DrawerDescription>
        </DrawerHeader>

        {/* Action List */}
        <div className="flex flex-col gap-1 p-2 [&>a]:rounded-md [&>button]:rounded-md">
          {/* Download Media (Video/Audio) */}
          {canDownload && onOpenDownload && (
            <button
              type="button"
              onClick={() => {
                onOpenChange(false)
                onOpenDownload(bookmark)
              }}
              className="flex h-12 items-center gap-3 px-5 text-left text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              <DownloadSimple className="size-4 text-muted-foreground" />
              <span>Download media</span>
            </button>
          )}

          {/* Open Link */}
          {!isNote && (
            <a
              href={bookmark.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => onOpenChange(false)}
              className="flex h-12 items-center gap-3 px-5 text-sm font-medium text-brand-charcoal transition-colors hover:bg-brand-canvas active:bg-brand-charcoal/5"
            >
              <ArrowSquareOut className="size-4 text-brand-muted" />
              <span>Open original</span>
            </a>
          )}

          {/* Copy Link */}
          {!isNote && <button
            type="button"
            onClick={handleCopy}
            className="flex h-12 items-center gap-3 px-5 text-left text-sm font-medium text-brand-charcoal transition-colors hover:bg-brand-canvas active:bg-brand-charcoal/5"
          >
            <LinkSimple className="size-4 text-brand-muted" />
            <span>Copy link</span>
          </button>}

          {onSelectBookmark && <button type="button" onClick={() => { onSelectBookmark(bookmark); onOpenChange(false) }} className="flex h-12 items-center gap-3 px-5 text-left text-sm font-medium hover:bg-muted"><CheckSquare className="size-4" /><span>Select</span></button>}
          {isTrashView ? (
            <>
              {/* Restore */}
              <button
                type="button"
                onClick={() => {
                  onRestoreBookmark?.(bookmark.id)
                  onOpenChange(false)
                }}
                className="flex h-12 items-center gap-3 px-5 text-left text-sm font-medium text-brand-charcoal transition-colors hover:bg-brand-canvas active:bg-brand-charcoal/5"
              >
                <ArrowCounterClockwise className="size-4 text-brand-charcoal" />
                <span>Restore</span>
              </button>

              {/* Delete Permanently */}
              <button
                type="button"
                onClick={() => {
                  onPermanentDeleteBookmark?.(bookmark.id)
                  onOpenChange(false)
                }}
                className="flex h-12 items-center gap-3 px-5 text-left text-sm font-medium text-destructive transition-colors hover:bg-destructive/10 active:bg-destructive/20"
              >
                <Trash className="size-4 text-destructive" />
                <span>Delete permanently</span>
              </button>
            </>
          ) : (
            <>
              {onToggleFavorite && <button type="button" onClick={() => { onToggleFavorite(bookmark); onOpenChange(false) }} className="flex h-12 items-center gap-3 px-5 text-left text-sm font-medium hover:bg-muted">
                <Star className="size-4" weight={bookmark.isFavorite ? "fill" : "regular"} />
                <span>{bookmark.isFavorite ? "Remove from favorites" : "Add to favorites"}</span>
              </button>}
              {/* Edit Details */}
              <button
                type="button"
                onClick={() => {
                  onEditBookmark(bookmark)
                  onOpenChange(false)
                }}
                className="flex h-12 items-center gap-3 px-5 text-left text-sm font-medium text-brand-charcoal transition-colors hover:bg-brand-canvas active:bg-brand-charcoal/5"
              >
                <PencilSimple className="size-4 text-brand-muted" />
                <span>Edit details</span>
              </button>

              {/* Duplicate */}
              <button
                type="button"
                onClick={() => {
                  onDuplicateBookmark(bookmark)
                  onOpenChange(false)
                }}
                className="flex h-12 items-center gap-3 px-5 text-left text-sm font-medium text-brand-charcoal transition-colors hover:bg-brand-canvas active:bg-brand-charcoal/5"
              >
                <Copy className="size-4 text-brand-muted" />
                <span>Duplicate</span>
              </button>

              {onTogglePin && (
                <button type="button"
                  onClick={() => { onTogglePin(bookmark); onOpenChange(false) }}
                  className="flex h-12 w-full items-center gap-3 px-5 text-left text-sm hover:bg-muted"
                >
                  <PushPin className="size-4" weight={bookmark.isPinned ? "fill" : "regular"} />
                  <span>{bookmark.isPinned ? "Unpin bookmark" : "Pin to top"}</span>
                </button>
              )}
              {/* Archive / Unarchive */}
              <button
                type="button"
                onClick={() => {
                  onToggleArchive(bookmark)
                  onOpenChange(false)
                }}
                className="flex h-12 items-center gap-3 px-5 text-left text-sm font-medium text-brand-charcoal transition-colors hover:bg-brand-canvas active:bg-brand-charcoal/5"
              >
                <Archive className="size-4 text-brand-muted" />
                <span>{bookmark.isArchived ? "Unarchive" : "Archive"}</span>
              </button>

              <div className="my-1 border-t border-brand-border" />

              {/* Move to Trash */}
              <button
                type="button"
                onClick={() => {
                  onDeleteBookmark(bookmark.id)
                  onOpenChange(false)
                }}
                className="flex h-12 items-center gap-3 px-5 text-left text-sm font-medium text-destructive transition-colors hover:bg-destructive/10 active:bg-destructive/20"
              >
                <Trash className="size-4 text-destructive" />
                <span>Move to Trash</span>
              </button>
            </>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  )
}
