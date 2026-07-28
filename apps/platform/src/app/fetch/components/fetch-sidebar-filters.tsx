'use client';

import React from 'react';
import { Button } from '@atlas/ui/components/button';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@atlas/ui/components/select';
import {
  Bookmark,
  Plus,
  X,
  MagnifyingGlass,
  Funnel,
  Video,
  MusicNotes,
} from '@phosphor-icons/react';
import {
  WorkspaceSidebar,
  WorkspaceSidebarAction,
  WorkspaceSidebarGroup,
  WorkspaceSidebarItem,
} from '@/components/workspace-sidebar';

interface FetchSidebarFiltersProps {
  collections: any[];
  selectedCollectionId: string;
  onSelectCollection: (id: string) => void;
  onOpenCreateCollection: () => void;
  onRemoveCollection: (id: string) => void;
  selectedPlatform: string;
  onSelectPlatform: (platform: string) => void;
  selectedMediaType: string;
  onSelectMediaType: (type: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

/**
 * Standardized Sidebar Filters for Fetch module using WorkspaceSidebar compound components.
 * Matches Cabinet & Habit sidebar style.
 */
export function FetchSidebarFilters({
  collections,
  selectedCollectionId,
  onSelectCollection,
  onOpenCreateCollection,
  onRemoveCollection,
  selectedPlatform,
  onSelectPlatform,
  selectedMediaType,
  onSelectMediaType,
  searchQuery,
  onSearchChange,
}: FetchSidebarFiltersProps) {
  return (
    <WorkspaceSidebar>
      {/* Primary Action Button */}
      <WorkspaceSidebarAction>
        <Button
          onClick={onOpenCreateCollection}
          className="w-full justify-center gap-2 bg-brand-charcoal text-brand-canvas hover:bg-brand-charcoal/90 rounded-none font-mono text-xs font-semibold uppercase tracking-wider h-9"
        >
          <Plus className="size-4" /> New Collection
        </Button>
      </WorkspaceSidebarAction>

      {/* Collections Group */}
      <WorkspaceSidebarGroup title="Collections">
        <WorkspaceSidebarItem
          icon={<Bookmark className="size-3.5" />}
          label="All Downloads"
          isActive={!selectedCollectionId}
          onClick={() => onSelectCollection('')}
        />

        {collections.map((col) => (
          <WorkspaceSidebarItem
            key={col.id}
            icon={<Bookmark className="size-3.5" />}
            label={col.name}
            isActive={selectedCollectionId === col.id}
            onClick={() => onSelectCollection(col.id)}
            hoverActions={
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveCollection(col.id);
                }}
                className="text-brand-muted hover:text-red-600 transition-colors p-0.5"
                title="Delete Collection"
              >
                <X className="size-3.5" />
              </button>
            }
          />
        ))}

        <WorkspaceSidebarItem
          icon={<Bookmark className="size-3.5" />}
          label="Uncategorized"
          isActive={selectedCollectionId === 'none'}
          onClick={() => onSelectCollection('none')}
        />
      </WorkspaceSidebarGroup>

      {/* Platform & Media Type Filters Group */}
      <WorkspaceSidebarGroup title="Filters">
        <div className="space-y-3 pt-1 px-1">
          <div className="space-y-1">
            <label className="text-[10px] font-mono text-brand-muted uppercase tracking-wider flex items-center gap-1">
              <Funnel className="size-3" /> Platform
            </label>
            <Select
              value={selectedPlatform}
              onValueChange={(val) => onSelectPlatform(val || '')}
            >
              <SelectTrigger className="w-full h-8 border-brand-border bg-white text-xs text-brand-charcoal rounded-none">
                <SelectValue placeholder="All Platforms" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Platforms</SelectItem>
                <SelectItem value="YouTube">YouTube</SelectItem>
                <SelectItem value="TikTok">TikTok</SelectItem>
                <SelectItem value="Instagram">Instagram</SelectItem>
                <SelectItem value="Twitter">Twitter / X</SelectItem>
                <SelectItem value="Reddit">Reddit</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-mono text-brand-muted uppercase tracking-wider flex items-center gap-1">
              <Video className="size-3" /> Media Format
            </label>
            <Select
              value={selectedMediaType}
              onValueChange={(val) => onSelectMediaType(val || '')}
            >
              <SelectTrigger className="w-full h-8 border-brand-border bg-white text-xs text-brand-charcoal rounded-none">
                <SelectValue placeholder="All Formats" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Formats</SelectItem>
                <SelectItem value="VIDEO">Video (MP4)</SelectItem>
                <SelectItem value="AUDIO">Audio (MP3)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </WorkspaceSidebarGroup>
    </WorkspaceSidebar>
  );
}
