import React from 'react';
import { Card } from '@atlas/ui/components/card';
import { Badge } from '@atlas/ui/components/badge';
import { Button } from '@atlas/ui/components/button';
import {
  ArrowSquareOut,
  Clock,
  Star,
  Archive,
  PencilSimple,
  Trash,
} from '@phosphor-icons/react';

interface BookmarkCardProps {
  bookmark: any;
  onSelectTag: (tagName: string) => void;
  onToggleFavorite: (bookmark: any) => void;
  onToggleArchive: (bookmark: any) => void;
  onEditBookmark: (bookmark: any) => void;
  onDeleteBookmark: (id: string) => void;
}

export function BookmarkCard({
  bookmark,
  onSelectTag,
  onToggleFavorite,
  onToggleArchive,
  onEditBookmark,
  onDeleteBookmark,
}: BookmarkCardProps) {
  return (
    <Card className="border-brand-border bg-white rounded-none p-5 transition-all hover:border-[#111111]/30 flex flex-col sm:flex-row gap-4 justify-between items-start">
      <div className="space-y-2.5 flex-1 min-w-0">
        {/* URL / Title / Category */}
        <div className="space-y-1">
          <div className="flex items-start gap-2.5 flex-wrap">
            <a
              href={bookmark.url}
              target="_blank"
              rel="noreferrer"
              className="group flex items-center gap-1 text-sm font-semibold text-[#111111] hover:underline break-all"
            >
              {bookmark.title || bookmark.url}
              <ArrowSquareOut className="w-3.5 h-3.5 text-[#787774] opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
            </a>
            {bookmark.folder && (
              <Badge
                variant="outline"
                className="text-[9px] bg-brand-green-bg text-brand-green-text border-none shrink-0 font-mono py-0.5 px-1.5 uppercase"
              >
                {bookmark.folder.name}
              </Badge>
            )}
          </div>
          <p className="text-[10px] text-[#787774]/70 font-mono truncate">{bookmark.url}</p>
        </div>

        {/* Description */}
        {bookmark.description && (
          <p className="text-xs text-[#787774] leading-relaxed max-w-[65ch]">
            {bookmark.description}
          </p>
        )}

        {/* Tags */}
        {bookmark.tags && bookmark.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-1">
            {bookmark.tags.map((tag: any) => (
              <span
                key={tag.id}
                onClick={() => onSelectTag(tag.name)}
                className="px-1.5 py-0.5 bg-brand-blue-bg text-brand-blue-text rounded-none text-[9px] font-mono border-none cursor-pointer hover:opacity-80 transition-opacity"
              >
                #{tag.name}
              </span>
            ))}
          </div>
        )}

        {/* Footer Info */}
        <div className="flex items-center gap-3 pt-1 text-[9px] text-[#787774]/80 font-mono">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {new Date(bookmark.createdAt).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </span>
        </div>
      </div>

      {/* Bookmark actions */}
      <div className="flex sm:flex-col items-center gap-1.5 shrink-0 self-end sm:self-start w-full sm:w-auto justify-end">
        <Button
          onClick={() => onToggleFavorite(bookmark)}
          variant="outline"
          size="icon"
          className={bookmark.isFavorite ? 'bg-brand-yellow-bg text-brand-yellow-text border-[#956400]/20' : ''}
          title="Mark as favorite"
        >
          <Star className="w-4 h-4" weight={bookmark.isFavorite ? 'fill' : 'regular'} />
        </Button>

        <Button
          onClick={() => onToggleArchive(bookmark)}
          variant="outline"
          size="icon"
          className={bookmark.isArchived ? 'bg-brand-blue-bg text-brand-blue-text border-brand-blue-text/20' : ''}
          title="Archive bookmark"
        >
          <Archive className="w-4 h-4" weight={bookmark.isArchived ? 'fill' : 'regular'} />
        </Button>

        <Button
          onClick={() => onEditBookmark(bookmark)}
          variant="outline"
          size="icon"
          title="Edit bookmark"
        >
          <PencilSimple className="w-4 h-4 text-[#787774]" />
        </Button>

        <Button
          onClick={() => onDeleteBookmark(bookmark.id)}
          variant="outline"
          size="icon"
          className="hover:bg-brand-red-bg hover:text-brand-red-text hover:border-brand-red-text/20"
          title="Delete bookmark"
        >
          <Trash className="w-4 h-4" />
        </Button>
      </div>
    </Card>
  );
}
