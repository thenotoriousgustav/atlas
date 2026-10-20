"use client"

import React from "react"
import { useDndContext } from "@dnd-kit/core"
import { Masonry, MasonryItem } from "@/components/ui/masonry"
import { bookmarkCollisionDetection, masonrySortingStrategy } from "@/lib/bookmark-sortable"
import { cn } from "@/lib/utils"
import { startBookmarkDrag } from "@/lib/bookmark-drag"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
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
  SortableOverlay,
} from "@/components/ui/sortable"

interface MoodboardCardProps {
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
            <span className="block truncate">
              {item.checked ? "☑" : "☐"} {item.text}
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
        className="line-clamp-2 rounded-xs bg-muted/60 px-2 py-1 font-mono text-[10px] leading-relaxed text-foreground/90"
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
      <p className="line-clamp-4 font-serif text-xs leading-relaxed text-foreground/90">
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
  const preferences = displayPreferences ?? {
    showTitle: true,
    showDescription: true,
    showImage: true,
    showWebsite: true,
    showFolder: true,
    showDate: true,
  }
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
      draggable={nativeDrag}
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
        "group/card flex h-auto w-full cursor-pointer flex-col overflow-hidden rounded-md border border-border/80 bg-card text-card-foreground shadow-2xs transition-all hover:border-foreground/30 hover:shadow-xs",
        isSelected
          ? "border-foreground ring-1 ring-foreground/20"
          : "border-border/80"
      )}
    >
      {/* Top Visual Image Header Container */}
      <div className="relative w-full shrink-0 overflow-hidden bg-muted/30">
        {/* Checkbox Overlay (Top Left) */}
        <div
          onClick={(e) => e.stopPropagation()}
          className={cn(
            "absolute top-2.5 left-2.5 z-20 flex items-center gap-1 rounded-sm border border-border/70 bg-background/90 p-0.5 shadow-2xs backdrop-blur-xs transition-opacity",
            isSelected || bookmark.isPinned
              ? "opacity-100"
              : "opacity-80 focus-within:opacity-100 sm:opacity-0 sm:group-hover/card:opacity-100"
          )}
        >
          <Checkbox
            checked={isSelected}
            onCheckedChange={onToggleSelect}
            className="rounded-xs border-border"
          />
          {bookmark.isPinned && <PushPin className="size-3.5" weight="fill" aria-label="Pinned bookmark" />}
        </div>

        {/* Floating Quick Action Buttons (Top Right - Raindrop style) */}
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute top-2.5 right-2.5 z-20 flex items-center gap-0.5 rounded-sm border border-border/60 bg-background/90 p-0.5 shadow-2xs backdrop-blur-xs transition-opacity opacity-90 sm:opacity-0 sm:group-hover/card:opacity-100 sm:focus-within:opacity-100"
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
                    className="size-6"
                    title={bookmark.isFavorite ? "Unfavorite" : "Favorite"}
                  >
                    <Star
                      className={cn(
                        "size-3.5",
                        bookmark.isFavorite ? "text-[#956400]" : "text-brand-muted"
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
                      className="size-6 text-purple-600 hover:bg-purple-50 hover:text-purple-700"
                      title="Download media"
                    >
                      <DownloadSimple className="size-3.5" weight="bold" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Download Media</TooltipContent>
                </Tooltip>
              )}

              {/* Mobile Action Sheet Trigger */}
              <Button
                type="button"
                onClick={() => onOpenActionSheet?.(bookmark)}
                variant="ghost"
                size="icon-xs"
                className="flex size-6 text-brand-muted hover:text-brand-charcoal md:hidden"
                title="Bookmark actions"
              >
                <DotsThreeVertical className="size-3.5" weight="bold" />
              </Button>

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
                  <DropdownMenuContent align="end" className="w-44 rounded-none">
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
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </>
          )}
        </div>

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
              onEditBookmark(bookmark)
            }}
            className="relative flex aspect-[16/10] w-full cursor-pointer flex-col justify-between bg-muted/40 p-4 text-foreground transition-colors hover:bg-muted/60"
          >
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 font-mono text-[9px] font-semibold tracking-wider text-muted-foreground uppercase">
                <FileText className="size-3.5" />
                <span>Personal Note</span>
              </div>
              <div className="max-w-full line-clamp-2 text-sm font-semibold leading-snug tracking-tight text-foreground">
                {bookmark.title || "Untitled note"}
              </div>
              <NoteContentPreview bookmark={bookmark} />
            </div>
          </div>
        ) : preferences.showImage ? (
          <a
            href={bookmark.url}
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
                  className="relative flex aspect-[16/10] w-full flex-col items-center justify-center bg-muted/40 p-4 text-muted-foreground animate-pulse"
                  role="status"
                  aria-label="Loading thumbnail"
                >
                  <div className="flex size-10 items-center justify-center rounded-sm border border-border/60 bg-background/80 shadow-2xs">
                    <Clock
                      className="size-5 text-muted-foreground animate-spin"
                      style={{ animationDuration: "3s" }}
                    />
                  </div>
                  <span className="mt-2 font-mono text-[10px] font-medium tracking-wider text-muted-foreground/80 uppercase">
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
                    "block h-auto w-full object-cover transition-opacity duration-200",
                    imageStatus === "ready" ? "opacity-100" : "hidden"
                  )}
                />
              )}

              {imageStatus === "error" && (
                <div
                  className="relative flex aspect-[16/10] w-full flex-col items-center justify-center bg-muted/30 p-4"
                >
                  <div className="flex size-10 items-center justify-center rounded-sm border border-border/60 bg-background shadow-2xs">
                    <img
                      src={
                        bookmark.faviconUrl ||
                        `https://www.google.com/s2/favicons?sz=128&domain=${hostname}`
                      }
                      alt=""
                      onError={(e) => {
                        const fallback = `https://www.google.com/s2/favicons?sz=128&domain=${hostname}`
                        if (e.currentTarget.src !== fallback) {
                          e.currentTarget.src = fallback
                        } else {
                          e.currentTarget.style.display = "none"
                        }
                      }}
                      className="size-5 object-contain"
                    />
                  </div>
                  <span
                    className="mt-2 max-w-full truncate px-2 font-mono text-[10px] font-medium tracking-wider text-muted-foreground uppercase"
                  >
                    {hostname}
                  </span>
                </div>
              )}
            </>
          </a>
        ) : null}
      </div>

      {/* Card Content */}
      <div className="flex flex-1 flex-col justify-between gap-2.5 p-3.5">
        <div className="flex flex-col gap-1.5">
          {isVideo && (
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge
                variant="outline"
                className="rounded-sm border-purple-500/20 bg-purple-500/10 px-1.5 py-0.5 font-mono text-[9px] font-medium text-purple-600 dark:text-purple-400 uppercase"
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
                onClick={() => onEditBookmark(bookmark)}
                className="line-clamp-2 text-left text-xs leading-snug font-medium text-foreground hover:underline"
              >
                {bookmark.title || "Untitled note"}
              </button>
            ) : (
              <a
                href={bookmark.url}
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
                className="group/link line-clamp-2 text-xs leading-snug font-medium text-foreground hover:underline"
              >
                {bookmark.title || bookmark.url}
                <ArrowSquareOut className="ml-1 inline-block h-3 w-3 text-muted-foreground opacity-0 transition-opacity group-hover/link:opacity-100" />
              </a>
            ))}
          {!isNote &&
            (bookmark.status === "BROKEN" ||
              bookmark.status === "REDIRECTED") && (
              <div className="flex flex-wrap items-center gap-1.5">
                {bookmark.status === "BROKEN" && (
                  <Badge
                    variant="outline"
                    className="shrink-0 rounded-sm border-none bg-destructive/10 px-1.5 py-0.5 font-mono text-[9px] text-destructive uppercase"
                  >
                    Broken
                  </Badge>
                )}
                {bookmark.status === "REDIRECTED" && (
                  <Badge
                    variant="outline"
                    className="shrink-0 rounded-sm border-none bg-blue-500/10 px-1.5 py-0.5 font-mono text-[9px] text-blue-600 dark:text-blue-400 uppercase"
                    title="URL updated automatically to new address"
                  >
                    Redirected
                  </Badge>
                )}
              </div>
            )}
          {preferences.showDescription && bookmark.description && (
            <p className="line-clamp-2 text-[11px] leading-relaxed text-muted-foreground">
              {bookmark.description}
            </p>
          )}
          {preferences.showWebsite && (
            <p className="truncate font-mono text-[10px] text-muted-foreground/80">
              {hostname}
            </p>
          )}
        </div>

        {(preferences.showFolder || preferences.showDate) && (
          <div className="flex flex-wrap items-center gap-1 pt-0.5">
            {preferences.showFolder && (
              <Badge variant="outline" className="max-w-full gap-1 rounded-sm px-1.5 py-0.5 font-mono text-[9px] font-normal text-muted-foreground">
                <FolderSimple aria-hidden="true" />
                <span className="truncate">{folderName || "Unfiled"}</span>
              </Badge>
            )}
            {preferences.showDate && bookmark.createdAt && (
              <Badge variant="outline" className="rounded-sm px-1.5 py-0.5 font-mono text-[9px] font-normal text-muted-foreground">
                {new Date(bookmark.createdAt).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}
              </Badge>
            )}
          </div>
        )}
        {bookmark.tags && bookmark.tags.length > 0 && (
          <div className="flex flex-wrap items-center gap-1 pt-0.5">
            {bookmark.tags.slice(0, 3).map((tag: any) => (
              <span
                key={tag.id}
                onClick={(e) => {
                  e.stopPropagation()
                  onSelectTag(tag.name)
                }}
                className="cursor-pointer rounded-xs bg-muted/60 px-1.5 py-0.5 font-mono text-[9px] text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                #{tag.name}
              </span>
            ))}
            {bookmark.tags.length > 3 && (
              <span className="font-mono text-[9px] text-muted-foreground/60">
                +{bookmark.tags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
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
        <Masonry columnCount={activeColumnCount} gap={16} linear virtualize={false}>
          {bookmarks.map((bookmark) => (
            <MasonryItem key={bookmark.id}>
              <SortableItem
                value={bookmark.id}
                asHandle={canSort && !bookmark.isPinned}
                disabled={!canSort || bookmark.isPinned}
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
