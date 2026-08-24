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
import {
  Star,
  Archive,
  PencilSimple,
  Trash,
  Copy,
  DotsThreeVertical,
  LinkSimple,
} from "@phosphor-icons/react"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@atlas/ui/components/dropdown-menu"
import { toast } from "@atlas/ui/components/sonner"
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
  const handleCopyUrl = (url: string, e: React.MouseEvent) => {
    e.stopPropagation()
    navigator.clipboard?.writeText(url)
    toast.success("URL copied to clipboard")
  }

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
                "group/item flex items-center justify-between gap-2.5 bg-white px-2.5 py-2.5 text-xs transition-all hover:bg-brand-charcoal/5 sm:gap-4 sm:px-3",
                isSelected && "bg-brand-charcoal/5"
              )}
            >
              <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
                <div
                  className={cn(
                    "shrink-0 transition-opacity",
                    isSelected
                      ? "opacity-100"
                      : "opacity-80 focus-within:opacity-100 sm:opacity-0 sm:group-hover/item:opacity-100"
                  )}
                >
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => onToggleSelect(bookmark.id)}
                    className="rounded-none border-brand-border data-[state=checked]:border-brand-charcoal data-[state=checked]:bg-brand-charcoal"
                  />
                </div>
                <span className="flex min-w-0 flex-1 items-center gap-2 truncate">
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
                    className="truncate font-semibold text-brand-charcoal hover:underline"
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
                    className="bg-brand-green-bg text-brand-green-text hidden shrink-0 rounded-none border-none px-1.5 py-0.5 font-mono text-[9px] uppercase sm:inline-flex"
                  >
                    {bookmark.folder.name}
                  </Badge>
                )}
                {bookmark.status === "BROKEN" && (
                  <Badge
                    variant="outline"
                    className="shrink-0 rounded-none border-none bg-red-50 px-1.5 py-0.5 font-mono text-[9px] text-red-600 uppercase"
                  >
                    Broken
                  </Badge>
                )}
                {bookmark.status === "REDIRECTED" && (
                  <Badge
                    variant="outline"
                    className="shrink-0 rounded-none border-none bg-blue-50 px-1.5 py-0.5 font-mono text-[9px] text-blue-600 uppercase"
                    title="URL updated automatically to new address"
                  >
                    Redirected
                  </Badge>
                )}
              </div>

              <div className="flex shrink-0 items-center gap-2 sm:gap-4">
                {/* Tags */}
                {bookmark.tags && bookmark.tags.length > 0 && (
                  <div className="hidden items-center gap-1 md:flex">
                    {bookmark.tags.slice(0, 3).map((tag: any) => (
                      <span
                        key={tag.id}
                        onClick={() => onSelectTag(tag.name)}
                        className="bg-brand-blue-bg text-brand-blue-text shrink-0 cursor-pointer rounded-none px-1.5 py-0.5 font-mono text-[9px] hover:opacity-80"
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
                        title={bookmark.isFavorite ? "Unfavorite" : "Favorite"}
                      >
                        <Star
                          className={cn(
                            "size-3.5",
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

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        className="size-7 text-brand-muted hover:text-brand-charcoal"
                        title="More actions"
                      >
                        <DotsThreeVertical className="size-3.5" weight="bold" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="w-44 rounded-none"
                    >
                      <DropdownMenuItem
                        onClick={() => onEditBookmark(bookmark)}
                        className="flex items-center gap-2 text-xs"
                      >
                        <PencilSimple className="size-3.5" />
                        <span>Edit Details</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => handleCopyUrl(bookmark.url, e)}
                        className="flex items-center gap-2 text-xs"
                      >
                        <LinkSimple className="size-3.5" />
                        <span>Copy Link</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onDuplicateBookmark(bookmark)}
                        className="flex items-center gap-2 text-xs"
                      >
                        <Copy className="size-3.5" />
                        <span>Duplicate</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onToggleArchive(bookmark)}
                        className="flex items-center gap-2 text-xs"
                      >
                        <Archive className="size-3.5" />
                        <span>
                          {bookmark.isArchived ? "Unarchive" : "Archive"}
                        </span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => onDeleteBookmark(bookmark.id)}
                        className="flex items-center gap-2 text-xs text-red-600 focus:bg-red-50 focus:text-red-700"
                      >
                        <Trash className="size-3.5" />
                        <span>Delete</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
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
