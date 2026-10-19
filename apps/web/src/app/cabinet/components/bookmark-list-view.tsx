import React from "react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip"
import {
  Star,
  Archive,
  PencilSimple,
  Trash,
  Copy,
  DotsThreeVertical,
  LinkSimple,
  ArrowCounterClockwise,
  FileText,
  DownloadSimple,
  VideoCamera,
} from "@phosphor-icons/react"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { toast } from "@/components/ui/sonner"
import type { DisplayPreferences } from "./display-preferences"
import {
  Sortable,
  SortableContent,
  SortableItem,
} from "@/components/ui/sortable"

interface BookmarkListViewProps {
  displayPreferences?: DisplayPreferences
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
  isTrashView?: boolean
  onRestoreBookmark?: (id: string) => void
  onPermanentDeleteBookmark?: (id: string) => void
  onOpenActionSheet?: (bookmark: any) => void
  onOpenDownload?: (bookmark: any) => void
  onInspectBookmark?: (bookmark: any) => void
}

export function BookmarkListView({
  displayPreferences,
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
  isTrashView,
  onRestoreBookmark,
  onPermanentDeleteBookmark,
  onOpenActionSheet,
  onOpenDownload,
  onInspectBookmark,
}: BookmarkListViewProps) {
  const preferences = displayPreferences ?? {
    showTitle: true,
    showDescription: true,
    showImage: true,
    showWebsite: true,
  }
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
          const isNote = bookmark.type === "NOTE" || !bookmark.url
          const isVideo =
            bookmark.contentType === "VIDEO" ||
            (bookmark.url &&
              (bookmark.url.includes("youtube.com") ||
                bookmark.url.includes("youtu.be") ||
                bookmark.url.includes("tiktok.com") ||
                bookmark.url.includes("instagram.com") ||
                bookmark.url.includes("vimeo.com") ||
                bookmark.url.includes("twitter.com") ||
                bookmark.url.includes("x.com")))
          return (
            <SortableItem
              key={bookmark.id}
              value={bookmark.id}

              disabled={isTrashView}
              className={cn(
                "group/item flex h-10 items-center justify-between gap-3 bg-white px-3 text-xs transition-colors hover:bg-muted/40",
                isSelected && "bg-muted/60"
              )}
              draggable
              onDragStart={(e) => {
                const ids = isSelected && selectedBookmarkIds.length > 0 ? selectedBookmarkIds : [bookmark.id]
                e.dataTransfer.setData("application/json", JSON.stringify(ids))
                e.dataTransfer.setData("text/plain", JSON.stringify(ids))
                e.dataTransfer.effectAllowed = "move"
                const rect = e.currentTarget.getBoundingClientRect()
                e.dataTransfer.setDragImage(e.currentTarget, e.clientX - rect.left, e.clientY - rect.top)
              }}
              onClick={(e) => {
                if (selectedBookmarkIds.length > 0 || e.shiftKey || e.metaKey || e.ctrlKey) {
                  e.preventDefault()
                  onToggleSelect(bookmark.id)
                } else {
                  onInspectBookmark?.(bookmark)
                }
              }}
            >
              <div className="flex min-w-0 flex-1 items-center gap-2.5">
                <div
                  onClick={(e) => e.stopPropagation()}
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

                {/* Favicon / Icon */}
                {isNote ? (
                  <div className="flex size-4 shrink-0 items-center justify-center bg-[#fbf0d9] text-[#8a5d3b]">
                    <FileText className="size-3" />
                  </div>
                ) : preferences.showImage ? (
                  <img
                    src={`https://www.google.com/s2/favicons?domain=${hostname}&sz=32`}
                    alt=""
                    className="size-4 shrink-0 rounded-none border border-border bg-white object-contain"
                    onError={(e) => {
                      ;(e.currentTarget as HTMLElement).style.display = "none"
                    }}
                  />
                ) : null}

                {/* Title and Domain on a single clean row */}
                <div className="flex min-w-0 flex-1 items-baseline gap-2 truncate">
                  {isNote ? (
                    <span
                      onClick={(e) => {
                        if (selectedBookmarkIds.length > 0 || e.shiftKey || e.metaKey || e.ctrlKey) {
                          e.preventDefault()
                          e.stopPropagation()
                          onToggleSelect(bookmark.id)
                          return
                        }
                        e.stopPropagation()
                        onEditBookmark(bookmark)
                      }}
                      className="cursor-pointer truncate font-serif font-medium text-foreground hover:underline"
                    >
                      {bookmark.title || "Untitled Note"}
                    </span>
                  ) : (
                    <a
                      href={bookmark.url}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => {
                        if (selectedBookmarkIds.length > 0 || e.shiftKey || e.metaKey || e.ctrlKey) {
                          e.preventDefault()
                          e.stopPropagation()
                          onToggleSelect(bookmark.id)
                        } else {
                          e.stopPropagation()
                        }
                      }}
                      className="truncate font-medium text-foreground hover:underline"
                    >
                      {bookmark.title || bookmark.url}
                    </a>
                  )}

                  {!isNote && preferences.showWebsite && hostname && (
                    <span className="hidden shrink-0 font-mono text-[10px] text-muted-foreground sm:inline">
                      {hostname}
                    </span>
                  )}
                </div>

                {/* Tags (max 2) */}
                {bookmark.tags && bookmark.tags.length > 0 && (
                  <div className="hidden shrink-0 items-center gap-1 md:flex">
                    {bookmark.tags.slice(0, 2).map((tag: any) => (
                      <span
                        key={tag.id}
                        onClick={(e) => {
                          e.stopPropagation()
                          onSelectTag(tag.name)
                        }}
                        className="bg-brand-blue-bg text-brand-blue-text cursor-pointer rounded-none px-1.5 py-0.5 font-mono text-[9px] hover:opacity-80"
                      >
                        #{tag.name}
                      </span>
                    ))}
                  </div>
                )}

                {/* Badges */}
                {isNote && (
                  <Badge
                    variant="outline"
                    className="shrink-0 rounded-none border-[#ebd8b7] bg-[#fbf0d9] px-1.5 py-0 font-mono text-[9px] text-[#8a5d3b] uppercase"
                  >
                    Note
                  </Badge>
                )}
                {isVideo && (
                  <Badge
                    variant="outline"
                    className="shrink-0 rounded-none border-purple-200 bg-purple-50 px-1.5 py-0 font-mono text-[9px] text-purple-700 uppercase"
                  >
                    Video
                  </Badge>
                )}
                {bookmark.folder && (
                  <span className="hidden shrink-0 font-mono text-[10px] text-muted-foreground lg:inline">
                    [{bookmark.folder.name}]
                  </span>
                )}
              </div>

              <div className="flex shrink-0 items-center gap-3">
                {/* Date */}
                <span className="hidden font-mono text-[10px] text-muted-foreground/80 md:inline-block">
                  {new Date(bookmark.createdAt).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  })}
                </span>

                {/* Quick Actions (revealed on hover) */}
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-0.5 opacity-90 transition-opacity sm:opacity-0 sm:group-hover/item:opacity-100 sm:focus-within:opacity-100"
                >
                  {isTrashView ? (
                    <>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            onClick={() => onRestoreBookmark?.(bookmark.id)}
                            variant="ghost"
                            size="icon-xs"
                            className="size-7 text-brand-charcoal hover:bg-brand-charcoal/10"
                            title="Restore bookmark"
                          >
                            <ArrowCounterClockwise className="size-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Restore</TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            onClick={() =>
                              onPermanentDeleteBookmark?.(bookmark.id)
                            }
                            variant="ghost"
                            size="icon-xs"
                            className="size-7 text-red-600 hover:bg-red-50 hover:text-red-700"
                            title="Delete permanently"
                          >
                            <Trash className="size-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Delete Permanently</TooltipContent>
                      </Tooltip>
                    </>
                  ) : (
                    <>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            onClick={() => onToggleFavorite(bookmark)}
                            variant="ghost"
                            size="icon-xs"
                            className="size-8 sm:size-7"
                            title={
                              bookmark.isFavorite ? "Unfavorite" : "Favorite"
                            }
                          >
                            <Star
                              className={cn(
                                "size-4 sm:size-3.5",
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

                      {/* Download Video Media Button */}
                      {isVideo && onOpenDownload && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              onClick={(e) => {
                                e.stopPropagation()
                                onOpenDownload(bookmark)
                              }}
                              variant="ghost"
                              size="icon-xs"
                              className="size-8 text-purple-600 hover:bg-purple-50 hover:text-purple-700 sm:size-7"
                              title="Download video/audio with yt-dlp"
                            >
                              <DownloadSimple
                                className="size-4 sm:size-3.5"
                                weight="bold"
                              />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Download Media</TooltipContent>
                        </Tooltip>
                      )}

                      {/* Mobile Action Sheet Trigger */}
                      <Button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          onOpenActionSheet?.(bookmark)
                        }}
                        variant="ghost"
                        size="icon-xs"
                        className="flex size-8 text-brand-muted hover:text-brand-charcoal md:hidden"
                        title="More actions"
                      >
                        <DotsThreeVertical className="size-4" weight="bold" />
                      </Button>

                      {/* Desktop Dropdown Menu */}
                      <div className="hidden md:inline-flex">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              className="size-7 text-brand-muted hover:text-brand-charcoal"
                              title="More actions"
                            >
                              <DotsThreeVertical
                                className="size-3.5"
                                weight="bold"
                              />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            className="w-48 rounded-none"
                          >
                            {isVideo && onOpenDownload && (
                              <DropdownMenuItem
                                onClick={() => onOpenDownload(bookmark)}
                                className="flex cursor-pointer items-center gap-2 text-xs font-medium text-purple-600"
                              >
                                <DownloadSimple className="size-3.5" />
                                <span>Download Media</span>
                              </DropdownMenuItem>
                            )}

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
                    </>
                  )}
                </div>
              </div>
            </SortableItem>
          )
        })}
      </SortableContent>
    </Sortable>
  )
}
