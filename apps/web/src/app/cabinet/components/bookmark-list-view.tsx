import React from "react"
import { cn } from "@/lib/utils"
import { startBookmarkDrag } from "@/lib/bookmark-drag"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Star, PushPin, Archive, PencilSimple, Trash, Copy, DotsThreeVertical, LinkSimple, ArrowCounterClockwise, FileText, DownloadSimple, FolderSimple } from "@phosphor-icons/react"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { toast } from "@/components/ui/sonner"
import { defaultDisplayPreferences, type DisplayPreferences } from "./display-preferences"
import { Sortable, SortableContent, SortableItem } from "@/components/ui/sortable"

interface BookmarkListViewProps {
  displayPreferences?: DisplayPreferences
  bookmarks: any[]
  selectedBookmarkIds: string[]
  onToggleSelect: (id: string) => void
  onSelectTag: (tagName: string) => void
  onTogglePin?: (bookmark: any) => void
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
  displayPreferences, bookmarks, selectedBookmarkIds, onToggleSelect, onSelectTag,
  onToggleFavorite, onTogglePin, onToggleArchive, onEditBookmark, onDeleteBookmark,
  onDuplicateBookmark, getHostname, onReorder, isTrashView, onRestoreBookmark,
  onPermanentDeleteBookmark, onOpenActionSheet, onOpenDownload, onInspectBookmark,
}: BookmarkListViewProps) {
  const preferences = displayPreferences ?? defaultDisplayPreferences
  const handleCopyUrl = (url: string, event: React.MouseEvent) => {
    event.stopPropagation()
    navigator.clipboard?.writeText(url)
    toast.success("URL copied to clipboard")
  }

  return (
    <Sortable value={bookmarks} onValueChange={(items) => onReorder?.(items)} getItemValue={(item) => item.id} orientation="vertical">
      <SortableContent className="divide-y divide-border/60 overflow-hidden rounded-lg border border-border bg-card">
        {bookmarks.map((bookmark: any) => {
          const hostname = getHostname(bookmark.url)
          const isSelected = selectedBookmarkIds.includes(bookmark.id)
          const isNote = bookmark.type === "NOTE" || !bookmark.url
          const isVideo = bookmark.contentType === "VIDEO" || /(?:youtube\.com|youtu\.be|tiktok\.com|instagram\.com|vimeo\.com|twitter\.com|x\.com)/.test(bookmark.url || "")
          const date = bookmark.createdAt ? new Date(bookmark.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : ""
          return (
            <SortableItem key={bookmark.id} value={bookmark.id}
              asHandle={!isTrashView && !!onReorder && !bookmark.isPinned && bookmark.canEdit !== false}
              disabled={isTrashView || !onReorder || bookmark.isPinned || bookmark.canEdit === false}
              data-readonly={bookmark.canEdit === false} aria-label={`Reorder ${bookmark.title || "bookmark"}`}
              className={cn(
                "group/item flex items-center justify-between gap-3 bg-card px-4 transition-colors hover:bg-muted/30 [&[data-readonly=true]_[data-bookmark-actions]]:hidden",
                preferences.density === "compact" ? "min-h-14 py-2 text-sm" : "min-h-20 py-4 text-base",
                isSelected && "bg-library-highlight",
              )}
              draggable={bookmark.canEdit !== false}
              onDragStart={(event) => {
                const ids = isSelected && selectedBookmarkIds.length > 0 ? selectedBookmarkIds : [bookmark.id]
                startBookmarkDrag(event, ids, bookmark.title || hostname || "Bookmark")
              }}
              onClick={(event) => {
                if (selectedBookmarkIds.length > 0 || event.shiftKey || event.metaKey || event.ctrlKey) { event.preventDefault(); onToggleSelect(bookmark.id) }
                else onInspectBookmark?.(bookmark)
              }}
            >
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <div data-bookmark-actions onClick={(event) => event.stopPropagation()} className={cn("shrink-0 transition-opacity", isSelected ? "opacity-100" : "opacity-80 focus-within:opacity-100 sm:opacity-0 sm:group-hover/item:opacity-100")}>
                  <Checkbox checked={isSelected} onCheckedChange={() => onToggleSelect(bookmark.id)} aria-label={`Select ${bookmark.title || "bookmark"}`} />
                </div>
                {!isTrashView && onTogglePin && bookmark.canEdit !== false && <Button variant="ghost" size="icon-xs" onClick={(event) => { event.stopPropagation(); onTogglePin(bookmark) }} title={bookmark.isPinned ? "Unpin bookmark" : "Pin to top"} aria-label={bookmark.isPinned ? "Unpin bookmark" : "Pin to top"} aria-pressed={!!bookmark.isPinned}><PushPin weight={bookmark.isPinned ? "fill" : "regular"} /></Button>}
                {preferences.showImage && <span className="hidden size-6 shrink-0 items-center justify-center text-muted-foreground sm:flex">
                  {isNote ? <FileText /> : <img src={bookmark.faviconUrl || `https://www.google.com/s2/favicons?domain=${hostname}&sz=32`} alt="" className="size-5 object-contain" onError={(event) => { event.currentTarget.style.visibility = "hidden" }} />}
                </span>}
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  {preferences.showTitle && (isNote ? <button type="button" onClick={(event) => { event.stopPropagation(); if (selectedBookmarkIds.length > 0 || event.shiftKey || event.metaKey || event.ctrlKey) onToggleSelect(bookmark.id); else onEditBookmark(bookmark) }} className="truncate text-left font-medium text-foreground hover:underline">{bookmark.title || "Untitled Note"}</button> : <a href={bookmark.url} target="_blank" rel="noopener noreferrer" onClick={(event) => event.stopPropagation()} className="truncate font-medium text-foreground underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-ring">{bookmark.title || bookmark.url}</a>)}
                  {preferences.showDescription && bookmark.description && <p className={cn("line-clamp-1 text-muted-foreground", preferences.density === "compact" ? "text-xs" : "text-sm")}>{bookmark.description}</p>}
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    {preferences.showWebsite && hostname && <span className="max-w-full truncate">{hostname}</span>}
                    {preferences.showFolder && bookmark.folder && <span className="flex min-w-0 items-center gap-1"><FolderSimple className="size-3" /><span className="truncate">{bookmark.folder.name}</span></span>}
                    {preferences.showDate && date && <time dateTime={bookmark.createdAt} title="Date added" className="tabular-nums md:hidden">{date}</time>}
                    {(isNote || isVideo) && <Badge variant="secondary">{isNote ? "Note" : "Video"}</Badge>}
                    {bookmark.tags?.slice(0, 2).map((tag: any) => <button type="button" key={tag.id || tag.name} onClick={(event) => { event.stopPropagation(); onSelectTag(tag.name) }} className="hover:text-library-olive focus-visible:outline-2 focus-visible:outline-ring">#{tag.name}</button>)}
                  </div>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                {preferences.showDate && date && <time dateTime={bookmark.createdAt} title="Date added" className="hidden text-xs tabular-nums text-muted-foreground md:inline-block">{date}</time>}
                <div data-bookmark-actions onClick={(event) => event.stopPropagation()} className="flex items-center gap-0.5 opacity-100 transition-opacity sm:opacity-0 sm:group-hover/item:opacity-100 sm:focus-within:opacity-100">
                  {isTrashView ? <>
                    <Button onClick={() => onRestoreBookmark?.(bookmark.id)} variant="ghost" size="icon" title="Restore bookmark"><ArrowCounterClockwise /></Button>
                    <Button onClick={() => onPermanentDeleteBookmark?.(bookmark.id)} variant="ghost" size="icon" title="Delete permanently"><Trash /></Button>
                  </> : <>
                    <Button onClick={() => onToggleFavorite(bookmark)} variant="ghost" size="icon" className="hidden sm:inline-flex" title={bookmark.isFavorite ? "Unfavorite" : "Favorite"}><Star className={cn(bookmark.isFavorite && "text-library-olive")} weight={bookmark.isFavorite ? "fill" : "regular"} /></Button>
                    <Button type="button" onClick={() => onOpenActionSheet?.(bookmark)} variant="ghost" size="icon" className="size-11 md:hidden" title="More actions"><DotsThreeVertical /></Button>
                    <div className="hidden md:inline-flex">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" title="More actions"><DotsThreeVertical /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48"><DropdownMenuGroup>
                          {isVideo && onOpenDownload && <DropdownMenuItem onClick={() => onOpenDownload(bookmark)}><DownloadSimple />Download Media</DropdownMenuItem>}
                          <DropdownMenuItem onClick={() => onEditBookmark(bookmark)}><PencilSimple />Edit Details</DropdownMenuItem>
                          <DropdownMenuItem onClick={(event) => handleCopyUrl(bookmark.url, event)}><LinkSimple />Copy Link</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onDuplicateBookmark(bookmark)}><Copy />Duplicate</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onToggleArchive(bookmark)}><Archive />{bookmark.isArchived ? "Unarchive" : "Archive"}</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem variant="destructive" onClick={() => onDeleteBookmark(bookmark.id)}><Trash />Delete</DropdownMenuItem>
                        </DropdownMenuGroup></DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </>}
                </div>
              </div>
            </SortableItem>
          )
        })}
      </SortableContent>
    </Sortable>
  )
}
