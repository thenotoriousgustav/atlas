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
import { RedditPreviewBox } from "./reddit-preview-box"

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

function getProxiedImageUrl(imageUrl?: string | null): string {
  if (!imageUrl) return ""
  if (
    imageUrl.startsWith("/") ||
    imageUrl.startsWith("blob:") ||
    imageUrl.startsWith("data:")
  ) {
    return imageUrl
  }
  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"
  return `${apiBase}/v1/bookmarks/proxy-image?url=${encodeURIComponent(imageUrl)}`
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
  const isReddit =
    bookmark.provider === "REDDIT" ||
    hostname.includes("reddit.com") ||
    hostname.includes("redd.it")
  const color = getPastelColor(hostname)

  const rawImageUrl = bookmark.imageUrl || ""
  const proxiedImageUrl = React.useMemo(
    () => getProxiedImageUrl(rawImageUrl),
    [rawImageUrl]
  )
  const [currentSrc, setCurrentSrc] = React.useState<string>(proxiedImageUrl)
  const [imageStatus, setImageStatus] = React.useState<
    "loading" | "loaded" | "error"
  >(rawImageUrl ? "loading" : "error")

  React.useEffect(() => {
    const nextProxied = getProxiedImageUrl(bookmark.imageUrl)
    setCurrentSrc(nextProxied)
    setImageStatus(bookmark.imageUrl ? "loading" : "error")
  }, [bookmark.imageUrl])

  const handleImageError = () => {
    // If the proxied image failed, try falling back directly to raw URL before giving up
    if (
      currentSrc === proxiedImageUrl &&
      rawImageUrl &&
      proxiedImageUrl !== rawImageUrl
    ) {
      setCurrentSrc(rawImageUrl)
    } else {
      setImageStatus("error")
    }
  }

  const handleCopyUrl = (e: React.MouseEvent) => {
    e.stopPropagation()
    navigator.clipboard?.writeText(bookmark.url)
    toast.success("URL copied to clipboard")
  }

  return (
    <Card
      className={cn(
        "group/card flex h-auto w-full flex-col overflow-hidden rounded-none border bg-white shadow-none ring-0 transition-all",
        isSelected
          ? "border-brand-charcoal"
          : "border-brand-border hover:border-brand-charcoal/40"
      )}
    >
      {/* Top Visual Image Header Container */}
      <div className="relative w-full shrink-0 overflow-hidden border-b border-brand-border bg-brand-canvas">
        {/* Checkbox Overlay */}
        <div
          className={cn(
            "absolute top-2.5 left-2.5 z-20 border border-brand-border bg-white p-px shadow-xs transition-opacity",
            isSelected
              ? "opacity-100"
              : "opacity-80 focus-within:opacity-100 sm:opacity-0 sm:group-hover/card:opacity-100"
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
          className="group/header relative block w-full bg-brand-canvas"
        >
          {isReddit ? (
            <RedditPreviewBox bookmark={bookmark} hostname={hostname} />
          ) : (
            <>
              {imageStatus === "loading" && (
                <div className="absolute inset-0 flex min-h-[160px] animate-pulse items-center justify-center bg-gray-50/50">
                  <Clock className="h-5 w-5 animate-spin text-gray-400" />
                </div>
              )}

              {imageStatus !== "error" && currentSrc && (
                <img
                  src={currentSrc}
                  alt={bookmark.title || hostname}
                  onLoad={() => setImageStatus("loaded")}
                  onError={handleImageError}
                  className={cn(
                    "block h-auto max-h-[320px] w-full object-contain transition-opacity duration-300",
                    imageStatus === "loaded" ? "opacity-100" : "opacity-0"
                  )}
                />
              )}

              {imageStatus === "error" && (
                <div
                  className={cn(
                    "relative flex min-h-[140px] w-full flex-col items-center justify-center p-4",
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
            </>
          )}

          {/* Folder Badge */}
          {bookmark.folder && (
            <Badge
              variant="outline"
              className="absolute top-3 right-3 shrink-0 rounded-none border border-brand-border/80 bg-white/95 px-2 py-0.5 font-mono text-[9px] font-medium text-brand-charcoal uppercase shadow-xs backdrop-blur-sm"
            >
              {bookmark.folder.name}
            </Badge>
          )}
        </a>
      </div>

      {/* Card Content */}
      <div className="flex flex-col justify-between gap-3 p-3 sm:gap-4 sm:p-4">
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
          {bookmark.description && (
            <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-brand-muted">
              {bookmark.description}
            </p>
          )}
        </div>

        <div className="space-y-2.5 pt-1 sm:space-y-3 sm:pt-2">
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
          <div className="flex items-center justify-between border-t border-brand-border pt-2">
            <span className="font-mono text-[9px] text-brand-muted/70">
              {new Date(bookmark.createdAt).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
            <div className="flex items-center gap-1">
              {/* Star / Favorite Button */}
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

              {/* 3-Dot Dropdown Action Menu (Touch Friendly on Mobile) */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    className="size-8 text-brand-muted hover:text-brand-charcoal sm:size-7"
                    title="Bookmark actions"
                  >
                    <DotsThreeVertical
                      className="size-4 sm:size-3.5"
                      weight="bold"
                    />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44 rounded-none">
                  <DropdownMenuItem
                    onClick={() => onEditBookmark(bookmark)}
                    className="flex items-center gap-2 text-xs"
                  >
                    <PencilSimple className="size-3.5" />
                    <span>Edit Details</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleCopyUrl}
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
                    <span>{bookmark.isArchived ? "Unarchive" : "Archive"}</span>
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
          className={cn(
            "grid items-start gap-4",
            activeColumnCount === 1
              ? "grid-cols-1"
              : activeColumnCount === 2
                ? "grid-cols-2"
                : activeColumnCount === 3
                  ? "grid-cols-3"
                  : "grid-cols-4"
          )}
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
