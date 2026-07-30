import React from "react"
import { cn } from "@atlas/ui/lib/utils"
import { Badge } from "@atlas/ui/components/badge"
import { Button } from "@atlas/ui/components/button"
import { Card } from "@atlas/ui/components/card"
import { Checkbox } from "@atlas/ui/components/checkbox"
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@atlas/ui/components/tooltip"
import {
  Star,
  Archive,
  PencilSimple,
  Trash,
  Clock,
  ArrowSquareOut,
  Copy,
} from "@phosphor-icons/react"
import {
  Sortable,
  SortableContent,
  SortableItem,
  SortableOverlay,
} from "@atlas/ui/components/sortable"

interface MoodboardCardProps {
  bookmark: any
  onSelectTag: (tagName: string) => void
  onToggleFavorite: (bookmark: any) => void
  onToggleArchive: (bookmark: any) => void
  onEditBookmark: (bookmark: any) => void
  onDeleteBookmark: (id: string) => void
  onDuplicateBookmark: (bookmark: any) => void
  getHostname: (url: string) => string
  getPastelColor: (str: string) => { bg: string; text: string }
  isSelected: boolean
  onToggleSelect: () => void
}

export function MoodboardCard({
  bookmark,
  onSelectTag,
  onToggleFavorite,
  onToggleArchive,
  onEditBookmark,
  onDeleteBookmark,
  onDuplicateBookmark,
  getHostname,
  getPastelColor,
  isSelected,
  onToggleSelect,
}: MoodboardCardProps) {
  const hostname = getHostname(bookmark.url)
  const color = getPastelColor(hostname)

  const imageSrc = bookmark.imageUrl || ""
  const [imageStatus, setImageStatus] = React.useState<
    "loading" | "loaded" | "error"
  >(bookmark.imageUrl ? "loading" : "error")

  React.useEffect(() => {
    setImageStatus(bookmark.imageUrl ? "loading" : "error")
  }, [bookmark.imageUrl])

  const handleImageError = () => {
    setImageStatus("error")
  }

  return (
    <Card
      className={cn(
        "group/card flex h-auto w-full flex-col overflow-hidden rounded-none border border-brand-border bg-white shadow-none transition-all hover:border-brand-charcoal/40",
        isSelected && "border-brand-charcoal ring-1 ring-brand-charcoal"
      )}
    >
      {/* Top Visual Image Header Container */}
      <div className="relative aspect-16/10 w-full shrink-0 overflow-hidden border-b border-brand-border bg-brand-canvas">
        {/* Checkbox Overlay */}
        <div
          className={cn(
            "absolute top-2.5 left-2.5 z-20 border border-brand-border bg-white p-px shadow-xs transition-opacity",
            isSelected
              ? "opacity-100"
              : "opacity-0 group-hover/card:opacity-100 focus-within:opacity-100"
          )}
        >
          <Checkbox
            checked={isSelected}
            onCheckedChange={onToggleSelect}
            className="rounded-none border-brand-border data-[state=checked]:border-brand-charcoal data-[state=checked]:bg-brand-charcoal"
          />
        </div>

        <a
          href={bookmark.url}
          target="_blank"
          rel="noreferrer"
          className="group/header relative block h-full w-full"
        >
          {imageStatus === "loading" && (
            <div className="absolute inset-0 flex animate-pulse items-center justify-center bg-gray-50/50">
              <Clock className="h-5 w-5 animate-spin text-gray-400" />
            </div>
          )}

          {imageStatus !== "error" && imageSrc && (
            <img
              src={imageSrc}
              alt={bookmark.title || hostname}
              onLoad={() => setImageStatus("loaded")}
              onError={handleImageError}
              className={cn(
                "h-full w-full object-cover transition-opacity duration-300",
                imageStatus === "loaded" ? "opacity-100" : "opacity-0"
              )}
            />
          )}

          {imageStatus === "error" && (
            <div
              className={cn(
                "relative flex h-full w-full flex-col items-center justify-center p-4",
                color.bg
              )}
            >
              <div className="flex size-12 items-center justify-center rounded-xl border border-brand-border/60 bg-white shadow-sm">
                <img
                  src={`https://www.google.com/s2/favicons?sz=128&domain=${hostname}`}
                  alt=""
                  onError={(e) => {
                    e.currentTarget.style.display = "none"
                  }}
                  className="size-7 object-contain"
                />
              </div>
              <span
                className={cn(
                  "mt-2 max-w-full truncate px-2 font-mono text-[11px] font-medium tracking-wider uppercase",
                  color.text
                )}
              >
                {hostname}
              </span>
            </div>
          )}

          {/* Folder Badge */}
          {bookmark.folder && (
            <Badge
              variant="outline"
              className="absolute top-3 right-3 shrink-0 rounded-full border-none bg-white/90 px-2 py-0.5 font-mono text-[9px] font-medium uppercase shadow-sm backdrop-blur-sm"
            >
              {bookmark.folder.name}
            </Badge>
          )}
        </a>
      </div>

      {/* Card Content */}
      <div className="flex flex-col justify-between gap-4 p-4">
        <div className="space-y-1.5">
          <a
            href={bookmark.url}
            target="_blank"
            rel="noreferrer"
            className="group/link block text-sm leading-tight font-semibold text-brand-charcoal hover:underline"
          >
            {bookmark.title || bookmark.url}
            <ArrowSquareOut className="ml-1 inline-block h-3 w-3 text-brand-muted opacity-0 transition-opacity group-hover/link:opacity-100" />
          </a>
          <div className="flex flex-wrap items-center gap-1.5">
            {bookmark.status === "BROKEN" && (
              <Badge
                variant="outline"
                className="shrink-0 border-none bg-red-50 px-1.5 py-0.5 font-mono text-[9px] text-red-600 uppercase"
              >
                Broken
              </Badge>
            )}
            {bookmark.status === "REDIRECTED" && (
              <Badge
                variant="outline"
                className="shrink-0 border-none bg-blue-50 px-1.5 py-0.5 font-mono text-[9px] text-blue-600 uppercase"
                title="URL updated automatically to new address"
              >
                Redirected
              </Badge>
            )}
          </div>
          {bookmark.description && (
            <p className="mt-1 text-[11px] leading-relaxed text-brand-muted">
              {bookmark.description}
            </p>
          )}
        </div>

        <div className="space-y-3 pt-2">
          {/* Tags */}
          {bookmark.tags && bookmark.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {bookmark.tags.map((tag: any) => (
                <span
                  key={tag.id}
                  onClick={() => onSelectTag(tag.name)}
                  className="bg-brand-blue-bg text-brand-blue-text cursor-pointer rounded-none px-1.5 py-0.5 font-mono text-[9px] hover:opacity-80"
                >
                  #{tag.name}
                </span>
              ))}
            </div>
          )}

          {/* Actions footer */}
          <div className="flex items-center justify-between border-t border-brand-border pt-2.5">
            <span className="font-mono text-[9px] text-brand-muted/70">
              {new Date(bookmark.createdAt).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
            <div className="flex items-center gap-0.5">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={() => onToggleFavorite(bookmark)}
                    variant="ghost"
                    size="icon-xs"
                    className="size-7"
                  >
                    <Star
                      className={cn(
                        "h-3.5 w-3.5",
                        bookmark.isFavorite
                          ? "text-[#956400]"
                          : "text-brand-muted"
                      )}
                      weight={bookmark.isFavorite ? "fill" : "regular"}
                    />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Favorite</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={() => onToggleArchive(bookmark)}
                    variant="ghost"
                    size="icon-xs"
                    className="size-7"
                  >
                    <Archive
                      className={cn(
                        "h-3.5 w-3.5",
                        bookmark.isArchived
                          ? "text-brand-blue-text"
                          : "text-brand-muted"
                      )}
                      weight={bookmark.isArchived ? "fill" : "regular"}
                    />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Archive</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={() => onDuplicateBookmark(bookmark)}
                    variant="ghost"
                    size="icon-xs"
                    className="size-7"
                  >
                    <Copy className="h-3.5 w-3.5 text-brand-muted" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Duplicate</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={() => onEditBookmark(bookmark)}
                    variant="ghost"
                    size="icon-xs"
                    className="size-7"
                  >
                    <PencilSimple className="h-3.5 w-3.5 text-brand-muted" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Edit</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={() => onDeleteBookmark(bookmark.id)}
                    variant="ghost"
                    size="icon-xs"
                    className="hover:bg-brand-red-bg hover:text-brand-red-text size-7"
                  >
                    <Trash className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Delete</TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}

interface BookmarkMoodboardViewProps {
  bookmarks: any[]
  activeColumnCount: number
  selectedBookmarkIds: string[]
  onToggleSelect: (id: string) => void
  onSelectTag: (tagName: string) => void
  onToggleFavorite: (bookmark: any) => void
  onToggleArchive: (bookmark: any) => void
  onEditBookmark: (bookmark: any) => void
  onDeleteBookmark: (id: string) => void
  onDuplicateBookmark: (bookmark: any) => void
  getHostname: (url: string) => string
  getPastelColor: (str: string) => { bg: string; text: string }
  onReorder?: (newOrder: any[]) => void
}

export function BookmarkMoodboardView({
  bookmarks,
  activeColumnCount,
  selectedBookmarkIds,
  onToggleSelect,
  onSelectTag,
  onToggleFavorite,
  onToggleArchive,
  onEditBookmark,
  onDeleteBookmark,
  onDuplicateBookmark,
  getHostname,
  getPastelColor,
  onReorder,
}: BookmarkMoodboardViewProps) {
  return (
    <Sortable
      value={bookmarks}
      onValueChange={(newItems) => onReorder?.(newItems)}
      getItemValue={(item) => item.id}
      orientation="mixed"
    >
      <SortableContent withoutSlot>
        <div
          className={`grid gap-4 ${
            activeColumnCount === 1
              ? "grid-cols-1"
              : activeColumnCount === 2
                ? "grid-cols-2"
                : activeColumnCount === 3
                  ? "grid-cols-3"
                  : "grid-cols-4"
          } items-start`}
        >
          {Array.from({ length: activeColumnCount }).map((_, colIndex) => {
            const colBookmarks = bookmarks.filter(
              (_, idx) => idx % activeColumnCount === colIndex
            )
            return (
              <div key={colIndex} className="flex flex-col gap-4">
                {colBookmarks.map((bookmark: any) => (
                  <SortableItem key={bookmark.id} value={bookmark.id} asHandle>
                    <MoodboardCard
                      bookmark={bookmark}
                      onSelectTag={onSelectTag}
                      onToggleFavorite={onToggleFavorite}
                      onToggleArchive={onToggleArchive}
                      onEditBookmark={onEditBookmark}
                      onDeleteBookmark={onDeleteBookmark}
                      onDuplicateBookmark={onDuplicateBookmark}
                      getHostname={getHostname}
                      getPastelColor={getPastelColor}
                      isSelected={selectedBookmarkIds.includes(bookmark.id)}
                      onToggleSelect={() => onToggleSelect(bookmark.id)}
                    />
                  </SortableItem>
                ))}
              </div>
            )
          })}
        </div>
      </SortableContent>
      <SortableOverlay>
        {(activeItem) => {
          const bookmark = bookmarks.find((b: any) => b.id === activeItem.value)
          if (!bookmark) return null
          return (
            <div className="pointer-events-none w-72 overflow-hidden rounded-2xl opacity-95 shadow-2xl ring-2 ring-black/10">
              <MoodboardCard
                bookmark={bookmark}
                onSelectTag={onSelectTag}
                onToggleFavorite={onToggleFavorite}
                onToggleArchive={onToggleArchive}
                onEditBookmark={onEditBookmark}
                onDeleteBookmark={onDeleteBookmark}
                onDuplicateBookmark={onDuplicateBookmark}
                getHostname={getHostname}
                getPastelColor={getPastelColor}
                isSelected={selectedBookmarkIds.includes(bookmark.id)}
                onToggleSelect={() => onToggleSelect(bookmark.id)}
              />
            </div>
          )
        }}
      </SortableOverlay>
    </Sortable>
  )
}
