import React from 'react';
import { Badge } from '@atlas/ui/components/badge';
import { Skeleton } from '@atlas/ui/components/skeleton';
import { Button } from '@atlas/ui/components/button';
import { Card } from '@atlas/ui/components/card';
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
} from '@atlas/ui/components/empty';
import { BookmarkSimple } from '@phosphor-icons/react';
import { BookmarkListView } from './bookmark-list-view';
import { BookmarkMoodboardView, MoodboardCard } from './bookmark-moodboard-view';

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
  onReorder?: (newOrder: any[]) => void;
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
  onReorder,
}: BookmarkListProps) {
  const [windowWidth, setWindowWidth] = React.useState<number | null>(null);

  React.useEffect(() => {
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
      { bg: 'bg-[#FDEBEC]', text: 'text-[#9F2F2D]' },
      { bg: 'bg-[#E1F3FE]', text: 'text-[#1F6C9F]' },
      { bg: 'bg-[#EDF3EC]', text: 'text-[#346538]' },
      { bg: 'bg-[#FBF3DB]', text: 'text-[#956400]' },
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

      {isBookmarksLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-24 border border-brand-border rounded-none" />
          <Skeleton className="h-24 border border-brand-border rounded-none" />
        </div>
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
                <BookmarkListView
                  bookmarks={group.bookmarks}
                  selectedBookmarkIds={selectedBookmarkIds}
                  onToggleSelect={onToggleSelect}
                  onSelectTag={onSelectTag}
                  onToggleFavorite={onToggleFavorite}
                  onToggleArchive={onToggleArchive}
                  onEditBookmark={onEditBookmark}
                  onDeleteBookmark={onDeleteBookmark}
                  onDuplicateBookmark={onDuplicateBookmark}
                  getHostname={getHostname}
                />
              )}
            </Card>
          ))}
        </div>
      ) : (
        <div>
          {viewMode === 'list' ? (
            <BookmarkListView
              bookmarks={bookmarks}
              selectedBookmarkIds={selectedBookmarkIds}
              onToggleSelect={onToggleSelect}
              onSelectTag={onSelectTag}
              onToggleFavorite={onToggleFavorite}
              onToggleArchive={onToggleArchive}
              onEditBookmark={onEditBookmark}
              onDeleteBookmark={onDeleteBookmark}
              onDuplicateBookmark={onDuplicateBookmark}
              getHostname={getHostname}
              onReorder={onReorder}
            />
          ) : (
            <BookmarkMoodboardView
              bookmarks={bookmarks}
              activeColumnCount={activeColumnCount}
              selectedBookmarkIds={selectedBookmarkIds}
              onToggleSelect={onToggleSelect}
              onSelectTag={onSelectTag}
              onToggleFavorite={onToggleFavorite}
              onToggleArchive={onToggleArchive}
              onEditBookmark={onEditBookmark}
              onDeleteBookmark={onDeleteBookmark}
              onDuplicateBookmark={onDuplicateBookmark}
              getHostname={getHostname}
              getPastelColor={getPastelColor}
              onReorder={onReorder}
            />
          )}
        </div>
      )}
    </div>
  );
}
