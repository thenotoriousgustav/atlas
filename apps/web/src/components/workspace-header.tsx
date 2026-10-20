"use client"

import React from "react"
import { SidebarSimple } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip"
import type { DisplayPreferences } from "@/app/cabinet/components/display-preferences"

export interface WorkspaceHeaderProps {
  user?: {
    name?: string
    email?: string
  } | null
  onLogout?: () => void
  actions?: React.ReactNode
  children?: React.ReactNode
  displayPreferences?: DisplayPreferences
  onDisplayPreferencesChange?: (preferences: DisplayPreferences) => void
  isSidebarCollapsed?: boolean
  onToggleSidebar?: () => void
}

export function WorkspaceHeader({
  actions,
  children,
  isSidebarCollapsed = false,
  onToggleSidebar,
}: WorkspaceHeaderProps) {
  return (
    <header className="flex flex-col gap-2.5 border-b border-border pb-2 md:flex-row md:items-center md:justify-between md:pb-2.5">
      {/* Cabinet identity & Sidebar Toggle */}
      <div className="flex shrink-0 items-center gap-2 sm:gap-2.5">
        {onToggleSidebar && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={onToggleSidebar}
                className="hidden size-7 rounded-none text-muted-foreground hover:bg-muted hover:text-foreground md:inline-flex"
                aria-label={isSidebarCollapsed ? "Expand sidebar" : "Hide sidebar"}
              >
                <SidebarSimple className="size-4" weight={isSidebarCollapsed ? "regular" : "fill"} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" align="start">
              {isSidebarCollapsed ? "Expand sidebar (⌘B)" : "Hide sidebar (⌘B)"}
            </TooltipContent>
          </Tooltip>
        )}

        <div className="flex items-center gap-2.5">
          <div className="flex size-6 items-center justify-center rounded-xs bg-foreground font-serif text-xs font-semibold text-background italic">
            C
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-serif text-lg font-medium tracking-tight text-foreground">
                Cabinet
              </h1>
            </div>
            <p className="font-mono text-[9px] tracking-tight text-muted-foreground uppercase">
              Bookmarks · Notes · Reading
            </p>
          </div>
        </div>
      </div>

      {/* Main Header Slot: Toolbar or Actions */}
      <div className="flex min-w-0 flex-1 items-center justify-end gap-3">
        {children}
        {actions}
      </div>
    </header>
  )
}
