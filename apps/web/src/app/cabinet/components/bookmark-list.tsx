import React from "react"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty"
import { BookmarkSimple, Trash } from "@phosphor-icons/react"
import { BookmarkListView } from "./bookmark-list-view"
import { BookmarkMoodboardView, MoodboardCard } from "./bookmark-moodboard-view"
import { BookmarkActionSheet } from "./bookmark-action-sheet"
import { BookmarkWebview } from "./bookmark-webview"
import { BookmarkInspector } from "./bookmark-inspector"
import type { DisplayPreferences } from "./display-preferences"
import { adjacentPreviewBookmark, moodboardColumnCount } from "@/lib/bookmark-view"

interface BookmarkListProps {
  sortableInParent?: boolean
  displayPreferences: DisplayPreferences
  bookmarks: any[]
  isBookmarksLoading: boolean
  isBookmarksError?: boolean
  onRetryBookmarks?: () => void
  selectedFolderId?: string
  selectedTag?: string
  filterFavorite?: boolean
  filterArchived?: boolean
  folders: any[]
  viewMode: "list" | "moodboard"
  selectedBookmarkIds: string[]
  onToggleSelect: (id: string) => void
  onSelectTag: (tagName: string) => void
  onTogglePin?: (bookmark: any) => void
  onToggleFavorite: (bookmark: any) => void
  onToggleArchive: (bookmark: any) => void
  onEditBookmark: (bookmark: any) => void
  onDeleteBookmark: (id: string) => void
  onDuplicateBookmark: (bookmark: any) => void
  isDuplicatesView?: boolean
  duplicateGroups?: Array<{ url: string; bookmarks: any[] }>
  onCleanDuplicates?: () => void
  totalBookmarks?: number
  columnCount?: number
  onReorder?: (newOrder: any[]) => void
  isTrashView?: boolean
  onRestoreBookmark?: (id: string) => void
  onPermanentDeleteBookmark?: (id: string) => void
  onEmptyTrash?: () => void
  onOpenDownload?: (bookmark: any) => void
  onInspectBookmark?: (bookmark: any) => void
  availableTags?: any[]
  onUpdateBookmark?: (id: string, data: any) => Promise<any>
}

export function BookmarkList({
  sortableInParent = false,
  displayPreferences,
  bookmarks,
  isBookmarksLoading,
  isBookmarksError = false,
  onRetryBookmarks,
  selectedFolderId,
  selectedTag,
  filterFavorite,
  filterArchived,
  folders,
  viewMode,
  selectedBookmarkIds,
  onToggleSelect,
  onSelectTag,
  onToggleFavorite,
  onTogglePin,
  onToggleArchive,
  onEditBookmark,
  onDeleteBookmark,
  onDuplicateBookmark,
  isDuplicatesView,
  duplicateGroups,
  onCleanDuplicates,
  totalBookmarks,
  columnCount = 4,
  onReorder,
  isTrashView,
  onRestoreBookmark,
  onPermanentDeleteBookmark,
  onEmptyTrash,
  onOpenDownload,
  onInspectBookmark,
  availableTags = [],
  onUpdateBookmark,
}: BookmarkListProps) {
  const [previewBookmark, setPreviewBookmark] = React.useState<any | null>(null)
  const [showPreviewDetails, setShowPreviewDetails] = React.useState(true)
  const openBookmark = (bookmark: any) => {
    if (bookmark.type === "NOTE" || !bookmark.url) {
      onEditBookmark(bookmark)
    } else {
      setPreviewBookmark(bookmark)
    }
  }
  const containerRef = React.useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = React.useState(0)
  const previewBookmarks = isDuplicatesView
    ? duplicateGroups?.flatMap((group) => group.bookmarks) ?? []
    : bookmarks
  const previousBookmark = previewBookmark && adjacentPreviewBookmark(previewBookmarks, previewBookmark.id, -1)
  const nextBookmark = previewBookmark && adjacentPreviewBookmark(previewBookmarks, previewBookmark.id, 1)
  const [actionSheetBookmark, setActionSheetBookmark] = React.useState<
    any | null
  >(null)

  React.useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setContainerWidth(entry.contentRect.width)
    })
    observer.observe(container)
    return () => observer.disconnect()
  }, [])

  const activeColumnCount = moodboardColumnCount(containerWidth, columnCount)

  const getHeaderTitle = () => {
    if (isTrashView) {
      return "Trash"
    }
    if (selectedFolderId) {
      const folderName = folders.find(
        (f: any) => f.id === selectedFolderId
      )?.name
      return `Folder: ${folderName || "Loading..."}`
    }
    if (selectedTag) {
      return `Tag: ${selectedTag}`
    }
    if (filterFavorite) {
      return "Favorite Bookmarks"
    }
    if (filterArchived) {
      return "Archived Bookmarks"
    }
    return "All Bookmarks"
  }

  const getHostname = (url: string) => {
    try {
      return new URL(url).hostname
    } catch {
      return url || ""
    }
  }

  const getPastelColor = (str: string): { bg: string; text: string } => {
    const pastels = [
      { bg: "bg-[#FDEBEC]", text: "text-[#9F2F2D]" },
      { bg: "bg-[#E1F3FE]", text: "text-[#1F6C9F]" },
      { bg: "bg-[#EDF3EC]", text: "text-[#346538]" },
      { bg: "bg-[#FBF3DB]", text: "text-[#956400]" },
    ]
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash)
    }
    const index = Math.abs(hash) % pastels.length
    const color = pastels[index]
    if (color) return color
    return { bg: "bg-[#FDEBEC]", text: "text-[#9F2F2D]" }
  }

  return (
    <div ref={containerRef} className="min-w-0 space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="flex items-center gap-2 font-mono text-xs tracking-wider text-muted-foreground uppercase">
          {isTrashView ? (
            <Trash className="h-3.5 w-3.5 text-foreground" />
          ) : (
            <BookmarkSimple className="h-3.5 w-3.5 text-foreground" />
          )}
          {isDuplicatesView ? "Duplicate Groups" : getHeaderTitle()}
        </h2>
        <div className="flex items-center gap-2">
          {isTrashView && bookmarks.length > 0 && onEmptyTrash && (
            <Button
              variant="outline"
              size="sm"
              onClick={onEmptyTrash}
              className="h-6 rounded-xs border-destructive/30 px-2 font-mono text-[9px] text-destructive uppercase hover:bg-destructive/10"
            >
              Empty Trash
            </Button>
          )}
          <Badge variant="secondary" className="h-5 px-1.5 py-0 font-mono text-[9px] tabular-nums font-normal">
            {isBookmarksLoading
              ? "..."
              : isBookmarksError
                ? "Unavailable"
              : isDuplicatesView
                ? `${duplicateGroups?.length || 0} Groups`
                : `${totalBookmarks !== undefined ? totalBookmarks : bookmarks.length} Items`}
          </Badge>
        </div>
      </div>

      {isBookmarksLoading ? (
        <div role="status" aria-label="Loading bookmarks">
          <span className="sr-only">Loading bookmarks...</span>
          <Skeleton
            aria-hidden="true"
            className={
              viewMode === "list"
                ? "divide-y divide-brand-border rounded-none border border-brand-border bg-transparent motion-reduce:animate-none"
                : "grid gap-4 rounded-none bg-transparent motion-reduce:animate-none"
            }
            style={
              viewMode === "moodboard"
                ? {
                    gridTemplateColumns: `repeat(${activeColumnCount}, minmax(0, 1fr))`,
                  }
                : undefined
            }
          >
            {Array.from({ length: 6 }, (_, index) =>
              viewMode === "list" ? (
                <div key={index} className="flex h-11 items-center gap-3 px-3">
                  <div className="size-4 shrink-0 bg-muted" />
                  <div className="h-3 w-1/2 bg-muted" />
                  <div className="ml-auto hidden h-3 w-20 bg-muted sm:block" />
                  <div className="size-5 shrink-0 bg-muted" />
                </div>
              ) : (
                <div
                  key={index}
                  className="flex flex-col border border-brand-border"
                >
                  <div className="aspect-[4/3] bg-muted" />
                  <div className="flex flex-col gap-3 p-4">
                    <div className="h-3 w-3/4 bg-muted" />
                    <div className="h-3 w-full bg-muted" />
                    <div className="h-3 w-1/2 bg-muted" />
                  </div>
                </div>
              )
            )}
          </Skeleton>
        </div>
      ) : isBookmarksError ? (
        <Empty role="alert" className="rounded-none border border-brand-border bg-white p-10">
          <EmptyHeader>
            <EmptyTitle>Could not load bookmarks</EmptyTitle>
            <EmptyDescription>
              Your bookmarks could not be loaded. Please try again.
            </EmptyDescription>
          </EmptyHeader>
          {onRetryBookmarks && <Button variant="outline" onClick={onRetryBookmarks}>Try again</Button>}
        </Empty>
      ) : bookmarks.length === 0 ? (
        <Empty className="rounded-none border border-brand-border bg-white p-10">
          <EmptyHeader>
            <EmptyTitle>
              {isTrashView ? "Trash is empty" : "No bookmarks found"}
            </EmptyTitle>
            <EmptyDescription>
              {isTrashView
                ? "No bookmarks in the trash."
                : "No bookmarks found matching the filters."}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : isDuplicatesView ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between border border-brand-border bg-brand-charcoal/5 p-3.5">
            <span className="font-mono text-xs text-brand-charcoal">
              Found {duplicateGroups?.length || 0} duplicate URL groups.
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={onCleanDuplicates}
              className="h-8 font-mono text-[10px] uppercase hover:border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
            >
              Auto-Clean Duplicates
            </Button>
          </div>

          {duplicateGroups?.map((group, index) => (
            <Card
              key={index}
              className="space-y-4 rounded-none border border-brand-border bg-white p-4 shadow-none"
            >
              <div className="flex items-center justify-between border-b border-brand-border pb-2">
                <span className="max-w-xl truncate font-mono text-[10px] text-brand-muted">
                  URL: {group.url}
                </span>
                <Badge
                  variant="outline"
                  className="shrink-0 border-none bg-brand-charcoal/5 font-mono text-[9px]"
                >
                  {group.bookmarks.length} instances
                </Badge>
              </div>
              {viewMode === "moodboard" ? (
                <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${activeColumnCount}, minmax(0, 1fr))` }}>
                  {group.bookmarks.map((bookmark) => (
                    <MoodboardCard
                      onTogglePin={onTogglePin}
                      displayPreferences={displayPreferences}
                      key={bookmark.id}
                      bookmark={bookmark}
                      folders={folders}
                      onSelectTag={onSelectTag}
                      onToggleFavorite={onToggleFavorite}
                      onToggleArchive={onToggleArchive}
                      onEditBookmark={onEditBookmark}
                      onDeleteBookmark={onDeleteBookmark}
                      onDuplicateBookmark={onDuplicateBookmark}
                      getHostname={getHostname}
                      getPastelColor={getPastelColor}
                      onInspectBookmark={openBookmark}
                      hasSelectedItems={selectedBookmarkIds.length > 0}
                      isSelected={selectedBookmarkIds.includes(bookmark.id)}
                      onToggleSelect={() => onToggleSelect(bookmark.id)}
                    />
                  ))}
                </div>
              ) : (
                <BookmarkListView
                  onTogglePin={onTogglePin}
                  displayPreferences={displayPreferences}
                  bookmarks={group.bookmarks}
                  onInspectBookmark={openBookmark}
                  selectedBookmarkIds={selectedBookmarkIds}
                  onToggleSelect={onToggleSelect}
                  onSelectTag={onSelectTag}
                  onToggleFavorite={onToggleFavorite}
                  onToggleArchive={onToggleArchive}
                  onEditBookmark={onEditBookmark}
                  onDeleteBookmark={onDeleteBookmark}
                  onDuplicateBookmark={onDuplicateBookmark}
                  getHostname={getHostname}
                />
              )}
            </Card>
          ))}
        </div>
      ) : (
        <div>
          {viewMode === "list" ? (
            <BookmarkListView
              onTogglePin={onTogglePin}
              displayPreferences={displayPreferences}
              bookmarks={bookmarks}
              selectedBookmarkIds={selectedBookmarkIds}
              onToggleSelect={onToggleSelect}
              onSelectTag={onSelectTag}
              onToggleFavorite={onToggleFavorite}
              onToggleArchive={onToggleArchive}
              onEditBookmark={onEditBookmark}
              onDeleteBookmark={onDeleteBookmark}
              onDuplicateBookmark={onDuplicateBookmark}
              getHostname={getHostname}
              onReorder={onReorder}
              isTrashView={isTrashView}
              onRestoreBookmark={onRestoreBookmark}
              onPermanentDeleteBookmark={onPermanentDeleteBookmark}
              onOpenActionSheet={setActionSheetBookmark}
              onOpenDownload={onOpenDownload}
              onInspectBookmark={openBookmark}
            />
          ) : (
            <BookmarkMoodboardView
              onTogglePin={onTogglePin}
              sortableInParent={sortableInParent}
              displayPreferences={displayPreferences}
              bookmarks={bookmarks}
              folders={folders}
              activeColumnCount={activeColumnCount}
              selectedBookmarkIds={selectedBookmarkIds}
              onToggleSelect={onToggleSelect}
              onSelectTag={onSelectTag}
              onToggleFavorite={onToggleFavorite}
              onToggleArchive={onToggleArchive}
              onEditBookmark={onEditBookmark}
              onDeleteBookmark={onDeleteBookmark}
              onDuplicateBookmark={onDuplicateBookmark}
              getHostname={getHostname}
              getPastelColor={getPastelColor}
              onReorder={onReorder}
              isTrashView={isTrashView}
              onRestoreBookmark={onRestoreBookmark}
              onPermanentDeleteBookmark={onPermanentDeleteBookmark}
              onOpenActionSheet={setActionSheetBookmark}
              onOpenDownload={onOpenDownload}
              onInspectBookmark={openBookmark}
            />
          )}
        </div>
      )}

      {previewBookmark && (
        <BookmarkWebview
          key={previewBookmark.id}
          bookmark={previewBookmark}
          onClose={() => setPreviewBookmark(null)}
          showDetails={showPreviewDetails}
          onToggleDetails={() => setShowPreviewDetails((visible) => !visible)}
          inspector={onUpdateBookmark ? (
            <BookmarkInspector
              bookmark={bookmarks.find((item) => item.id === previewBookmark.id) || previewBookmark}
              folders={folders}
              availableTags={availableTags}
              onClose={() => setShowPreviewDetails(false)}
              onUpdateBookmark={onUpdateBookmark}
              onDeleteBookmark={onDeleteBookmark}
              onToggleFavorite={onToggleFavorite}
              onTogglePin={onTogglePin}
              onToggleArchive={onToggleArchive}
              className="h-full w-full border-0 lg:w-[22rem] lg:shrink-0"
            />
          ) : undefined}
          onPrevious={previousBookmark ? () => setPreviewBookmark(previousBookmark) : undefined}
          onNext={nextBookmark ? () => setPreviewBookmark(nextBookmark) : undefined}
        />
      )}

      {/* Mobile Native Bottom Action Sheet for Bookmark Actions */}
      <BookmarkActionSheet
        onTogglePin={onTogglePin}
        open={!!actionSheetBookmark}
        onOpenChange={(open) => !open && setActionSheetBookmark(null)}
        bookmark={bookmarks.find((b) => b.id === actionSheetBookmark?.id) || actionSheetBookmark}
        onEditBookmark={onEditBookmark}
        onDuplicateBookmark={onDuplicateBookmark}
        onToggleArchive={onToggleArchive}
        onDeleteBookmark={onDeleteBookmark}
        isTrashView={isTrashView}
        onRestoreBookmark={onRestoreBookmark}
        onPermanentDeleteBookmark={onPermanentDeleteBookmark}
        onOpenDownload={onOpenDownload}
      />
    </div>
  )
}
