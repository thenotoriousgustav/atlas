import React from 'react';
import { Badge } from '@atlas/ui/components/badge';
import { Skeleton } from '@atlas/ui/components/skeleton';
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
} from '@atlas/ui/components/empty';
import { BookmarkSimple } from '@phosphor-icons/react';
import { BookmarkCard } from './bookmark-card';

interface BookmarkListProps {
  bookmarks: any[];
  isBookmarksLoading: boolean;
  selectedFolderId?: string;
  selectedTag?: string;
  filterFavorite?: boolean;
  filterArchived?: boolean;
  folders: any[];
  onSelectTag: (tagName: string) => void;
  onToggleFavorite: (bookmark: any) => void;
  onToggleArchive: (bookmark: any) => void;
  onEditBookmark: (bookmark: any) => void;
  onDeleteBookmark: (id: string) => void;
}

export function BookmarkList({
  bookmarks,
  isBookmarksLoading,
  selectedFolderId,
  selectedTag,
  filterFavorite,
  filterArchived,
  folders,
  onSelectTag,
  onToggleFavorite,
  onToggleArchive,
  onEditBookmark,
  onDeleteBookmark,
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

      {/* Bookmarks Grid / List */}
      {isBookmarksLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-24 border border-brand-border" />
          <Skeleton className="h-24 border border-brand-border" />
        </div>
      ) : bookmarks.length === 0 ? (
        <Empty className="bg-white border border-brand-border rounded-none p-10">
          <EmptyHeader>
            <EmptyTitle>No bookmarks found</EmptyTitle>
            <EmptyDescription>No bookmarks found matching the filters.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
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
            />
          ))}
        </div>
      )}
    </div>
  );
}
