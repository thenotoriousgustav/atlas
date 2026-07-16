'use client';

import * as React from 'react';
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
  CommandShortcut,
} from '@atlas/ui/components/command';
import {
  Sparkle,
  Plus,
  Folder,
  Tag,
  Star,
  Archive,
  LinkBreak,
  Copy,
  Pulse,
  FileArrowDown,
  House,
} from '@phosphor-icons/react';

interface CommandMenuProps {
  isOpen: boolean;
  setIsOpen: (open: boolean | ((prev: boolean) => boolean)) => void;
  isSemanticSearch: boolean;
  setIsSemanticSearch: (val: boolean) => void;
  setIsBookmarkModalOpen: (open: boolean) => void;
  setSelectedFolderId: (id: string | undefined) => void;
  setFilterFavorite: (val: boolean | undefined) => void;
  setFilterArchived: (val: boolean | undefined) => void;
  setSelectedTag: (tag: string | undefined) => void;
  setFilterBroken: (val: boolean | undefined) => void;
  setFilterDuplicates: (val: boolean | undefined) => void;
  folders: any[];
  tags: any[];
  onCleanDuplicates: () => void;
  onTriggerHealthCheck: () => void;
  onExport: () => void;
}

export function CommandMenu({
  isOpen,
  setIsOpen,
  isSemanticSearch,
  setIsSemanticSearch,
  setIsBookmarkModalOpen,
  setSelectedFolderId,
  setFilterFavorite,
  setFilterArchived,
  setSelectedTag,
  setFilterBroken,
  setFilterDuplicates,
  folders,
  tags,
  onCleanDuplicates,
  onTriggerHealthCheck,
  onExport,
}: CommandMenuProps) {
  // Safe helper to run action and close dialog
  const runAction = (action: () => void) => {
    action();
    setIsOpen(false);
  };

  // ponytail: self-contained Keyboard shortcut listener for CMD+K / CTRL+K
  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsOpen((open) => !open);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [setIsOpen]);

  return (
    <CommandDialog
      open={isOpen}
      onOpenChange={setIsOpen}
      title="Cabinet Command Menu"
      description="Quick access and semantic search"
    >
      <CommandInput placeholder="Type a command or search..." />
      <CommandList className="py-2">
        <CommandEmpty>No results found.</CommandEmpty>
        
        <CommandGroup heading="AI & Search">
          <CommandItem
            onSelect={() =>
              runAction(() => setIsSemanticSearch(!isSemanticSearch))
            }
          >
            <Sparkle className="w-4 h-4 text-sky-500" />
            <span>AI Semantic Search</span>
            <CommandShortcut className="text-[10px] uppercase tracking-wider font-bold">
              {isSemanticSearch ? 'Active' : 'Inactive'}
            </CommandShortcut>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Quick Actions">
          <CommandItem
            onSelect={() => runAction(() => setIsBookmarkModalOpen(true))}
          >
            <Plus className="w-4 h-4" />
            <span>Add New Bookmark</span>
            <CommandShortcut>N</CommandShortcut>
          </CommandItem>
          <CommandItem
            onSelect={() => runAction(onTriggerHealthCheck)}
          >
            <Pulse className="w-4 h-4" />
            <span>Scan Link Health</span>
          </CommandItem>
          <CommandItem
            onSelect={() => runAction(onCleanDuplicates)}
          >
            <Copy className="w-4 h-4" />
            <span>Clean Duplicate Links</span>
          </CommandItem>
          <CommandItem
            onSelect={() => runAction(onExport)}
          >
            <FileArrowDown className="w-4 h-4" />
            <span>Export Bookmarks (HTML)</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Views & Filters">
          <CommandItem
            onSelect={() =>
              runAction(() => {
                setSelectedFolderId(undefined);
                setFilterFavorite(undefined);
                setFilterArchived(false);
                setSelectedTag(undefined);
                setFilterBroken(undefined);
                setFilterDuplicates(undefined);
              })
            }
          >
            <House className="w-4 h-4" />
            <span>All Bookmarks</span>
          </CommandItem>
          <CommandItem
            onSelect={() =>
              runAction(() => {
                setFilterFavorite(true);
                setFilterArchived(undefined);
                setSelectedFolderId(undefined);
                setSelectedTag(undefined);
                setFilterBroken(undefined);
                setFilterDuplicates(undefined);
              })
            }
          >
            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
            <span>Favorites</span>
          </CommandItem>
          <CommandItem
            onSelect={() =>
              runAction(() => {
                setFilterArchived(true);
                setFilterFavorite(undefined);
                setSelectedFolderId(undefined);
                setSelectedTag(undefined);
                setFilterBroken(undefined);
                setFilterDuplicates(undefined);
              })
            }
          >
            <Archive className="w-4 h-4" />
            <span>Archive</span>
          </CommandItem>
          <CommandItem
            onSelect={() =>
              runAction(() => {
                setFilterBroken(true);
                setFilterArchived(undefined);
                setFilterFavorite(undefined);
                setSelectedFolderId(undefined);
                setSelectedTag(undefined);
                setFilterDuplicates(undefined);
              })
            }
          >
            <LinkBreak className="w-4 h-4 text-rose-500" />
            <span>Broken Links</span>
          </CommandItem>
        </CommandGroup>

        {folders.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Folders">
              {folders.map((folder) => (
                <CommandItem
                  key={folder.id}
                  onSelect={() =>
                    runAction(() => {
                      setSelectedFolderId(folder.id);
                      setFilterFavorite(undefined);
                      setFilterArchived(undefined);
                      setSelectedTag(undefined);
                      setFilterBroken(undefined);
                      setFilterDuplicates(undefined);
                    })
                  }
                >
                  <Folder className="w-4 h-4 text-brand-muted" />
                  <span>{folder.name}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {tags.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Tags">
              {tags.map((tag) => (
                <CommandItem
                  key={tag.id}
                  onSelect={() =>
                    runAction(() => {
                      setSelectedTag(tag.name);
                      setSelectedFolderId(undefined);
                      setFilterFavorite(undefined);
                      setFilterArchived(undefined);
                      setFilterBroken(undefined);
                      setFilterDuplicates(undefined);
                    })
                  }
                >
                  <Tag className="w-4 h-4 text-brand-muted" />
                  <span>#{tag.name}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
