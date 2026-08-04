import React from "react"
import { cn } from "@atlas/ui/lib/utils"
import { Badge } from "@atlas/ui/components/badge"
import { Button } from "@atlas/ui/components/button"
import { Checkbox } from "@atlas/ui/components/checkbox"
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@atlas/ui/components/tooltip"
import { Star, Archive, PencilSimple, Trash, Copy } from "@phosphor-icons/react"
import {
  Sortable,
  SortableContent,
  SortableItem,
  SortableOverlay,
} from "@atlas/ui/components/sortable"

interface BookmarkListViewProps {
  bookmarks: any[]
  selectedBookmarkIds: string[]
  onToggleSelect: (id: string) => void
  onSelectTag: (tagName: string) => void
  onToggleFavorite: (bookmark: any) => void
  onToggleArchive: (bookmark: any) => void
  onEditBookmark: (bookmark: any) => void
  onDeleteBookmark: (id: string) => void
  onDuplicateBookmark: (bookmark: any) => void
  getHostname: (url: string) => string
  onReorder?: (newOrder: any[]) => void
}

export function BookmarkListView({
  bookmarks,
  selectedBookmarkIds,
  onToggleSelect,
  onSelectTag,
  onToggleFavorite,
  onToggleArchive,
  onEditBookmark,
  onDeleteBookmark,
  onDuplicateBookmark,
  getHostname,
  onReorder,
}: BookmarkListViewProps) {
  return (
    <Sortable
      value={bookmarks}
      onValueChange={(newItems) => onReorder?.(newItems)}
      getItemValue={(item) => item.id}
      orientation="vertical"
    >
      <SortableContent className="divide-y divide-brand-border border border-brand-border">
        {bookmarks.map((bookmark: any) => {
          const hostname = getHostname(bookmark.url)
          const isSelected = selectedBookmarkIds.includes(bookmark.id)
          return (
            <SortableItem
              key={bookmark.id}
              value={bookmark.id}
              asHandle
              className={cn(
                "group/item flex items-center justify-between gap-4 bg-white px-3 py-2.5 text-xs transition-all hover:bg-brand-charcoal/5",
                isSelected && "bg-brand-charcoal/5"
              )}
            >
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <div
                  className={cn(
                    "shrink-0 transition-opacity",
                    isSelected
                      ? "opacity-100"
                      : "opacity-0 group-hover/item:opacity-100 focus-within:opacity-100"
                  )}
                >
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => onToggleSelect(bookmark.id)}
                    className="rounded-none border-brand-border data-[state=checked]:border-brand-charcoal data-[state=checked]:bg-brand-charcoal"
                  />
                </div>
                <span className="flex min-w-0 items-center gap-2">
                  <img
                    src={`https://www.google.com/s2/favicons?domain=${hostname}&sz=32`}
                    alt=""
                    className="size-4 shrink-0 rounded-none border border-brand-border/60 bg-white object-contain"
                    onError={(e) => {
                      ;(e.currentTarget as HTMLElement).style.display = "none"
                    }}
                  />
                  <a
                    href={bookmark.url}
                    target="_blank"
                    rel="noreferrer"
                    className="shrink-0 truncate font-semibold text-brand-charcoal hover:underline"
                  >
                    {bookmark.title || bookmark.url}
                  </a>
                  <span className="hidden truncate font-mono text-[10px] text-brand-muted/70 md:inline">
                    ({hostname})
                  </span>
                </span>
                {bookmark.folder && (
                  <Badge
                    variant="outline"
                    className="bg-brand-green-bg text-brand-green-text shrink-0 border-none px-1.5 py-0.5 font-mono text-[9px] uppercase"
                  >
                    {bookmark.folder.name}
                  </Badge>
                )}
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

              <div className="flex shrink-0 items-center gap-4">
                {/* Tags */}
                {bookmark.tags && bookmark.tags.length > 0 && (
                  <div className="hidden items-center gap-1 sm:flex">
                    {bookmark.tags.slice(0, 3).map((tag: any) => (
                      <span
                        key={tag.id}
                        onClick={() => onSelectTag(tag.name)}
                        className="bg-brand-blue-bg text-brand-blue-text shrink-0 cursor-pointer px-1.5 py-0.5 font-mono text-[9px] hover:opacity-80"
                      >
                        #{tag.name}
                      </span>
                    ))}
                  </div>
                )}

                {/* Date */}
                <span className="hidden font-mono text-[10px] text-brand-muted/80 lg:inline-block">
                  {new Date(bookmark.createdAt).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  })}
                </span>

                {/* Actions */}
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
            </SortableItem>
          )
        })}
      </SortableContent>
      <SortableOverlay>
        {(activeItem) => {
          const bookmark = bookmarks.find((b: any) => b.id === activeItem.value)
          if (!bookmark) return null
          const hostname = getHostname(bookmark.url)
          return (
            <div className="flex w-full items-center justify-between gap-4 border border-brand-charcoal bg-white px-3 py-2.5 text-xs shadow-lg">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <img
                  src={`https://www.google.com/s2/favicons?domain=${hostname}&sz=32`}
                  alt=""
                  className="size-4 shrink-0 rounded-none border border-brand-border/60 bg-white object-contain"
                />
                <span className="truncate font-semibold text-brand-charcoal">
                  {bookmark.title || bookmark.url}
                </span>
                <span className="hidden truncate font-mono text-[10px] text-brand-muted/70 md:inline">
                  ({hostname})
                </span>
              </div>
            </div>
          )
        }}
      </SortableOverlay>
    </Sortable>
  )
}
