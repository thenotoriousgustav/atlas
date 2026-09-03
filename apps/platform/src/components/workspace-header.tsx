"use client"

import React from "react"
import Link from "next/link"
import { Button } from "@atlas/ui/components/button"
import { Badge } from "@atlas/ui/components/badge"
import { SignOut, ArrowLeft } from "@phosphor-icons/react"
import { ThemeToggle } from "@/components/theme-toggle"
import { useAuthStore } from "@/store/useAuthStore"
import { useRouter } from "next/navigation"
import { useAuthControllerLogout } from "@atlas/api-client"
import { toast } from "@atlas/ui/components/sonner"

export interface WorkspaceHeaderProps {
  moduleName: string
  moduleBadge?: string
  moduleSubtitle?: string
  moduleInitial?: React.ReactNode
  user?: {
    name?: string
    email?: string
  } | null
  onLogout?: () => void
  actions?: React.ReactNode
}

/**
 * Reusable WorkspaceHeader for all Atlas Platform modules (Cabinet, Garage, Fetch, Habit)
 * ponytail: single source of truth for workspace headers across all frontend modules.
 */
export function WorkspaceHeader({
  moduleName,
  moduleBadge,
  moduleSubtitle = "Gustam Platform · Workspace",
  moduleInitial,
  user: userProp,
  onLogout: onLogoutProp,
  actions,
}: WorkspaceHeaderProps) {
  const router = useRouter()
  const { user: storeUser, logout } = useAuthStore()
  const logoutMutation = useAuthControllerLogout()

  const user = userProp !== undefined ? userProp : storeUser

  const handleLogout = async () => {
    if (onLogoutProp) {
      onLogoutProp()
      return
    }
    try {
      await logoutMutation.mutateAsync()
      logout()
      toast.success("Logged out successfully")
      router.push("/login")
    } catch {
      logout()
      router.push("/login")
    }
  }

  const initial = moduleInitial || moduleName.charAt(0).toUpperCase()

  return (
    <header className="flex items-center justify-between gap-3 border-b border-brand-border pb-3 md:pb-5">
      {/* Brand & Module Title */}
      <div className="flex items-center gap-3">
        <Link
          href="/"
          className="flex size-7 items-center justify-center border border-brand-border text-brand-muted transition-colors hover:border-brand-charcoal hover:bg-brand-charcoal hover:text-brand-canvas"
          title="Back to portal hub"
        >
          <ArrowLeft className="size-4" />
        </Link>

        <div className="flex size-7 items-center justify-center rounded-none bg-brand-charcoal font-serif text-sm font-semibold text-brand-canvas italic">
          {initial}
        </div>

        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-serif text-2xl font-medium tracking-tight text-brand-charcoal">
              {moduleName}
            </h1>
            {moduleBadge && (
              <Badge
                variant="outline"
                className="rounded-none border-brand-border px-1.5 py-0.5 font-mono text-[10px] tracking-wider text-brand-muted uppercase"
              >
                {moduleBadge}
              </Badge>
            )}
          </div>
          <p className="font-mono text-[10px] tracking-tight text-brand-muted uppercase">
            {moduleSubtitle}
          </p>
        </div>
      </div>

      {/* Action Controls & Profile */}
      <div className="flex items-center gap-4">
        {actions}

        {user && (
          <div className="hidden text-right font-mono sm:block">
            <p className="text-xs font-semibold text-brand-charcoal">
              {user.name || user.email}
            </p>
            <p className="text-[10px] text-brand-muted">{user.email}</p>
          </div>
        )}

        <ThemeToggle />

        <Button
          variant="outline"
          size="sm"
          onClick={handleLogout}
          className="flex h-8 items-center gap-1.5 rounded-none border-brand-border text-[10px] font-semibold tracking-tight uppercase"
        >
          <SignOut className="size-3.5" />
          <span className="hidden md:inline">Sign Out</span>
        </Button>
      </div>
    </header>
  )
}

export const StandardWorkspaceHeader = WorkspaceHeader
