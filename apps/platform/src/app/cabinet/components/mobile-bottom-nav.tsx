"use client"

import React from "react"
import {
  BookmarkSimple,
  Folder,
  Plus,
  Star,
  Faders,
} from "@phosphor-icons/react"
import { cn } from "@atlas/ui/lib/utils"

export type MobileTab = "all" | "folders" | "add" | "favorites" | "library"

interface MobileBottomNavProps {
  activeTab: MobileTab
  onSelectTab: (tab: MobileTab) => void
  onOpenAdd: () => void
  onOpenCollections: () => void
  onOpenLibrary: () => void
  trashCount?: number
}

export function MobileBottomNav({
  activeTab,
  onSelectTab,
  onOpenAdd,
  onOpenCollections,
  onOpenLibrary,
  trashCount = 0,
}: MobileBottomNavProps) {
  return (
    <nav
      aria-label="Mobile Bottom Navigation"
      className="fixed bottom-0 inset-x-0 z-40 block md:hidden border-t border-brand-border bg-white/95 backdrop-blur-md pb-[env(safe-area-inset-bottom)]"
    >
      <div className="flex h-14 items-center justify-around px-2">
        {/* Tab 1: All Bookmarks */}
        <button
          type="button"
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
          <span className="font-mono text-[9px] font-semibold tracking-tight uppercase">
            All
          </span>
        </button>

        {/* Tab 2: Folders */}
        <button
          type="button"
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
          <span className="font-mono text-[9px] font-semibold tracking-tight uppercase">
            Folders
          </span>
        </button>

        {/* Tab 3: Quick Add (+) Center Elevated Button */}
        <div className="flex min-w-[56px] flex-1 items-center justify-center">
          <button
            type="button"
            onClick={onOpenAdd}
            className="flex size-11 items-center justify-center rounded-none bg-brand-charcoal text-white shadow-sm transition-all active:scale-90 hover:bg-brand-charcoal/90"
            aria-label="Add Bookmark"
          >
            <Plus className="size-5" weight="bold" />
          </button>
        </div>

        {/* Tab 4: Favorites */}
        <button
          type="button"
          onClick={() => onSelectTab("favorites")}
          className={cn(
            "flex min-w-[56px] flex-1 flex-col items-center justify-center gap-1 py-1 transition-colors active:scale-95",
            activeTab === "favorites"
              ? "text-[#956400]"
              : "text-brand-muted hover:text-brand-charcoal"
          )}
        >
          <Star
            className={cn(
              "size-5",
              activeTab === "favorites" ? "text-[#956400]" : ""
            )}
            weight={activeTab === "favorites" ? "fill" : "regular"}
          />
          <span className="font-mono text-[9px] font-semibold tracking-tight uppercase">
            Favs
          </span>
        </button>

        {/* Tab 5: Library / Filters */}
        <button
          type="button"
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
          <span className="font-mono text-[9px] font-semibold tracking-tight uppercase">
            Library
          </span>
          {trashCount > 0 && (
            <span className="absolute top-1 right-3 flex size-1.5 rounded-full bg-brand-charcoal" />
          )}
        </button>
      </div>
    </nav>
  )
}
