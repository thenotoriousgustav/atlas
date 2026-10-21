"use client"

import React from "react"
import { SidebarTrigger } from "@/components/ui/sidebar"

export function WorkspaceHeader({ children, actions, onOpenNavigation }: {
  children?: React.ReactNode
  actions?: React.ReactNode
  onOpenNavigation?: () => void
}) {
  return <header className="flex min-h-20 shrink-0 items-center gap-3 py-4">
    <SidebarTrigger onClick={onOpenNavigation} className="size-11 shrink-0 md:size-9" />
    <div className="flex min-w-0 flex-1 items-center gap-3">{children}{actions}</div>
  </header>
}
