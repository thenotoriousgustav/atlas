"use client"

import React from "react"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@atlas/ui/components/drawer"
import {
  ArrowSquareOut,
  LinkSimple,
  PencilSimple,
  Copy,
  Archive,
  Trash,
  ArrowCounterClockwise,
} from "@phosphor-icons/react"

interface BookmarkActionSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  bookmark: any | null
  onEditBookmark: (bookmark: any) => void
  onDuplicateBookmark: (bookmark: any) => void
  onToggleArchive: (bookmark: any) => void
  onDeleteBookmark: (id: string) => void
  isTrashView?: boolean
  onRestoreBookmark?: (id: string) => void
  onPermanentDeleteBookmark?: (id: string) => void
}

export function BookmarkActionSheet({
  open,
  onOpenChange,
  bookmark,
  onEditBookmark,
  onDuplicateBookmark,
  onToggleArchive,
  onDeleteBookmark,
  isTrashView,
  onRestoreBookmark,
  onPermanentDeleteBookmark,
}: BookmarkActionSheetProps) {
  if (!bookmark) return null

  const getHostname = (url: string) => {
    try {
      return new URL(url).hostname
    } catch {
      return url
    }
  }

  const hostname = getHostname(bookmark.url)

  const handleCopy = () => {
    navigator.clipboard.writeText(bookmark.url)
    onOpenChange(false)
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="rounded-none border-t border-brand-border bg-white px-0 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
        {/* Bookmark Meta Header */}
        <DrawerHeader className="border-b border-brand-border px-5 py-3.5 text-left">
          <div className="flex items-center gap-2">
            <img
              src={`https://www.google.com/s2/favicons?domain=${hostname}&sz=32`}
              alt=""
              className="size-4 shrink-0 rounded-none object-contain"
              onError={(e) => {
                ;(e.target as HTMLElement).style.display = "none"
              }}
            />
            <span className="font-mono text-[11px] font-semibold text-brand-muted uppercase">
              {hostname}
            </span>
          </div>
          <DrawerTitle className="mt-1 line-clamp-1 font-serif text-base font-medium text-brand-charcoal">
            {bookmark.title || hostname}
          </DrawerTitle>
          <DrawerDescription className="sr-only">
            Actions for bookmark {bookmark.title || hostname}
          </DrawerDescription>
        </DrawerHeader>

        {/* Action List */}
        <div className="flex flex-col py-1">
          {/* Open Link */}
          <a
            href={bookmark.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => onOpenChange(false)}
            className="flex h-12 items-center gap-3 px-5 text-sm font-medium text-brand-charcoal transition-colors hover:bg-brand-canvas active:bg-brand-charcoal/5"
          >
            <ArrowSquareOut className="size-4 text-brand-muted" />
            <span>Open Link in New Tab</span>
          </a>

          {/* Copy Link */}
          <button
            type="button"
            onClick={handleCopy}
            className="flex h-12 items-center gap-3 px-5 text-left text-sm font-medium text-brand-charcoal transition-colors hover:bg-brand-canvas active:bg-brand-charcoal/5"
          >
            <LinkSimple className="size-4 text-brand-muted" />
            <span>Copy Link</span>
          </button>

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
                <span>Restore Bookmark</span>
              </button>

              {/* Delete Permanently */}
              <button
                type="button"
                onClick={() => {
                  onPermanentDeleteBookmark?.(bookmark.id)
                  onOpenChange(false)
                }}
                className="flex h-12 items-center gap-3 px-5 text-left text-sm font-medium text-red-600 transition-colors hover:bg-red-50 active:bg-red-100/50"
              >
                <Trash className="size-4 text-red-600" />
                <span>Delete Permanently</span>
              </button>
            </>
          ) : (
            <>
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
                <span>Edit Details</span>
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
                className="flex h-12 items-center gap-3 px-5 text-left text-sm font-medium text-red-600 transition-colors hover:bg-red-50 active:bg-red-100/50"
              >
                <Trash className="size-4 text-red-600" />
                <span>Move to Trash</span>
              </button>
            </>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  )
}
