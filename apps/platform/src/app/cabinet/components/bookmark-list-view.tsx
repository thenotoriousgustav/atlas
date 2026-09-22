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
  ArrowCounterClockwise,
  BookOpen,
  Globe,
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
  isTrashView?: boolean
  onRestoreBookmark?: (id: string) => void
  onPermanentDeleteBookmark?: (id: string) => void
  onOpenActionSheet?: (bookmark: any) => void
  onOpenReader?: (bookmark: any, initialTab?: "reader" | "webview") => void
  onOpenDownload?: (bookmark: any) => void
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
  isTrashView,
  onRestoreBookmark,
  onPermanentDeleteBookmark,
  onOpenActionSheet,
  onOpenReader,
  onOpenDownload,
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
              asHandle={!isTrashView}
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
                  {isNote ? (
                    <div className="flex size-4 shrink-0 items-center justify-center bg-[#fbf0d9] text-[#8a5d3b]">
                      <FileText className="size-3" />
                    </div>
                  ) : (
                    <img
                      src={`https://www.google.com/s2/favicons?domain=${hostname}&sz=32`}
                      alt=""
                      className="size-4 shrink-0 rounded-none border border-brand-border/60 bg-white object-contain"
                      onError={(e) => {
                        ;(e.currentTarget as HTMLElement).style.display = "none"
                      }}
                    />
                  )}
                  {isNote ? (
                    <span
                      onClick={() => onEditBookmark(bookmark)}
                      className="cursor-pointer truncate font-serif font-medium text-brand-charcoal hover:underline"
                    >
                      {bookmark.title || "Untitled Note"}
                    </span>
                  ) : (
                    <a
                      href={bookmark.url}
                      target="_blank"
                      rel="noreferrer"
                      className="truncate font-medium text-brand-charcoal hover:underline"
                    >
                      {bookmark.title || bookmark.url}
                    </a>
                  )}
                  {!isNote && (
                    <span className="hidden truncate font-mono text-[10px] text-brand-muted/70 md:inline">
                      ({hostname})
                    </span>
                  )}
                </span>
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
                            onClick={() => onPermanentDeleteBookmark?.(bookmark.id)}
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
                            title={bookmark.isFavorite ? "Unfavorite" : "Favorite"}
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
                              className="size-8 sm:size-7 text-purple-600 hover:bg-purple-50 hover:text-purple-700"
                              title="Download video/audio with yt-dlp"
                            >
                              <DownloadSimple className="size-4 sm:size-3.5" weight="bold" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Download Media</TooltipContent>
                        </Tooltip>
                      )}

                      {/* Live Web View Button */}
                      {!isNote && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              onClick={(e) => {
                                e.stopPropagation()
                                onOpenReader?.(bookmark, "webview")
                              }}
                              variant="ghost"
                              size="icon-xs"
                              className="size-8 sm:size-7 text-brand-muted hover:text-brand-charcoal"
                              title="Live Web View"
                            >
                              <Globe className="size-4 sm:size-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Live Web View</TooltipContent>
                        </Tooltip>
                      )}

                      {/* Reader Mode Button */}
                      {!isNote && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              onClick={(e) => {
                                e.stopPropagation()
                                onOpenReader?.(bookmark, "reader")
                              }}
                              variant="ghost"
                              size="icon-xs"
                              className={cn(
                                "size-8 sm:size-7",
                                bookmark.article?.isRead
                                  ? "text-emerald-700 hover:bg-emerald-50"
                                  : bookmark.article
                                    ? "text-brand-charcoal hover:bg-brand-charcoal/10"
                                    : "text-brand-muted hover:text-brand-charcoal"
                              )}
                              title="Reader Mode & Archive"
                            >
                              <BookOpen
                                className="size-4 sm:size-3.5"
                                weight={bookmark.article?.isRead ? "fill" : "regular"}
                              />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            {bookmark.article?.readingTimeMinutes
                              ? `Reader Mode (${bookmark.article.readingTimeMinutes} min)`
                              : "Reader Mode & Archive"}
                          </TooltipContent>
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
                              <DotsThreeVertical className="size-3.5" weight="bold" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            className="w-48 rounded-none"
                          >
                            {isVideo && onOpenDownload && (
                              <DropdownMenuItem
                                onClick={() => onOpenDownload(bookmark)}
                                className="flex items-center gap-2 text-xs cursor-pointer font-medium text-purple-600"
                              >
                                <DownloadSimple className="size-3.5" />
                                <span>Download Media</span>
                              </DropdownMenuItem>
                            )}
                            {!isNote && (
                              <>
                                <DropdownMenuItem
                                  onClick={() => onOpenReader?.(bookmark, "webview")}
                                  className="flex items-center gap-2 text-xs cursor-pointer"
                                >
                                  <Globe className="size-3.5 text-brand-muted" />
                                  <span>Live Web View</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => onOpenReader?.(bookmark, "reader")}
                                  className="flex items-center gap-2 text-xs cursor-pointer"
                                >
                                  <BookOpen className="size-3.5 text-brand-muted" />
                                  <span>Reader Mode &amp; Archive</span>
                                </DropdownMenuItem>
                              </>
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
