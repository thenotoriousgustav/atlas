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
import { Masonry, MasonryItem } from '@atlas/ui/components/masonry';

interface BookmarkListProps {
  bookmarks: any[];
  isBookmarksLoading: boolean;
  selectedFolderId?: string;
  selectedTag?: string;
  filterFavorite?: boolean;
  filterArchived?: boolean;
  folders: any[];
  viewMode: 'card' | 'list' | 'moodboard' | 'masonry';
  onSelectTag: (tagName: string) => void;
  onToggleFavorite: (bookmark: any) => void;
  onToggleArchive: (bookmark: any) => void;
  onEditBookmark: (bookmark: any) => void;
  onDeleteBookmark: (id: string) => void;
  onDuplicateBookmark: (bookmark: any) => void;
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
  onSelectTag,
  onToggleFavorite,
  onToggleArchive,
  onEditBookmark,
  onDeleteBookmark,
  onDuplicateBookmark,
}: BookmarkListProps) {
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
        <h2 className="text-xs font-mono text-[#787774] uppercase tracking-wider flex items-center gap-2">
          <BookmarkSimple className="w-4 h-4 text-[#111111]" />
          {getHeaderTitle()}
        </h2>
        <Badge variant="outline" className="font-mono text-[9px] px-2 py-0.5">
          {bookmarks.length} Items
        </Badge>
      </div>

      {/* Bookmarks Loading State */}
      {isBookmarksLoading ? (
        <div className={viewMode === 'moodboard' || viewMode === 'masonry' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5' : 'space-y-4'}>
          <Skeleton className={viewMode === 'moodboard' || viewMode === 'masonry' ? 'h-72 border border-brand-border' : 'h-24 border border-brand-border'} />
          <Skeleton className={viewMode === 'moodboard' || viewMode === 'masonry' ? 'h-72 border border-brand-border' : 'h-24 border border-brand-border'} />
          {(viewMode === 'moodboard' || viewMode === 'masonry') && <Skeleton className="h-72 border border-brand-border" />}
        </div>
      ) : bookmarks.length === 0 ? (
        <Empty className="bg-white border border-brand-border rounded-none p-10">
          <EmptyHeader>
            <EmptyTitle>No bookmarks found</EmptyTitle>
            <EmptyDescription>No bookmarks found matching the filters.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        /* Render according to Selected View Mode */
        <div>
          {viewMode === 'card' && (
            <div className="space-y-4">
              {bookmarks.map((bookmark: any) => (
                <BookmarkCard
                  key={bookmark.id}
                  bookmark={bookmark}
                  onSelectTag={onSelectTag}
                  onToggleFavorite={onToggleFavorite}
                  onToggleArchive={onToggleArchive}
                  onEditBookmark={onEditBookmark}
                  onDeleteBookmark={onDeleteBookmark}
                  onDuplicateBookmark={onDuplicateBookmark}
                />
              ))}
            </div>
          )}

          {viewMode === 'list' && (
            <div className="border border-brand-border divide-y divide-brand-border">
              {bookmarks.map((bookmark: any) => {
                const hostname = getHostname(bookmark.url);
                return (
                  <div
                    key={bookmark.id}
                    className="flex items-center justify-between py-2.5 px-3 bg-white transition-all hover:bg-[#111111]/5 gap-4 text-xs"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className="flex items-center gap-1.5 min-w-0">
                        <a
                          href={bookmark.url}
                          target="_blank"
                          rel="noreferrer"
                          className="font-semibold text-[#111111] hover:underline truncate shrink-0"
                        >
                          {bookmark.title || bookmark.url}
                        </a>
                        <span className="text-[10px] text-[#787774]/70 font-mono truncate hidden md:inline">
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
                      <span className="text-[10px] text-[#787774]/80 font-mono hidden lg:inline-block">
                        {new Date(bookmark.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>

                      {/* Actions */}
                      <div className="flex items-center gap-0.5">
                        <Tooltip>
                          <TooltipTrigger render={
                            <Button
                              onClick={() => onToggleFavorite(bookmark)}
                              variant="ghost"
                              size="icon-xs"
                              className="size-7"
                            >
                              <Star
                                className={`w-3.5 h-3.5 ${bookmark.isFavorite ? 'text-[#956400]' : 'text-[#787774]'}`}
                                weight={bookmark.isFavorite ? 'fill' : 'regular'}
                              />
                            </Button>
                          } />
                          <TooltipContent>Favorite</TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger render={
                            <Button
                              onClick={() => onToggleArchive(bookmark)}
                              variant="ghost"
                              size="icon-xs"
                              className="size-7"
                            >
                              <Archive
                                className={`w-3.5 h-3.5 ${bookmark.isArchived ? 'text-brand-blue-text' : 'text-[#787774]'}`}
                                weight={bookmark.isArchived ? 'fill' : 'regular'}
                              />
                            </Button>
                          } />
                          <TooltipContent>Archive</TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger render={
                            <Button
                              onClick={() => onDuplicateBookmark(bookmark)}
                              variant="ghost"
                              size="icon-xs"
                              className="size-7"
                            >
                              <Copy className="w-3.5 h-3.5 text-[#787774]" />
                            </Button>
                          } />
                          <TooltipContent>Duplicate</TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger render={
                            <Button
                              onClick={() => onEditBookmark(bookmark)}
                              variant="ghost"
                              size="icon-xs"
                              className="size-7"
                            >
                              <PencilSimple className="w-3.5 h-3.5 text-[#787774]" />
                            </Button>
                          } />
                          <TooltipContent>Edit</TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger render={
                            <Button
                              onClick={() => onDeleteBookmark(bookmark.id)}
                              variant="ghost"
                              size="icon-xs"
                              className="size-7 hover:bg-brand-red-bg hover:text-brand-red-text"
                            >
                              <Trash className="w-3.5 h-3.5" />
                            </Button>
                          } />
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {bookmarks.map((bookmark: any) => {
                const hostname = getHostname(bookmark.url);
                const color = getPastelColor(hostname);
                return (
                  <Card
                    key={bookmark.id}
                    className="border-brand-border bg-white rounded-none flex flex-col overflow-hidden hover:border-[#111111]/30 transition-all h-full"
                  >
                    {/* Visual Top Header */}
                    <div
                      className={`h-32 flex flex-col items-center justify-center relative p-4 ${color.bg} border-b border-brand-border shrink-0`}
                    >
                      <div className="size-12 bg-white flex items-center justify-center border border-brand-border shadow-sm rounded-none">
                        <img
                          src={`https://www.google.com/s2/favicons?sz=128&domain=${hostname}`}
                          alt=""
                          onError={handleImageError}
                          className="size-8 object-contain"
                        />
                        <span className="text-xl font-serif font-bold text-[#111111] hidden">
                          {bookmark.title?.[0] || 'C'}
                        </span>
                      </div>
                      <span
                        className={`text-[10px] font-mono ${color.text} mt-2.5 uppercase tracking-wider truncate max-w-full px-2`}
                      >
                        {hostname}
                      </span>
                      {bookmark.folder && (
                        <Badge
                          variant="outline"
                          className="absolute top-2 right-2 text-[8px] bg-white/90 border-none shrink-0 font-mono py-0.5 px-1.5 uppercase"
                        >
                          {bookmark.folder.name}
                        </Badge>
                      )}
                    </div>

                    {/* Card Content */}
                    <div className="p-4 flex-1 flex flex-col justify-between gap-4">
                      <div className="space-y-1">
                        <a
                          href={bookmark.url}
                          target="_blank"
                          rel="noreferrer"
                          className="group block text-sm font-semibold text-[#111111] hover:underline line-clamp-2 leading-tight"
                        >
                          {bookmark.title || bookmark.url}
                          <ArrowSquareOut className="inline-block ml-1 w-3 h-3 text-[#787774] opacity-0 group-hover:opacity-100 transition-opacity" />
                        </a>
                        {bookmark.description && (
                          <p className="text-[11px] text-[#787774] line-clamp-3 leading-normal mt-1">
                            {bookmark.description}
                          </p>
                        )}
                      </div>

                      <div className="space-y-3 mt-auto">
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
                          <span className="text-[9px] text-[#787774]/70 font-mono">
                            {new Date(bookmark.createdAt).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </span>
                          <div className="flex items-center gap-0.5">
                            <Tooltip>
                              <TooltipTrigger render={
                                <Button
                                  onClick={() => onToggleFavorite(bookmark)}
                                  variant="ghost"
                                  size="icon-xs"
                                  className="size-7"
                                  title="Favorite"
                                >
                                  <Star
                                    className={`w-3.5 h-3.5 ${bookmark.isFavorite ? 'text-[#956400]' : 'text-[#787774]'}`}
                                    weight={bookmark.isFavorite ? 'fill' : 'regular'}
                                  />
                                </Button>
                              } />
                              <TooltipContent>Favorite</TooltipContent>
                            </Tooltip>

                            <Tooltip>
                              <TooltipTrigger render={
                                <Button
                                  onClick={() => onToggleArchive(bookmark)}
                                  variant="ghost"
                                  size="icon-xs"
                                  className="size-7"
                                  title="Archive"
                                >
                                  <Archive
                                    className={`w-3.5 h-3.5 ${bookmark.isArchived ? 'text-brand-blue-text' : 'text-[#787774]'}`}
                                    weight={bookmark.isArchived ? 'fill' : 'regular'}
                                  />
                                </Button>
                              } />
                              <TooltipContent>Archive</TooltipContent>
                            </Tooltip>

                            <Tooltip>
                              <TooltipTrigger render={
                                <Button
                                  onClick={() => onDuplicateBookmark(bookmark)}
                                  variant="ghost"
                                  size="icon-xs"
                                  className="size-7"
                                  title="Duplicate"
                                >
                                  <Copy className="w-3.5 h-3.5 text-[#787774]" />
                                </Button>
                              } />
                              <TooltipContent>Duplicate</TooltipContent>
                            </Tooltip>

                            <Tooltip>
                              <TooltipTrigger render={
                                <Button
                                  onClick={() => onEditBookmark(bookmark)}
                                  variant="ghost"
                                  size="icon-xs"
                                  className="size-7"
                                  title="Edit"
                                >
                                  <PencilSimple className="w-3.5 h-3.5 text-[#787774]" />
                                </Button>
                              } />
                              <TooltipContent>Edit</TooltipContent>
                            </Tooltip>

                            <Tooltip>
                              <TooltipTrigger render={
                                <Button
                                  onClick={() => onDeleteBookmark(bookmark.id)}
                                  variant="ghost"
                                  size="icon-xs"
                                  className="size-7 hover:bg-brand-red-bg hover:text-brand-red-text"
                                  title="Delete"
                                >
                                  <Trash className="w-3.5 h-3.5" />
                                </Button>
                              } />
                              <TooltipContent>Delete</TooltipContent>
                            </Tooltip>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}

          {viewMode === 'masonry' && (
            <Masonry columnWidth={320} gap={16}>
              {bookmarks.map((bookmark: any) => {
                const hostname = getHostname(bookmark.url);
                const color = getPastelColor(hostname);
                return (
                  <MasonryItem key={bookmark.id}>
                    <Card className="border-brand-border bg-white rounded-none flex flex-col overflow-hidden hover:border-[#111111]/30 transition-all">
                      {/* Visual Top Header */}
                      <div className={`h-28 flex flex-col items-center justify-center relative p-4 ${color.bg} border-b border-brand-border shrink-0`}>
                        <div className="size-10 bg-white flex items-center justify-center border border-brand-border shadow-sm rounded-none">
                          <img
                            src={`https://www.google.com/s2/favicons?sz=128&domain=${hostname}`}
                            alt=""
                            onError={handleImageError}
                            className="size-6 object-contain"
                          />
                        </div>
                        <span className={`text-[10px] font-mono ${color.text} mt-2 uppercase tracking-wider truncate max-w-full px-2`}>
                          {hostname}
                        </span>
                        {bookmark.folder && (
                          <Badge variant="outline" className="absolute top-2 right-2 text-[8px] bg-white/90 border-none shrink-0 font-mono py-0.5 px-1.5 uppercase">
                            {bookmark.folder.name}
                          </Badge>
                        )}
                      </div>

                      {/* Card Content */}
                      <div className="p-4 flex flex-col justify-between gap-4 flex-1">
                        <div className="space-y-1">
                          <a
                            href={bookmark.url}
                            target="_blank"
                            rel="noreferrer"
                            className="group block text-sm font-semibold text-[#111111] hover:underline leading-tight"
                          >
                            {bookmark.title || bookmark.url}
                            <ArrowSquareOut className="inline-block ml-1 w-3 h-3 text-[#787774] opacity-0 group-hover:opacity-100 transition-opacity" />
                          </a>
                          {bookmark.description && (
                            <p className="text-[11px] text-[#787774] leading-normal mt-1">
                              {bookmark.description}
                            </p>
                          )}
                        </div>

                        <div className="space-y-3">
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

                          {/* Actions Footer */}
                          <div className="flex items-center justify-between border-t border-brand-border pt-2.5">
                            <span className="text-[9px] text-[#787774]/70 font-mono">
                              {new Date(bookmark.createdAt).toLocaleDateString(undefined, {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </span>
                            <div className="flex items-center gap-0.5">
                              <Tooltip>
                                <TooltipTrigger render={
                                  <Button onClick={() => onToggleFavorite(bookmark)} variant="ghost" size="icon-xs" className="size-7">
                                    <Star className={`w-3.5 h-3.5 ${bookmark.isFavorite ? 'text-[#956400]' : 'text-[#787774]'}`} weight={bookmark.isFavorite ? 'fill' : 'regular'} />
                                  </Button>
                                } />
                                <TooltipContent>Favorite</TooltipContent>
                              </Tooltip>

                              <Tooltip>
                                <TooltipTrigger render={
                                  <Button onClick={() => onToggleArchive(bookmark)} variant="ghost" size="icon-xs" className="size-7">
                                    <Archive className={`w-3.5 h-3.5 ${bookmark.isArchived ? 'text-brand-blue-text' : 'text-[#787774]'}`} weight={bookmark.isArchived ? 'fill' : 'regular'} />
                                  </Button>
                                } />
                                <TooltipContent>Archive</TooltipContent>
                              </Tooltip>

                              <Tooltip>
                                <TooltipTrigger render={
                                  <Button onClick={() => onDuplicateBookmark(bookmark)} variant="ghost" size="icon-xs" className="size-7">
                                    <Copy className="w-3.5 h-3.5 text-[#787774]" />
                                  </Button>
                                } />
                                <TooltipContent>Duplicate</TooltipContent>
                              </Tooltip>

                              <Tooltip>
                                <TooltipTrigger render={
                                  <Button onClick={() => onEditBookmark(bookmark)} variant="ghost" size="icon-xs" className="size-7">
                                    <PencilSimple className="w-3.5 h-3.5 text-[#787774]" />
                                  </Button>
                                } />
                                <TooltipContent>Edit</TooltipContent>
                              </Tooltip>

                              <Tooltip>
                                <TooltipTrigger render={
                                  <Button onClick={() => onDeleteBookmark(bookmark.id)} variant="ghost" size="icon-xs" className="size-7 hover:bg-brand-red-bg hover:text-brand-red-text">
                                    <Trash className="w-3.5 h-3.5" />
                                  </Button>
                                } />
                                <TooltipContent>Delete</TooltipContent>
                              </Tooltip>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </MasonryItem>
                );
              })}
            </Masonry>
          )}
        </div>
      )}
    </div>
  );
}
