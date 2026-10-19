"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  MagnifyingGlass,
  FolderSimple,
  Tag,
  Plus,
  Star,
  Archive,
  Trash,
  VideoCamera,
  FileText,
  ArrowsClockwise,
  SignOut,
} from "@phosphor-icons/react"
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from "@/components/ui/command"

interface CommandMenuProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  folders: any[]
  tags: any[]
  bookmarks: any[]
  onSelectFolder: (id: string | undefined) => void
  onSelectTag: (name: string | undefined) => void
  onFilterFavorite: () => void
  onFilterArchived: () => void
  onFilterTrash: () => void
  onFilterVideo: () => void
  onFilterNotes: () => void
  onOpenAddBookmark: () => void
  onOpenAddFolder: () => void
  onScanHealth: () => void
}

export function CommandMenu({
  open,
  onOpenChange,
  folders,
  tags,
  bookmarks,
  onSelectFolder,
  onSelectTag,
  onFilterFavorite,
  onFilterArchived,
  onFilterTrash,
  onFilterVideo,
  onFilterNotes,
  onOpenAddBookmark,
  onOpenAddFolder,
  onScanHealth,
}: CommandMenuProps) {
  const router = useRouter()

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        onOpenChange(!open)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [open, onOpenChange])

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Cabinet Command Menu"
      description="Search bookmarks, jump to folders, or run quick actions"
    >
      <CommandInput placeholder="Type a command or search bookmarks..." />
      <CommandList className="max-h-[380px]">
        <CommandEmpty>No matching results.</CommandEmpty>

        {/* Quick Actions */}
        <CommandGroup heading="Actions">
          <CommandItem
            onSelect={() => {
              onOpenAddBookmark()
              onOpenChange(false)
            }}
          >
            <Plus className="mr-2 size-4" />
            <span>Add new bookmark</span>
          </CommandItem>
          <CommandItem
            onSelect={() => {
              onOpenAddFolder()
              onOpenChange(false)
            }}
          >
            <FolderSimple className="mr-2 size-4" />
            <span>Create new folder</span>
          </CommandItem>
          <CommandItem
            onSelect={() => {
              onScanHealth()
              onOpenChange(false)
            }}
          >
            <ArrowsClockwise className="mr-2 size-4" />
            <span>Check broken links & duplicates</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        {/* Views & Filters */}
        <CommandGroup heading="Views & Filters">
          <CommandItem
            onSelect={() => {
              onSelectFolder(undefined)
              onSelectTag(undefined)
              onOpenChange(false)
            }}
          >
            <FolderSimple className="mr-2 size-4" />
            <span>All Bookmarks</span>
          </CommandItem>
          <CommandItem
            onSelect={() => {
              onFilterFavorite()
              onOpenChange(false)
            }}
          >
            <Star className="mr-2 size-4 text-[#956400]" weight="fill" />
            <span>Favorites</span>
          </CommandItem>
          <CommandItem
            onSelect={() => {
              onFilterNotes()
              onOpenChange(false)
            }}
          >
            <FileText className="mr-2 size-4" />
            <span>Notes Only</span>
          </CommandItem>
          <CommandItem
            onSelect={() => {
              onFilterVideo()
              onOpenChange(false)
            }}
          >
            <VideoCamera className="mr-2 size-4 text-purple-600" />
            <span>Videos & Media</span>
          </CommandItem>
          <CommandItem
            onSelect={() => {
              onFilterArchived()
              onOpenChange(false)
            }}
          >
            <Archive className="mr-2 size-4" />
            <span>Archive</span>
          </CommandItem>
          <CommandItem
            onSelect={() => {
              onFilterTrash()
              onOpenChange(false)
            }}
          >
            <Trash className="mr-2 size-4 text-red-600" />
            <span>Trash</span>
          </CommandItem>
        </CommandGroup>

        {/* Folders */}
        {folders.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Folders">
              {folders.map((folder) => (
                <CommandItem
                  key={folder.id}
                  value={`folder ${folder.name}`}
                  onSelect={() => {
                    onSelectFolder(folder.id)
                    onOpenChange(false)
                  }}
                >
                  <FolderSimple className="mr-2 size-4 text-muted-foreground" />
                  <span>{folder.name}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {/* Tags */}
        {tags.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Tags">
              {tags.map((tag) => (
                <CommandItem
                  key={tag.id}
                  value={`tag #${tag.name}`}
                  onSelect={() => {
                    onSelectTag(tag.name)
                    onOpenChange(false)
                  }}
                >
                  <Tag className="mr-2 size-4 text-muted-foreground" />
                  <span>#{tag.name}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {/* Recent / Searchable Bookmarks */}
        {bookmarks.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Bookmarks">
              {bookmarks.slice(0, 10).map((b) => (
                <CommandItem
                  key={b.id}
                  value={`${b.title || ""} ${b.url || ""} ${b.description || ""}`}
                  onSelect={() => {
                    if (b.url) {
                      window.open(b.url, "_blank", "noopener,noreferrer")
                    }
                    onOpenChange(false)
                  }}
                >
                  <MagnifyingGlass className="mr-2 size-4 text-muted-foreground" />
                  <span className="truncate">{b.title || b.url || "Untitled"}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  )
}
