"use client"

import React from "react"
import {
  BookmarkSimple,
  Folder,
  Plus,
  FileText,
  Star,
  Faders,
  Scribble,
} from "@phosphor-icons/react"
import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuGroup,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export type MobileTab = "all" | "folders" | "add" | "favorites" | "library"

interface MobileBottomNavProps {
  activeTab: MobileTab
  onSelectTab: (tab: MobileTab) => void
  onOpenAdd: () => void
  onCreateNote: () => void
  onCreateDrawing?: () => void
  onOpenCollections: () => void
  onOpenLibrary: () => void
  /** @deprecated No longer shown; kept so existing callers compile. */
  trashCount?: number
}

export function MobileBottomNav({
  activeTab,
  onSelectTab,
  onOpenAdd,
  onCreateNote,
  onCreateDrawing,
  onOpenCollections,
  onOpenLibrary,
}: MobileBottomNavProps) {
  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 block border-t border-border bg-card pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <div className="flex h-14 items-center justify-around px-2">
        {/* Tab 1: All Bookmarks */}
        <button
          type="button"
          aria-current={activeTab === "all" ? "page" : undefined}
          onClick={() => onSelectTab("all")}
          className={cn(
            "flex min-w-[56px] flex-1 flex-col items-center justify-center gap-1 py-1 transition-colors active:scale-95",
            activeTab === "all"
              ? "text-brand-charcoal"
              : "text-brand-muted hover:text-brand-charcoal"
          )}
        >
          <BookmarkSimple
            className="size-5"
            weight={activeTab === "all" ? "fill" : "regular"}
          />
          <span className="text-xs font-medium">
            All
          </span>
        </button>

        {/* Tab 2: Folders */}
        <button
          type="button"
          aria-current={activeTab === "folders" ? "page" : undefined}
          onClick={() => {
            onSelectTab("folders")
            onOpenCollections()
          }}
          className={cn(
            "flex min-w-[56px] flex-1 flex-col items-center justify-center gap-1 py-1 transition-colors active:scale-95",
            activeTab === "folders"
              ? "text-brand-charcoal"
              : "text-brand-muted hover:text-brand-charcoal"
          )}
        >
          <Folder
            className="size-5"
            weight={activeTab === "folders" ? "fill" : "regular"}
          />
          <span className="text-xs font-medium">
            Folders
          </span>
        </button>

        {/* Tab 3: Quick Add (+) Center Elevated Button */}
        <div className="flex min-w-[56px] flex-1 items-center justify-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex size-11 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                aria-label="Add to Cabinet"
              >
                <Plus className="size-5" weight="bold" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" side="top" className="w-44">
              <DropdownMenuGroup>
              <DropdownMenuItem onSelect={onOpenAdd}>
                <BookmarkSimple /> Add bookmark
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={onCreateNote}>
                <FileText /> Create note
              </DropdownMenuItem>
              {onCreateDrawing && (
                <DropdownMenuItem onSelect={onCreateDrawing}>
                  <Scribble /> New drawing
                </DropdownMenuItem>
              )}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Tab 4: Favorites */}
        <button
          type="button"
          aria-current={activeTab === "favorites" ? "page" : undefined}
          onClick={() => onSelectTab("favorites")}
          className={cn(
            "flex min-w-[56px] flex-1 flex-col items-center justify-center gap-1 py-1 transition-colors active:scale-95",
            activeTab === "favorites"
              ? "text-brand-charcoal"
              : "text-brand-muted hover:text-brand-charcoal"
          )}
        >
          <Star
            className="size-5"
            weight={activeTab === "favorites" ? "fill" : "regular"}
          />
          <span className="text-xs font-medium">
            Favorites
          </span>
        </button>

        {/* Tab 5: Library / Filters */}
        <button
          type="button"
          aria-current={activeTab === "library" ? "page" : undefined}
          onClick={() => {
            onSelectTab("library")
            onOpenLibrary()
          }}
          className={cn(
            "relative flex min-w-[56px] flex-1 flex-col items-center justify-center gap-1 py-1 transition-colors active:scale-95",
            activeTab === "library"
              ? "text-brand-charcoal"
              : "text-brand-muted hover:text-brand-charcoal"
          )}
        >
          <Faders
            className="size-5"
            weight={activeTab === "library" ? "fill" : "regular"}
          />
          <span className="text-xs font-medium">
            Library
          </span>
        </button>
      </div>
    </nav>
  )
}
