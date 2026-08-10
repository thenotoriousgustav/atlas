import React from 'react';
import { cn } from '@atlas/ui/lib/utils';
import { Checkbox } from '@atlas/ui/components/checkbox';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@atlas/ui/components/tooltip';
import { Button } from '@atlas/ui/components/button';
import {
  Star,
  Archive,
  PencilSimple,
  Trash,
  FolderSimple,
} from '@phosphor-icons/react';

interface RedditBookmarkCardProps {
  bookmark: any;
  onSelectTag: (tagName: string) => void;
  onToggleFavorite: (bookmark: any) => void;
  onToggleArchive: (bookmark: any) => void;
  onEditBookmark: (bookmark: any) => void;
  onDeleteBookmark: (id: string) => void;
  isSelected: boolean;
  onToggleSelect: () => void;
}

export function RedditBookmarkCard({
  bookmark,
  onSelectTag,
  onToggleFavorite,
  onToggleArchive,
  onEditBookmark,
  onDeleteBookmark,
  isSelected,
  onToggleSelect,
}: RedditBookmarkCardProps) {
  const metadata = bookmark.metadata?.reddit || {};
  const subreddit = metadata.subreddit?.name || extractSubreddit(bookmark.url);
  const selftext = bookmark.description || metadata.post?.selftext || '';
  const postTitle = metadata.post?.title || bookmark.title || 'Reddit Post';

  function extractSubreddit(url: string): string {
    try {
      const match = new URL(url).pathname.match(/\/r\/([^/]+)/i);
      const sub = match?.[1];
      return sub || 'reddit';
    } catch {
      return 'reddit';
    }
  }

  const formattedTime = new Date(bookmark.createdAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  return (
    <div
      className={cn(
        'group/card relative flex w-full flex-col overflow-hidden rounded-xl border border-brand-border/60 shadow-sm transition-all hover:border-brand-charcoal/40',
        isSelected && 'border-brand-charcoal ring-1 ring-brand-charcoal',
      )}
    >
      {/* Selection Checkbox Overlay */}
      <div
        className={cn(
          'absolute top-3 left-3 z-30 border border-brand-border bg-white p-0.5 shadow-xs transition-opacity',
          isSelected
            ? 'opacity-100'
            : 'opacity-0 group-hover/card:opacity-100 focus-within:opacity-100',
        )}
      >
        <Checkbox
          checked={isSelected}
          onCheckedChange={onToggleSelect}
          className="rounded-none border-brand-border data-[state=checked]:border-brand-charcoal data-[state=checked]:bg-brand-charcoal"
        />
      </div>

      {/* Top Preview Section (White Background) */}
      <a
        href={bookmark.url}
        target="_blank"
        rel="noreferrer"
        className="block bg-white p-5 text-brand-charcoal transition-colors hover:bg-neutral-50/50"
      >
        {/* Header: Subreddit logo & name + Reddit Icon */}
        <div className="flex items-center justify-between gap-2 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex size-6 items-center justify-center rounded-full bg-gradient-to-tr from-pink-500 via-purple-600 to-indigo-600 text-white font-bold text-[10px]">
              {subreddit.charAt(0).toUpperCase()}
            </div>
            <span className="font-semibold text-sm text-neutral-800 tracking-tight">
              {subreddit}
            </span>
          </div>

          {/* Reddit Orange Icon */}
          <div className="flex size-7 items-center justify-center rounded-full bg-[#FF4500]">
            <svg
              className="size-4 fill-white"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.196-.491.956 0 1.733.777 1.733 1.733 0 .658-.363 1.226-.897 1.52.01.144.017.29.017.435 0 3.057-3.55 5.534-7.931 5.534-4.382 0-7.932-2.477-7.932-5.534 0-.14.006-.28.016-.423C3.655 14.85 3.3 14.288 3.3 13.636c0-.956.777-1.733 1.733-1.733.468 0 .89.183 1.198.494 1.192-.857 2.846-1.418 4.668-1.489l.915-4.29 3.197.674a1.25 1.25 0 0 1 1.25-.993zm-8.878 7.37a1.25 1.25 0 1 0 0 2.5 1.25 1.25 0 0 0 0-2.5zm6.368 0a1.25 1.25 0 1 0 0 2.5 1.25 1.25 0 0 0 0-2.5zm-5.067 3.99a.53.53 0 0 0-.084.743A5.452 5.452 0 0 0 12 17.8c1.558 0 2.91-.703 3.653-1.953a.53.53 0 0 0-.898-.564c-.58.972-1.637 1.517-2.755 1.517-1.118 0-2.175-.545-2.755-1.517a.53.53 0 0 0-.743-.083z" />
            </svg>
          </div>
        </div>

        {/* Large Post Title */}
        <h3 className="text-lg font-bold leading-tight tracking-tight text-neutral-900 line-clamp-2">
          {postTitle}
        </h3>

        {/* Sub-content description with subtle bottom fade */}
        {selftext ? (
          <div className="relative mt-2 max-h-24 overflow-hidden">
            <p className="text-sm leading-relaxed text-neutral-600 font-normal whitespace-pre-line">
              {selftext}
            </p>
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-white to-transparent" />
          </div>
        ) : null}
      </a>

      {/* Bottom Footer Section (Dark Background) */}
      <div className="flex flex-col justify-between gap-3 bg-[#242424] p-4 text-white">
        <a
          href={bookmark.url}
          target="_blank"
          rel="noreferrer"
          className="block text-sm font-semibold text-white hover:underline line-clamp-1"
        >
          {postTitle} : {subreddit}
        </a>

        <div className="flex items-center justify-between border-t border-neutral-700/60 pt-2.5 text-xs text-neutral-400">
          <div className="flex items-center gap-1.5 font-mono text-[11px]">
            <FolderSimple className="size-3.5 text-neutral-400" />
            <span>{bookmark.folder?.name || 'Unsorted'}</span>
            <span>·</span>
            <span>reddit.com</span>
            <span>·</span>
            <span>{formattedTime}</span>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-1 opacity-80 group-hover/card:opacity-100">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFavorite(bookmark);
                  }}
                  variant="ghost"
                  size="icon-xs"
                  className="size-6 text-neutral-400 hover:text-white hover:bg-neutral-700"
                >
                  <Star
                    className={cn(
                      'size-3.5',
                      bookmark.isFavorite
                        ? 'text-amber-400 fill-amber-400'
                        : 'text-neutral-400',
                    )}
                  />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Favorite</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleArchive(bookmark);
                  }}
                  variant="ghost"
                  size="icon-xs"
                  className="size-6 text-neutral-400 hover:text-white hover:bg-neutral-700"
                >
                  <Archive
                    className={cn(
                      'size-3.5',
                      bookmark.isArchived
                        ? 'text-blue-400 fill-blue-400'
                        : 'text-neutral-400',
                    )}
                  />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Archive</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditBookmark(bookmark);
                  }}
                  variant="ghost"
                  size="icon-xs"
                  className="size-6 text-neutral-400 hover:text-white hover:bg-neutral-700"
                >
                  <PencilSimple className="size-3.5 text-neutral-400" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Edit</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteBookmark(bookmark.id);
                  }}
                  variant="ghost"
                  size="icon-xs"
                  className="size-6 text-neutral-400 hover:text-red-400 hover:bg-neutral-700"
                >
                  <Trash className="size-3.5 text-neutral-400" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Delete</TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>
    </div>
  );
}
