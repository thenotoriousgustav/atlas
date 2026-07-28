import React from 'react';
import { cn } from '@atlas/ui/lib/utils';
import { Badge } from '@atlas/ui/components/badge';
import { Button } from '@atlas/ui/components/button';
import { Checkbox } from '@atlas/ui/components/checkbox';
import { Tooltip, TooltipTrigger, TooltipContent } from '@atlas/ui/components/tooltip';
import {
  Star,
  Archive,
  PencilSimple,
  Trash,
  Copy,
} from '@phosphor-icons/react';
import {
  Sortable,
  SortableContent,
  SortableItem,
  SortableOverlay,
} from '@atlas/ui/components/sortable';

interface BookmarkListViewProps {
  bookmarks: any[];
  selectedBookmarkIds: string[];
  onToggleSelect: (id: string) => void;
  onSelectTag: (tagName: string) => void;
  onToggleFavorite: (bookmark: any) => void;
  onToggleArchive: (bookmark: any) => void;
  onEditBookmark: (bookmark: any) => void;
  onDeleteBookmark: (id: string) => void;
  onDuplicateBookmark: (bookmark: any) => void;
  getHostname: (url: string) => string;
  onReorder?: (newOrder: any[]) => void;
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
      <SortableContent className="border border-brand-border divide-y divide-brand-border">
        {bookmarks.map((bookmark: any) => {
          const hostname = getHostname(bookmark.url);
          const isSelected = selectedBookmarkIds.includes(bookmark.id);
          return (
            <SortableItem
              key={bookmark.id}
              value={bookmark.id}
              asHandle
              className={cn(
                "flex items-center justify-between py-2.5 px-3 bg-white transition-all hover:bg-brand-charcoal/5 gap-4 text-xs group/item",
                isSelected && "bg-brand-charcoal/5"
              )}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div
                  className={cn(
                    "transition-opacity shrink-0",
                    isSelected ? "opacity-100" : "opacity-0 group-hover/item:opacity-100 focus-within:opacity-100"
                  )}
                >
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => onToggleSelect(bookmark.id)}
                    className="rounded-none border-brand-border data-[state=checked]:bg-brand-charcoal data-[state=checked]:border-brand-charcoal"
                  />
                </div>
                <span className="flex items-center gap-2 min-w-0">
                  <img
                    src={`https://www.google.com/s2/favicons?domain=${hostname}&sz=32`}
                    alt=""
                    className="size-4 shrink-0 object-contain rounded-none border border-brand-border/60 bg-white"
                    onError={(e) => {
                      (e.currentTarget as HTMLElement).style.display = 'none';
                    }}
                  />
                  <a
                    href={bookmark.url}
                    target="_blank"
                    rel="noreferrer"
                    className="font-semibold text-brand-charcoal hover:underline truncate shrink-0"
                  >
                    {bookmark.title || bookmark.url}
                  </a>
                  <span className="text-[10px] text-brand-muted/70 font-mono truncate hidden md:inline">
                    ({hostname})
                  </span>
                </span>
                {bookmark.folder && (
                  <Badge
                    variant="outline"
                    className="text-[9px] bg-brand-green-bg text-brand-green-text border-none py-0.5 px-1.5 uppercase shrink-0 font-mono"
                  >
                    {bookmark.folder.name}
                  </Badge>
                )}
                {bookmark.status === 'BROKEN' && (
                  <Badge
                    variant="outline"
                    className="text-[9px] bg-red-50 text-red-600 border-none py-0.5 px-1.5 uppercase shrink-0 font-mono"
                  >
                    Broken
                  </Badge>
                )}
                {bookmark.status === 'REDIRECTED' && (
                  <Badge
                    variant="outline"
                    className="text-[9px] bg-blue-50 text-blue-600 border-none shrink-0 font-mono py-0.5 px-1.5 uppercase shrink-0 font-mono"
                    title="URL updated automatically to new address"
                  >
                    Redirected
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-4 shrink-0">
                {/* Tags */}
                {bookmark.tags && bookmark.tags.length > 0 && (
                  <div className="hidden sm:flex items-center gap-1">
                    {bookmark.tags.slice(0, 3).map((tag: any) => (
                      <span
                        key={tag.id}
                        onClick={() => onSelectTag(tag.name)}
                        className="px-1.5 py-0.5 bg-brand-blue-bg text-brand-blue-text text-[9px] font-mono cursor-pointer hover:opacity-80 shrink-0"
                      >
                        #{tag.name}
                      </span>
                    ))}
                  </div>
                )}

                {/* Date */}
                <span className="text-[10px] text-brand-muted/80 font-mono hidden lg:inline-block">
                  {new Date(bookmark.createdAt).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
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
                          className={cn("w-3.5 h-3.5", bookmark.isFavorite ? "text-[#956400]" : "text-brand-muted")}
                          weight={bookmark.isFavorite ? 'fill' : 'regular'}
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
                          className={cn("w-3.5 h-3.5", bookmark.isArchived ? "text-brand-blue-text" : "text-brand-muted")}
                          weight={bookmark.isArchived ? 'fill' : 'regular'}
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
                        <Copy className="w-3.5 h-3.5 text-brand-muted" />
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
                        <PencilSimple className="w-3.5 h-3.5 text-brand-muted" />
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
                        className="size-7 hover:bg-brand-red-bg hover:text-brand-red-text"
                      >
                        <Trash className="w-3.5 h-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Delete</TooltipContent>
                  </Tooltip>
                </div>
              </div>
            </SortableItem>
          );
        })}
      </SortableContent>
      <SortableOverlay>
        {(activeItem) => {
          const bookmark = bookmarks.find((b: any) => b.id === activeItem.value);
          if (!bookmark) return null;
          const hostname = getHostname(bookmark.url);
          return (
            <div className="flex items-center justify-between py-2.5 px-3 bg-white border border-brand-charcoal shadow-lg text-xs gap-4 w-full">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <img
                  src={`https://www.google.com/s2/favicons?domain=${hostname}&sz=32`}
                  alt=""
                  className="size-4 shrink-0 object-contain rounded-none border border-brand-border/60 bg-white"
                />
                <span className="font-semibold text-brand-charcoal truncate">
                  {bookmark.title || bookmark.url}
                </span>
                <span className="text-[10px] text-brand-muted/70 font-mono truncate hidden md:inline">
                  ({hostname})
                </span>
              </div>
            </div>
          );
        }}
      </SortableOverlay>
    </Sortable>
  );
}
