import React from 'react';
import { Badge } from '@atlas/ui/components/badge';
import { Skeleton } from '@atlas/ui/components/skeleton';
import { Button } from '@atlas/ui/components/button';
import { Card } from '@atlas/ui/components/card';
import { Tooltip, TooltipTrigger, TooltipContent } from '@atlas/ui/components/tooltip';
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
} from '@atlas/ui/components/empty';
import {
  BookmarkSimple,
  Star,
  Archive,
  PencilSimple,
  Trash,
  Clock,
  ArrowSquareOut,
  Copy,
} from '@phosphor-icons/react';
import { BookmarkCard } from './bookmark-card';
import { Checkbox } from '@atlas/ui/components/checkbox';

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

function MoodboardCard({
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
  
  const [imageSrc, setImageSrc] = React.useState<string | null>(bookmark.imageUrl || null);
  const [imageStatus, setImageStatus] = React.useState<'loading' | 'loaded' | 'error'>(
    bookmark.imageUrl ? 'loading' : 'loading'
  );

  React.useEffect(() => {
    if (bookmark.imageUrl) {
      setImageSrc(bookmark.imageUrl);
      setImageStatus('loading');
    } else {
      // Try live screenshot
      const screenshotUrl = `https://api.microlink.io/?url=${encodeURIComponent(bookmark.url)}&screenshot=true&embed=screenshot.url`;
      setImageSrc(screenshotUrl);
      setImageStatus('loading');
    }
  }, [bookmark.imageUrl, bookmark.url]);

  const handleImageError = () => {
    if (bookmark.imageUrl && imageSrc === bookmark.imageUrl) {
      // Fallback from metadata image to live screenshot
      const screenshotUrl = `https://api.microlink.io/?url=${encodeURIComponent(bookmark.url)}&screenshot=true&embed=screenshot.url`;
      setImageSrc(screenshotUrl);
      setImageStatus('loading');
    } else {
      // Live screenshot also failed, show pastel color fallback
      setImageStatus('error');
    }
  };

  return (
    <Card className={`border-brand-border bg-white rounded-none flex flex-col overflow-hidden hover:border-brand-charcoal/30 transition-all h-auto w-full group/card shadow-none [--card-spacing:0px] ${isSelected ? 'border-brand-charcoal' : ''}`}>
      {/* Visual Top Header - Screenshot / Fallback */}
      <div className="relative w-full bg-brand-canvas border-b border-brand-border overflow-hidden aspect-[16/10] shrink-0">
        {/* Checkbox Overlay */}
        <div className={`absolute top-2 left-2 z-10 bg-white p-1 border border-brand-border shadow-sm transition-opacity ${
          isSelected ? 'opacity-100' : 'opacity-0 group-hover/card:opacity-100 focus-within:opacity-100'
        }`}>
          <Checkbox
            checked={isSelected}
            onCheckedChange={onToggleSelect}
          />
        </div>
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
            className={`w-full h-full object-cover transition-opacity duration-300 ${
              imageStatus === 'loaded' ? 'opacity-100' : 'opacity-0'
            }`}
          />
        )}

        {imageStatus === 'error' && (
          <div className={`w-full h-full flex flex-col items-center justify-center relative p-4 ${color.bg}`}>
            <div className="size-10 bg-white flex items-center justify-center border border-brand-border shadow-sm rounded-none">
              <img
                src={`https://www.google.com/s2/favicons?sz=128&domain=${hostname}`}
                alt=""
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
                className="size-6 object-contain"
              />
            </div>
            <span className={`text-[10px] font-mono ${color.text} mt-2 uppercase tracking-wider truncate max-w-full px-2`}>
              {hostname}
            </span>
          </div>
        )}

        {/* Folder Badge */}
        {bookmark.folder && (
          <Badge
            variant="outline"
            className="absolute top-2 right-2 text-[8px] bg-white/95 border-none shadow-sm shrink-0 font-mono py-0.5 px-1.5 uppercase"
          >
            {bookmark.folder.name}
          </Badge>
        )}
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
                      className={`w-3.5 h-3.5 ${bookmark.isFavorite ? 'text-[#956400]' : 'text-brand-muted'}`}
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
                      className={`w-3.5 h-3.5 ${bookmark.isArchived ? 'text-brand-blue-text' : 'text-brand-muted'}`}
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

interface BookmarkListProps {
  bookmarks: any[];
  isBookmarksLoading: boolean;
  selectedFolderId?: string;
  selectedTag?: string;
  filterFavorite?: boolean;
  filterArchived?: boolean;
  folders: any[];
  viewMode: 'list' | 'moodboard';
  selectedBookmarkIds: string[];
  onToggleSelect: (id: string) => void;
  onSelectTag: (tagName: string) => void;
  onToggleFavorite: (bookmark: any) => void;
  onToggleArchive: (bookmark: any) => void;
  onEditBookmark: (bookmark: any) => void;
  onDeleteBookmark: (id: string) => void;
  onDuplicateBookmark: (bookmark: any) => void;
  isDuplicatesView?: boolean;
  duplicateGroups?: Array<{ url: string; bookmarks: any[] }>;
  onCleanDuplicates?: () => void;
  totalBookmarks?: number;
  columnCount?: number;
}

export function BookmarkList({
  bookmarks,
  isBookmarksLoading,
  selectedFolderId,
  selectedTag,
  filterFavorite,
  filterArchived,
  folders,
  viewMode,
  selectedBookmarkIds,
  onToggleSelect,
  onSelectTag,
  onToggleFavorite,
  onToggleArchive,
  onEditBookmark,
  onDeleteBookmark,
  onDuplicateBookmark,
  isDuplicatesView,
  duplicateGroups,
  onCleanDuplicates,
  totalBookmarks,
  columnCount = 3,
}: BookmarkListProps) {
  const [windowWidth, setWindowWidth] = React.useState<number | null>(null);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    setWindowWidth(window.innerWidth);
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const activeColumnCount = React.useMemo(() => {
    if (!windowWidth) return 3;
    if (windowWidth < 640) return 1;
    if (windowWidth < 1024) return Math.min(columnCount, 2);
    return columnCount;
  }, [columnCount, windowWidth]);

  // Determine title for the list header
  const getHeaderTitle = () => {
    if (selectedFolderId) {
      const folderName = folders.find((f: any) => f.id === selectedFolderId)?.name;
      return `Folder: ${folderName || 'Loading...'}`;
    }
    if (selectedTag) {
      return `Tag: ${selectedTag}`;
    }
    if (filterFavorite) {
      return 'Favorite Bookmarks';
    }
    if (filterArchived) {
      return 'Archived Bookmarks';
    }
    return 'All Bookmarks';
  };

  const getHostname = (url: string) => {
    try {
      return new URL(url).hostname;
    } catch {
      return url;
    }
  };

  const getPastelColor = (str: string): { bg: string; text: string } => {
    const pastels = [
      { bg: 'bg-[#FDEBEC]', text: 'text-[#9F2F2D]' }, // Pale Red
      { bg: 'bg-[#E1F3FE]', text: 'text-[#1F6C9F]' }, // Pale Blue
      { bg: 'bg-[#EDF3EC]', text: 'text-[#346538]' }, // Pale Green
      { bg: 'bg-[#FBF3DB]', text: 'text-[#956400]' }, // Pale Yellow
    ];
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % pastels.length;
    const color = pastels[index];
    if (color) return color;
    return { bg: 'bg-[#FDEBEC]', text: 'text-[#9F2F2D]' };
  };

  // Helper to fallback show initial letter in case image fails to load
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.style.display = 'none';
    const sibling = e.currentTarget.nextElementSibling;
    if (sibling) {
      sibling.classList.remove('hidden');
    }
  };

  return (
    <div className="space-y-6">
      {/* List Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-mono text-brand-muted uppercase tracking-wider flex items-center gap-2">
          <BookmarkSimple className="w-4 h-4 text-brand-charcoal" />
          {isDuplicatesView ? 'Duplicate Bookmark Groups' : getHeaderTitle()}
        </h2>
        <Badge variant="outline" className="font-mono text-[9px] px-2 py-0.5">
          {isDuplicatesView ? `${duplicateGroups?.length || 0} Groups` : `${totalBookmarks !== undefined ? totalBookmarks : bookmarks.length} Items`}
        </Badge>
      </div>

      {/* Bookmarks Loading State */}
      {isBookmarksLoading ? (
        viewMode === 'moodboard' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <Skeleton className="h-80 border border-brand-border rounded-none" />
            <Skeleton className="h-64 border border-brand-border rounded-none" />
            <Skeleton className="h-96 border border-brand-border rounded-none" />
            <Skeleton className="h-72 border border-brand-border rounded-none" />
            <Skeleton className="h-88 border border-brand-border rounded-none" />
            <Skeleton className="h-56 border border-brand-border rounded-none" />
          </div>
        ) : (
          <div className="space-y-4">
            <Skeleton className="h-24 border border-brand-border rounded-none" />
            <Skeleton className="h-24 border border-brand-border rounded-none" />
          </div>
        )
      ) : bookmarks.length === 0 ? (
        <Empty className="bg-white border border-brand-border rounded-none p-10">
          <EmptyHeader>
            <EmptyTitle>No bookmarks found</EmptyTitle>
            <EmptyDescription>No bookmarks found matching the filters.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : isDuplicatesView ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-brand-charcoal/5 border border-brand-border p-3.5">
            <span className="text-xs font-mono text-brand-charcoal">
              Found {duplicateGroups?.length || 0} duplicate URL groups.
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={onCleanDuplicates}
              className="font-mono text-[10px] uppercase h-8 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
            >
              Auto-Clean Duplicates
            </Button>
          </div>
          
          {duplicateGroups?.map((group, index) => (
            <Card key={index} className="border border-brand-border shadow-none rounded-none p-4 bg-white space-y-4">
              <div className="border-b border-brand-border pb-2 flex items-center justify-between">
                <span className="text-[10px] font-mono text-brand-muted truncate max-w-xl">
                  URL: {group.url}
                </span>
                <Badge variant="outline" className="text-[9px] font-mono shrink-0 bg-brand-charcoal/5 border-none">
                  {group.bookmarks.length} instances
                </Badge>
              </div>
              {viewMode === 'moodboard' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {group.bookmarks.map((bookmark) => (
                    <MoodboardCard
                      key={bookmark.id}
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
                  ))}
                </div>
              ) : (
                <div className="border border-brand-border divide-y divide-brand-border">
                  {group.bookmarks.map((bookmark) => {
                    const hostname = getHostname(bookmark.url);
                    const isSelected = selectedBookmarkIds.includes(bookmark.id);
                    return (
                      <div
                        key={bookmark.id}
                        className={`flex items-center justify-between py-2.5 px-3 bg-white transition-all hover:bg-brand-charcoal/5 gap-4 text-xs group/item ${
                          isSelected ? 'bg-brand-charcoal/5' : ''
                        }`}
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className={`transition-opacity shrink-0 ${
                            isSelected ? 'opacity-100' : 'opacity-0 group-hover/item:opacity-100 focus-within:opacity-100'
                          }`}>
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => onToggleSelect(bookmark.id)}
                            />
                          </div>
                          <span className="flex items-center gap-1.5 min-w-0">
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
                              className="text-[9px] bg-blue-50 text-blue-600 border-none py-0.5 px-1.5 uppercase shrink-0 font-mono"
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
                                    className={`w-3.5 h-3.5 ${
                                      bookmark.isFavorite ? 'text-[#956400] fill-[#956400]' : 'text-brand-muted'
                                    }`}
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
                                    className={`w-3.5 h-3.5 ${
                                      bookmark.isArchived ? 'text-brand-charcoal' : 'text-brand-muted'
                                    }`}
                                  />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Archive</TooltipContent>
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
                    );
                  })}
                </div>
              )}
            </Card>
          ))}
        </div>
      ) : (
        /* Render according to Selected View Mode */
        <div>
          {viewMode === 'list' && (
            <div className="border border-brand-border divide-y divide-brand-border">
              {bookmarks.map((bookmark: any) => {
                const hostname = getHostname(bookmark.url);
                const isSelected = selectedBookmarkIds.includes(bookmark.id);
                return (
                  <div
                    key={bookmark.id}
                    className={`flex items-center justify-between py-2.5 px-3 bg-white transition-all hover:bg-brand-charcoal/5 gap-4 text-xs group/item ${
                      isSelected ? 'bg-brand-charcoal/5' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className={`transition-opacity shrink-0 ${
                        isSelected ? 'opacity-100' : 'opacity-0 group-hover/item:opacity-100 focus-within:opacity-100'
                      }`}>
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => onToggleSelect(bookmark.id)}
                        />
                      </div>
                      <span className="flex items-center gap-1.5 min-w-0">
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
                                className={`w-3.5 h-3.5 ${bookmark.isFavorite ? 'text-[#956400]' : 'text-brand-muted'}`}
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
                                className={`w-3.5 h-3.5 ${bookmark.isArchived ? 'text-brand-blue-text' : 'text-brand-muted'}`}
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
                );
              })}
            </div>
          )}

          {viewMode === 'moodboard' && (
            <div>
              {!mounted ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {bookmarks.map((bookmark: any) => (
                    <MoodboardCard
                      key={bookmark.id}
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
                  ))}
                </div>
              ) : (
                <div className={`grid gap-5 ${
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
                      <div key={colIndex} className="flex flex-col gap-5">
                        {colBookmarks.map((bookmark: any) => (
                          <MoodboardCard
                            key={bookmark.id}
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
                        ))}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

        </div>
      )}
    </div>
  );
}
