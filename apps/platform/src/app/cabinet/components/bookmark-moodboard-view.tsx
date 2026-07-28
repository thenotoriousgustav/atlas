import React from 'react';
import { cn } from '@atlas/ui/lib/utils';
import { Badge } from '@atlas/ui/components/badge';
import { Button } from '@atlas/ui/components/button';
import { Card } from '@atlas/ui/components/card';
import { Checkbox } from '@atlas/ui/components/checkbox';
import { Tooltip, TooltipTrigger, TooltipContent } from '@atlas/ui/components/tooltip';
import {
  Star,
  Archive,
  PencilSimple,
  Trash,
  Clock,
  ArrowSquareOut,
  Copy,
} from '@phosphor-icons/react';
import {
  Sortable,
  SortableContent,
  SortableItem,
  SortableOverlay,
} from '@atlas/ui/components/sortable';

interface MoodboardCardProps {
  bookmark: any;
  onSelectTag: (tagName: string) => void;
  onToggleFavorite: (bookmark: any) => void;
  onToggleArchive: (bookmark: any) => void;
  onEditBookmark: (bookmark: any) => void;
  onDeleteBookmark: (id: string) => void;
  onDuplicateBookmark: (bookmark: any) => void;
  getHostname: (url: string) => string;
  getPastelColor: (str: string) => { bg: string; text: string };
  isSelected: boolean;
  onToggleSelect: () => void;
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
  const hostname = getHostname(bookmark.url);
  const color = getPastelColor(hostname);
  
  const screenshotUrl = React.useMemo(() => {
    if (bookmark.imageUrl) return bookmark.imageUrl;
    return `https://api.microlink.io/?url=${encodeURIComponent(bookmark.url)}&screenshot=true&embed=screenshot.url`;
  }, [bookmark.imageUrl, bookmark.url]);

  const [imageSrc, setImageSrc] = React.useState<string>(screenshotUrl);
  const [imageStatus, setImageStatus] = React.useState<'loading' | 'loaded' | 'error'>('loading');

  React.useEffect(() => {
    setImageSrc(screenshotUrl);
  }, [screenshotUrl]);

  const handleImageError = () => {
    if (bookmark.imageUrl && imageSrc === bookmark.imageUrl) {
      // Fallback from metadata image to live screenshot
      const fallbackUrl = `https://api.microlink.io/?url=${encodeURIComponent(bookmark.url)}&screenshot=true&embed=screenshot.url`;
      setImageSrc(fallbackUrl);
    } else {
      // Live screenshot also failed, show pastel color fallback
      setImageStatus('error');
    }
  };

  return (
    <Card
      className={cn(
        "border border-brand-border bg-white rounded-none flex flex-col overflow-hidden transition-all hover:border-brand-charcoal/40 h-auto w-full group/card shadow-none",
        isSelected && "border-brand-charcoal ring-1 ring-brand-charcoal"
      )}
    >
      {/* Top Visual Image Header Container */}
      <div className="relative w-full bg-brand-canvas border-b border-brand-border overflow-hidden shrink-0 aspect-[16/10]">
        {/* Checkbox Overlay */}
        <div
          className={cn(
            "absolute top-2.5 left-2.5 z-20 bg-white border border-brand-border p-px shadow-xs transition-opacity",
            isSelected ? "opacity-100" : "opacity-0 group-hover/card:opacity-100 focus-within:opacity-100"
          )}
        >
          <Checkbox
            checked={isSelected}
            onCheckedChange={onToggleSelect}
            className="rounded-none border-brand-border data-[state=checked]:bg-brand-charcoal data-[state=checked]:border-brand-charcoal"
          />
        </div>

        <a
          href={bookmark.url}
          target="_blank"
          rel="noreferrer"
          className="relative w-full h-full block group/header"
        >
          {imageStatus === 'loading' && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50/50 animate-pulse">
              <Clock className="w-5 h-5 text-gray-400 animate-spin" />
            </div>
          )}

          {imageStatus !== 'error' && imageSrc && (
            <img
              src={imageSrc}
              alt={bookmark.title || hostname}
              onLoad={() => setImageStatus('loaded')}
              onError={handleImageError}
              className={cn(
                "w-full h-full object-cover transition-opacity duration-300",
                imageStatus === 'loaded' ? "opacity-100" : "opacity-0"
              )}
            />
          )}

          {imageStatus === 'error' && (
            <div className={cn("w-full h-full flex flex-col items-center justify-center relative p-4", color.bg)}>
              <div className="size-12 bg-white rounded-xl flex items-center justify-center border border-brand-border/60 shadow-sm">
                <img
                  src={`https://www.google.com/s2/favicons?sz=128&domain=${hostname}`}
                  alt=""
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                  className="size-7 object-contain"
                />
              </div>
              <span className={cn("text-[11px] font-mono mt-2 uppercase tracking-wider truncate max-w-full px-2 font-medium", color.text)}>
                {hostname}
              </span>
            </div>
          )}

          {/* Folder Badge */}
          {bookmark.folder && (
            <Badge
              variant="outline"
              className="absolute top-3 right-3 text-[9px] bg-white/90 backdrop-blur-sm border-none shadow-sm shrink-0 font-mono py-0.5 px-2 uppercase rounded-full font-medium"
            >
              {bookmark.folder.name}
            </Badge>
          )}
        </a>
      </div>

      {/* Card Content */}
      <div className="p-4 flex flex-col justify-between gap-4">
        <div className="space-y-1.5">
          <a
            href={bookmark.url}
            target="_blank"
            rel="noreferrer"
            className="group/link block text-sm font-semibold text-brand-charcoal hover:underline leading-tight"
          >
            {bookmark.title || bookmark.url}
            <ArrowSquareOut className="inline-block ml-1 w-3 h-3 text-brand-muted opacity-0 group-hover/link:opacity-100 transition-opacity" />
          </a>
          <div className="flex flex-wrap gap-1.5 items-center">
            {bookmark.status === 'BROKEN' && (
              <Badge
                variant="outline"
                className="text-[9px] bg-red-50 text-red-600 border-none shrink-0 font-mono py-0.5 px-1.5 uppercase"
              >
                Broken
              </Badge>
            )}
            {bookmark.status === 'REDIRECTED' && (
              <Badge
                variant="outline"
                className="text-[9px] bg-blue-50 text-blue-600 border-none shrink-0 font-mono py-0.5 px-1.5 uppercase"
                title="URL updated automatically to new address"
              >
                Redirected
              </Badge>
            )}
          </div>
          {bookmark.description && (
            <p className="text-[11px] text-brand-muted leading-relaxed mt-1">
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
                  className="px-1.5 py-0.5 bg-brand-blue-bg text-brand-blue-text rounded-none text-[9px] font-mono cursor-pointer hover:opacity-80"
                >
                  #{tag.name}
                </span>
              ))}
            </div>
          )}

          {/* Actions footer */}
          <div className="flex items-center justify-between border-t border-brand-border pt-2.5">
            <span className="text-[9px] text-brand-muted/70 font-mono">
              {new Date(bookmark.createdAt).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
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
        </div>
      </div>
    </Card>
  );
}

interface BookmarkMoodboardViewProps {
  bookmarks: any[];
  activeColumnCount: number;
  selectedBookmarkIds: string[];
  onToggleSelect: (id: string) => void;
  onSelectTag: (tagName: string) => void;
  onToggleFavorite: (bookmark: any) => void;
  onToggleArchive: (bookmark: any) => void;
  onEditBookmark: (bookmark: any) => void;
  onDeleteBookmark: (id: string) => void;
  onDuplicateBookmark: (bookmark: any) => void;
  getHostname: (url: string) => string;
  getPastelColor: (str: string) => { bg: string; text: string };
  onReorder?: (newOrder: any[]) => void;
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
        <div className={`grid gap-4 ${
          activeColumnCount === 1
            ? 'grid-cols-1'
            : activeColumnCount === 2
            ? 'grid-cols-2'
            : activeColumnCount === 3
            ? 'grid-cols-3'
            : 'grid-cols-4'
        } items-start`}>
          {Array.from({ length: activeColumnCount }).map((_, colIndex) => {
            const colBookmarks = bookmarks.filter((_, idx) => idx % activeColumnCount === colIndex);
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
            );
          })}
        </div>
      </SortableContent>
      <SortableOverlay>
        {(activeItem) => {
          const bookmark = bookmarks.find((b: any) => b.id === activeItem.value);
          if (!bookmark) return null;
          return (
            <div className="w-72 shadow-2xl rounded-2xl overflow-hidden opacity-95 pointer-events-none ring-2 ring-black/10">
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
          );
        }}
      </SortableOverlay>
    </Sortable>
  );
}
