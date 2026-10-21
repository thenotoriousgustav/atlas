"use client"

import React from "react"
import { useDndContext } from "@dnd-kit/core"
import { Masonry, MasonryItem } from "@/components/ui/masonry"
import { bookmarkCollisionDetection, masonrySortingStrategy } from "@/lib/bookmark-sortable"
import { cn } from "@/lib/utils"
import { startBookmarkDrag } from "@/lib/bookmark-drag"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip"
import {
  Star,
  PushPin,
  Archive,
  PencilSimple,
  Trash,
  ArrowSquareOut,
  Copy,
  DotsThreeVertical,
  LinkSimple,
  ArrowCounterClockwise,
  FileText,
  DownloadSimple,
  VideoCamera,
  Clock,
  FolderSimple,
  Check,
} from "@phosphor-icons/react"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuGroup,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { toast } from "@/components/ui/sonner"
import { defaultDisplayPreferences, type DisplayPreferences } from "./display-preferences"
import {
  Sortable,
  SortableContent,
  SortableItem,
  SortableOverlay,
} from "@/components/ui/sortable"

interface MoodboardCardProps {
  showActions?: boolean
  nativeDrag?: boolean
  onTogglePin?: (bookmark: any) => void
  displayPreferences?: DisplayPreferences
  bookmark: any
  folders?: any[]
  onSelectTag: (tagName: string) => void
  onToggleFavorite: (bookmark: any) => void
  onToggleArchive: (bookmark: any) => void
  onEditBookmark: (bookmark: any) => void
  onDeleteBookmark: (id: string) => void
  onDuplicateBookmark: (bookmark: any) => void
  getHostname: (url: string) => string
  getPastelColor: (str: string) => { bg: string; text: string }
  isSelected: boolean
  hasSelectedItems?: boolean
  selectedBookmarkIds?: string[]
  onToggleSelect: () => void
  isTrashView?: boolean
  onRestoreBookmark?: (id: string) => void
  onPermanentDeleteBookmark?: (id: string) => void
  onOpenActionSheet?: (bookmark: any) => void
  onOpenDownload?: (bookmark: any) => void
  onInspectBookmark?: (bookmark: any) => void
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
  // Invalidate previews cached before the Reddit share-image request fix.
  return `${apiBase}/v1/bookmarks/proxy-image?v=2&url=${encodeURIComponent(imageUrl)}`
}

type NoteDocNode = {
  type?: string
  text?: string
  attrs?: Record<string, any>
  content?: NoteDocNode[]
}

function getNodeText(node?: NoteDocNode): string {
  if (!node) return ""
  if (typeof node.text === "string") return node.text
  if (!Array.isArray(node.content)) return ""
  return node.content.map((child) => getNodeText(child)).join("")
}

function parseNoteBlocks(noteDocument: unknown): NoteDocNode[] {
  if (!noteDocument) return []
  try {
    const parsed =
      typeof noteDocument === "string" ? JSON.parse(noteDocument) : noteDocument
    if (
      parsed &&
      typeof parsed === "object" &&
      Array.isArray((parsed as any).content)
    ) {
      return (parsed as any).content as NoteDocNode[]
    }
  } catch {
    return []
  }
  return []
}

function renderNoteBlock(node: NoteDocNode, index: number) {
  const type = node.type

  if (type === "heading") {
    const level = Number(node.attrs?.level || 2)
    const text = getNodeText(node).trim()
    if (!text) return null
    return (
      <p
        key={`heading-${index}`}
        className={cn(
          "line-clamp-1 font-semibold text-foreground",
          level === 1 ? "text-sm" : level === 2 ? "text-[13px]" : "text-xs"
        )}
      >
        {text}
      </p>
    )
  }

  if (type === "bulletList" || type === "orderedList") {
    const items = (node.content || [])
      .map((item) => getNodeText(item).trim())
      .filter(Boolean)
      .slice(0, 3)
    if (!items.length) return null
    const ListTag = type === "orderedList" ? "ol" : "ul"
    return (
      <ListTag
        key={`list-${index}`}
        className={cn(
          "space-y-0.5 pl-4 text-xs text-foreground/90",
          type === "orderedList" ? "list-decimal" : "list-disc"
        )}
      >
        {items.map((item, itemIndex) => (
          <li key={`list-item-${index}-${itemIndex}`} className="list-item">
            <span className="block truncate">{item}</span>
          </li>
        ))}
      </ListTag>
    )
  }

  if (type === "taskList") {
    const items = (node.content || [])
      .map((item) => ({
        text: getNodeText(item).trim(),
        checked: Boolean(item.attrs?.checked),
      }))
      .filter((item) => item.text)
      .slice(0, 3)

    if (!items.length) return null
    return (
      <ul key={`tasks-${index}`} className="space-y-0.5 text-xs text-foreground/90">
        {items.map((item, itemIndex) => (
          <li key={`task-item-${index}-${itemIndex}`}>
            <span className="flex items-center gap-1.5">
              <span aria-hidden="true" className="flex size-3 shrink-0 items-center justify-center rounded-xs border border-current">{item.checked && <Check />}</span>
              <span className="truncate">{item.text}</span>
            </span>
          </li>
        ))}
      </ul>
    )
  }

  if (type === "codeBlock") {
    const text = getNodeText(node).trim()
    if (!text) return null
    return (
      <pre
        key={`code-${index}`}
        className="line-clamp-2 rounded-sm bg-muted/60 px-2 py-1 font-mono text-xs leading-relaxed text-foreground/90"
      >
        {text}
      </pre>
    )
  }

  const text = getNodeText(node).trim()
  if (!text) return null

  return (
    <p key={`paragraph-${index}`} className="line-clamp-2 text-xs leading-relaxed text-foreground/90">
      {text}
    </p>
  )
}

function NoteContentPreview({ bookmark }: { bookmark: any }) {
  const blocks = React.useMemo(
    () => parseNoteBlocks(bookmark.noteDocument).slice(0, 5),
    [bookmark.noteDocument]
  )

  if (!blocks.length) {
    return (
      <p className="line-clamp-4 text-[13px] leading-6 text-foreground/90">
        {bookmark.notes ||
          bookmark.description ||
          "Click to add note content..."}
      </p>
    )
  }

  return (
    <div className="max-h-28 space-y-1 overflow-hidden">
      {blocks.map((node, index) => renderNoteBlock(node, index))}
    </div>
  )
}

export function MoodboardCard({
  showActions = true,
  nativeDrag = true,
  onTogglePin,
  displayPreferences,
  bookmark,
  folders = [],
  onSelectTag,
  onToggleFavorite,
  onToggleArchive,
  onEditBookmark,
  onDeleteBookmark,
  onDuplicateBookmark,
  getHostname,
  getPastelColor,
  isSelected,
  hasSelectedItems = false,
  selectedBookmarkIds = [],
  onToggleSelect,
  isTrashView,
  onRestoreBookmark,
  onPermanentDeleteBookmark,
  onOpenActionSheet,
  onOpenDownload,
  onInspectBookmark,
}: MoodboardCardProps) {
  const hostname = getHostname(bookmark.url)
  const folderName = folders.find((folder) => folder.id === bookmark.folderId)?.name
  const preferences = displayPreferences ?? defaultDisplayPreferences
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
  const color = getPastelColor(hostname)

  const rawImageUrl = bookmark.imageUrl || ""
  const isPendingEnrichment =
    !isNote &&
    (bookmark.metadataStatus === "PENDING" ||
      bookmark.metadataStatus === "PROCESSING")

  const proxiedImageUrl = React.useMemo(
    () => getProxiedImageUrl(rawImageUrl),
    [rawImageUrl]
  )
  const imageRef = React.useRef<HTMLImageElement>(null)
  const [currentSrc, setCurrentSrc] = React.useState<string>(proxiedImageUrl)
  const [imageStatus, setImageStatus] = React.useState<
    "loading" | "ready" | "error"
  >(rawImageUrl || isPendingEnrichment ? "loading" : "error")

  React.useEffect(() => {
    const nextProxied = getProxiedImageUrl(bookmark.imageUrl)
    setCurrentSrc(nextProxied)
    const image = imageRef.current
    setImageStatus(
      image?.getAttribute("src") === nextProxied && image.complete && image.naturalWidth > 0
        ? "ready"
        : bookmark.imageUrl || isPendingEnrichment ? "loading" : "error"
    )
  }, [bookmark.imageUrl, isPendingEnrichment])

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
      draggable={nativeDrag && bookmark.canEdit !== false}
      data-readonly={bookmark.canEdit === false}
      onDragStart={(e) => {
        if (!nativeDrag) {
          e.preventDefault()
          return
        }
        // Pack selected IDs if current card is part of selection, otherwise pack this single ID
        const ids = isSelected && selectedBookmarkIds.length > 0 ? selectedBookmarkIds : [bookmark.id]
        startBookmarkDrag(e, ids, bookmark.title || hostname || "Bookmark")
      }}
      onClick={(e) => {
        // When selection mode is active (any item is selected), clicking anywhere on the card toggles select
        if (hasSelectedItems || e.shiftKey || e.metaKey || e.ctrlKey) {
          e.preventDefault()
          onToggleSelect()
        } else {
          onInspectBookmark?.(bookmark)
        }
      }}
      className={cn(
        "group/card [&[data-readonly=true]_[data-bookmark-actions]]:hidden flex h-auto w-full cursor-pointer flex-col overflow-hidden rounded-lg border border-border/80 bg-card text-card-foreground shadow-none transition-colors hover:border-foreground/25",
        isSelected
          ? "border-library-olive ring-1 ring-library-olive/30"
          : "border-border/80"
      )}
    >
      {/* Top Visual Image Header Container */}
      <div className={cn("relative w-full shrink-0 overflow-hidden bg-muted/30", showActions && !isNote && !preferences.showImage && (hasSelectedItems ? "min-h-10" : "sm:min-h-10"))}>
        {/* Checkbox Overlay (Top Left) */}
        {showActions && <div data-bookmark-actions
          onClick={(e) => e.stopPropagation()}
          className={cn(
            "absolute top-2.5 left-2.5 z-20 flex items-center gap-1 rounded-sm bg-card p-1 transition-opacity",
            isSelected || hasSelectedItems
              ? "opacity-100"
              : "hidden focus-within:opacity-100 sm:flex sm:opacity-0 sm:group-hover/card:opacity-100"
          )}
        >
          <Checkbox
            checked={isSelected}
            onCheckedChange={onToggleSelect}
            aria-label={`Select ${bookmark.title || "bookmark"}`}
            className="border-input"
          />
        </div>}

        {/* Desktop quick actions stay off the saved preview until needed. */}
        {showActions && <div data-bookmark-actions
          onClick={(e) => e.stopPropagation()}
          className="absolute top-2.5 right-2.5 z-20 hidden items-center gap-0.5 rounded-sm bg-card p-0.5 transition-opacity sm:flex sm:opacity-0 sm:group-hover/card:opacity-100 sm:focus-within:opacity-100"
        >
          {isTrashView ? (
            <>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={() => onRestoreBookmark?.(bookmark.id)}
                    variant="ghost"
                    size="icon-xs"
                    className="size-6 text-brand-charcoal hover:bg-brand-charcoal/10"
                    title="Restore"
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
                    className="size-6 text-destructive hover:bg-destructive/10 hover:text-destructive"
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
              {onTogglePin && (
                <Button
                  className="hidden sm:inline-flex"
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => onTogglePin(bookmark)}
                  title={bookmark.isPinned ? "Unpin bookmark" : "Pin to top"}
                  aria-label={bookmark.isPinned ? "Unpin bookmark" : "Pin to top"}
                  aria-pressed={!!bookmark.isPinned}
                >
                  <PushPin weight={bookmark.isPinned ? "fill" : "regular"} />
                </Button>
              )}
              {/* Star / Favorite */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={() => onToggleFavorite(bookmark)}
                    variant="ghost"
                    size="icon-xs"
                    className="hidden size-6 sm:inline-flex"
                    title={bookmark.isFavorite ? "Unfavorite" : "Favorite"}
                  >
                    <Star
                      className={cn(
                        "size-3.5",
                        bookmark.isFavorite ? "text-library-olive" : "text-muted-foreground"
                      )}
                      weight={bookmark.isFavorite ? "fill" : "regular"}
                    />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Favorite</TooltipContent>
              </Tooltip>

              {/* Download Video Media if available */}
              {isVideo && onOpenDownload && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={() => onOpenDownload(bookmark)}
                      variant="ghost"
                      size="icon-xs"
                      className="hidden size-6 sm:inline-flex"
                      title="Download media"
                    >
                      <DownloadSimple className="size-3.5" weight="bold" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Download Media</TooltipContent>
                </Tooltip>
              )}

              {/* Desktop 3-Dot Dropdown */}
              <div className="hidden md:inline-flex">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      className="size-6 text-brand-muted hover:text-brand-charcoal"
                      title="More actions"
                    >
                      <DotsThreeVertical className="size-3.5" weight="bold" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-44">
                    <DropdownMenuGroup>
                    {isVideo && onOpenDownload && (
                      <DropdownMenuItem
                        onClick={() => onOpenDownload(bookmark)}
                        className="flex cursor-pointer items-center gap-2 text-sm"
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
                      variant="destructive"
                      onClick={() => onDeleteBookmark(bookmark.id)}
                    >
                      <Trash className="size-3.5" />
                      <span>Delete</span>
                    </DropdownMenuItem>
                    </DropdownMenuGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </>
          )}
        </div>}

        {isNote ? (
          <div
            onClick={(e) => {
              if (hasSelectedItems || e.shiftKey || e.metaKey || e.ctrlKey) {
                e.preventDefault()
                e.stopPropagation()
                onToggleSelect()
                return
              }
              e.preventDefault()
              e.stopPropagation()
              onEditBookmark(bookmark)
            }}
            className="relative flex min-h-36 w-full cursor-pointer flex-col bg-muted/40 p-4 text-foreground"
          >
            <div className="space-y-1.5">
              <div className="mb-3 flex items-center gap-1.5 pl-6 text-xs font-medium text-muted-foreground">
                <FileText className="size-3.5" />
                <span>Note</span>
              </div>
              {preferences.showDescription && <NoteContentPreview bookmark={bookmark} />}
            </div>
          </div>
        ) : preferences.showImage ? (
          <a
            href={bookmark.url}
            aria-label={`Preview ${bookmark.title || hostname} in Cabinet`}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => {
              if (hasSelectedItems || e.shiftKey || e.metaKey || e.ctrlKey) {
                e.preventDefault()
                e.stopPropagation()
                onToggleSelect()
              } else if (onInspectBookmark) {
                e.preventDefault()
                e.stopPropagation()
                onInspectBookmark(bookmark)
              }
            }}
            className="group/header relative block w-full overflow-hidden bg-muted/20"
          >
            <>
              {/* Thumbnail loading state with Clock icon */}
              {imageStatus === "loading" && (
                <div
                  className="relative flex aspect-[16/10] w-full flex-col items-center justify-center bg-muted/40 p-4 text-muted-foreground"
                  role="status"
                  aria-label="Loading thumbnail"
                >
                  <div className="flex size-10 items-center justify-center rounded-sm border border-border/60 bg-background/80 shadow-2xs">
                    <Clock
                      className="size-5 text-muted-foreground animate-spin"
                      style={{ animationDuration: "3s" }}
                    />
                  </div>
                  <span className="mt-2 text-xs text-muted-foreground">
                    {isPendingEnrichment
                      ? "Generating preview..."
                      : "Loading thumbnail..."}
                  </span>
                </div>
              )}

              {currentSrc && (
                <img
                  ref={imageRef}
                  draggable={false}
                  src={currentSrc}
                  alt={bookmark.title || hostname}
                  onLoad={() => setImageStatus("ready")}
                  onError={handleImageError}
                  className={cn(
                    "block h-auto max-h-96 w-full object-cover transition-opacity duration-200 motion-reduce:transition-none",
                    imageStatus === "ready" ? "opacity-100" : "hidden"
                  )}
                />
              )}

              {imageStatus === "error" && (
                <div className={cn("relative flex w-full flex-col justify-end bg-muted/50 px-4 pb-4 pt-14", preferences.showWebsite ? "min-h-28" : "min-h-14")}>
                  {preferences.showWebsite && <span className="max-w-full truncate font-serif text-2xl tracking-tight text-muted-foreground">{hostname.replace(/^www\./, "")}</span>}
                </div>
              )}
            </>
          </a>
        ) : null}
      </div>

      {/* Card Content */}
      <CardContent className={cn("flex flex-1 flex-col", preferences.density === "compact" ? "gap-2 p-3" : "gap-3 p-4")}>
        <div className="flex flex-col gap-1.5">
          {isVideo && (
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge
                variant="outline"
                className="rounded-sm border-border bg-muted px-1.5 py-0.5 text-xs font-medium text-muted-foreground"
              >
                <VideoCamera className="mr-1 inline-block size-3" />
                Video
              </Badge>
            </div>
          )}

          {preferences.showTitle &&
            (isNote ? (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation()
                  if (hasSelectedItems || event.shiftKey || event.metaKey || event.ctrlKey) onToggleSelect()
                  else onEditBookmark(bookmark)
                }}
                className={cn("line-clamp-2 text-left leading-6 font-medium text-foreground hover:underline", preferences.density === "compact" ? "text-sm" : "text-[15px]")}
              >
                {bookmark.title || "Untitled note"}
              </button>
            ) : (
              <a
                href={bookmark.url}
                title={bookmark.title || bookmark.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className={cn("group/link line-clamp-2 leading-6 font-medium text-foreground decoration-foreground/30 underline-offset-4 hover:underline focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-ring", preferences.density === "compact" ? "text-sm" : "text-[15px]")}
              >
                {bookmark.title || bookmark.url}
              </a>
            ))}
          {!isNote &&
            (bookmark.status === "BROKEN" ||
              bookmark.status === "REDIRECTED") && (
              <div className="flex flex-wrap items-center gap-1.5">
                {bookmark.status === "BROKEN" && (
                  <Badge
                    variant="outline"
                    className="shrink-0 rounded-sm border-none bg-destructive/10 px-1.5 py-0.5 text-xs text-destructive"
                  >
                    Broken
                  </Badge>
                )}
                {bookmark.status === "REDIRECTED" && (
                  <Badge
                    variant="outline"
                    className="shrink-0 rounded-sm border-none bg-muted px-1.5 py-0.5 text-xs text-muted-foreground"
                    title="URL updated automatically to new address"
                  >
                    Redirected
                  </Badge>
                )}
              </div>
            )}
          {preferences.showDescription && !isNote && bookmark.description && (
            <p className={cn("line-clamp-2 leading-5 text-muted-foreground", preferences.density === "compact" ? "text-xs" : "text-sm")}>
              {bookmark.description}
            </p>
          )}
          {preferences.showWebsite && hostname && (imageStatus !== "error" || !preferences.showImage) && (
            <p className="truncate text-xs leading-5 text-muted-foreground">
              {hostname}
            </p>
          )}
        </div>

        {bookmark.canEdit === false && <p className="text-xs text-muted-foreground">Shared bookmark · Read-only</p>}
        {(preferences.showFolder || preferences.showDate || bookmark.isPinned) && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-1 text-xs leading-5 text-muted-foreground">
            {bookmark.isPinned && <span className="flex items-center gap-1 text-library-olive"><PushPin className="size-3" weight="fill" />Pinned</span>}
            {preferences.showFolder && (
              <span className="flex min-w-0 max-w-full items-center gap-1" title={folderName || "Unfiled"}>
                <FolderSimple className="size-3 shrink-0" aria-hidden="true" />
                <span className="truncate">{folderName || "Unfiled"}</span>
              </span>
            )}
            {preferences.showDate && bookmark.createdAt && (
              <time dateTime={bookmark.createdAt} title="Date added" className="whitespace-nowrap">
                {new Date(bookmark.createdAt).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}
              </time>
            )}
          </div>
        )}
        {(bookmark.tags?.length > 0 || (showActions && onOpenActionSheet && bookmark.canEdit !== false)) && (
          <div className={cn("flex items-center justify-between gap-2", !bookmark.tags?.length && "md:hidden")}>
          <div className="flex flex-wrap items-center gap-1 pt-0.5">
            {bookmark.tags?.slice(0, 3).map((tag: any) => (
              <button
                type="button"
                key={tag.id || tag.name}
                onClick={(e) => {
                  e.stopPropagation()
                  onSelectTag(tag.name)
                }}
                className="cursor-pointer rounded-sm bg-muted/60 px-1.5 py-1 text-xs text-muted-foreground hover:bg-library-highlight hover:text-library-olive focus-visible:outline-2 focus-visible:outline-ring"
              >
                #{tag.name}
              </button>
            ))}
            {bookmark.tags?.length > 3 && (
              <span className="text-xs text-muted-foreground">
                +{bookmark.tags.length - 3}
              </span>
            )}
          </div>
          {showActions && onOpenActionSheet && bookmark.canEdit !== false && <Button data-bookmark-actions type="button" variant="ghost" size="icon" className="size-11 shrink-0 md:hidden" aria-label="Bookmark actions" onClick={(event) => { event.stopPropagation(); onOpenActionSheet(bookmark) }}><DotsThreeVertical /></Button>}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function MoodboardDragPreview({ bookmark, count, children }: {
  bookmark: any
  count: number
  children: React.ReactNode
}) {
  const { over } = useDndContext()
  return (
    <div inert aria-hidden="true" className="pointer-events-none">
      {over?.data.current?.type === "folder" ? (
        <Badge variant="secondary" className="max-w-44 truncate">
          {count > 1 ? `${count} bookmarks` : bookmark.title || "Bookmark"}
        </Badge>
      ) : children}
    </div>
  )
}

interface BookmarkMoodboardViewProps {
  /** Dashboard shares its drag context with sidebar folder targets. */
  sortableInParent?: boolean
  onTogglePin?: (bookmark: any) => void
  displayPreferences?: DisplayPreferences
  bookmarks: any[]
  folders?: any[]
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
  isTrashView?: boolean
  onRestoreBookmark?: (id: string) => void
  onPermanentDeleteBookmark?: (id: string) => void
  onOpenActionSheet?: (bookmark: any) => void
  onOpenDownload?: (bookmark: any) => void
  onInspectBookmark?: (bookmark: any) => void
}

export function BookmarkMoodboardView({
  sortableInParent = false,
  onTogglePin,
  displayPreferences,
  bookmarks,
  folders,
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
  isTrashView,
  onRestoreBookmark,
  onPermanentDeleteBookmark,
  onOpenActionSheet,
  onOpenDownload,
  onInspectBookmark,
}: BookmarkMoodboardViewProps) {
  const canSort = !isTrashView && !!onReorder
  const renderCard = (bookmark: any) => (
    <MoodboardCard
      nativeDrag={false}
      onTogglePin={onTogglePin}
      displayPreferences={displayPreferences}
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
      isSelected={selectedBookmarkIds.includes(bookmark.id)}
      hasSelectedItems={selectedBookmarkIds.length > 0}
      selectedBookmarkIds={selectedBookmarkIds}
      onToggleSelect={() => onToggleSelect(bookmark.id)}
      isTrashView={isTrashView}
      onRestoreBookmark={onRestoreBookmark}
      onPermanentDeleteBookmark={onPermanentDeleteBookmark}
      onOpenActionSheet={onOpenActionSheet}
      onOpenDownload={onOpenDownload}
      onInspectBookmark={onInspectBookmark}
    />
  )
  const content = (
    <>
      <SortableContent withoutSlot>
        <Masonry columnCount={activeColumnCount} gap={12} linear virtualize={false}>
          {bookmarks.map((bookmark) => (
            <MasonryItem key={bookmark.id}>
              <SortableItem
                value={bookmark.id}
                asHandle={canSort && !bookmark.isPinned && bookmark.canEdit !== false}
                disabled={!canSort || bookmark.isPinned || bookmark.canEdit === false}
                aria-label={`Reorder ${bookmark.title || "bookmark"}`}
                className="w-full rounded-md data-dragging:opacity-30 data-sort-over:ring-2 data-sort-over:ring-primary"
              >
                {renderCard(bookmark)}
              </SortableItem>
            </MasonryItem>
          ))}
        </Masonry>
      </SortableContent>
      <SortableOverlay dropAnimation={null}>
        {({ value }) => {
          const bookmark = bookmarks.find((item) => item.id === value)
          return bookmark ? (
            <MoodboardDragPreview
              bookmark={bookmark}
              count={selectedBookmarkIds.includes(bookmark.id) ? selectedBookmarkIds.length : 1}
            >
              {renderCard(bookmark)}
            </MoodboardDragPreview>
          ) : null
        }}
      </SortableOverlay>
    </>
  )
  return sortableInParent ? content : (
    <Sortable
      value={bookmarks}
      onValueChange={onReorder}
      getItemValue={(item) => item.id}
      orientation="mixed"
      strategy={masonrySortingStrategy}
      collisionDetection={bookmarkCollisionDetection}
    >
      {content}
    </Sortable>
  )
}
