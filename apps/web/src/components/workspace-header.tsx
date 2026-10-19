"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { SignOut, GithubLogo, GoogleLogo, Gear } from "@phosphor-icons/react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { ThemeToggle } from "@/components/theme-toggle"
import { useRouter } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"
import { authClient } from "@/lib/auth-client"
import { toast } from "@/components/ui/sonner"
import type { DisplayPreferences } from "@/app/cabinet/components/display-preferences"

export interface WorkspaceHeaderProps {
  user?: {
    name?: string
    email?: string
  } | null
  onLogout?: () => void
  actions?: React.ReactNode
  displayPreferences?: DisplayPreferences
  onDisplayPreferencesChange?: (preferences: DisplayPreferences) => void
}

export function WorkspaceHeader({
  user: userProp,
  onLogout: onLogoutProp,
  actions,
  displayPreferences,
  onDisplayPreferencesChange,
}: WorkspaceHeaderProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { data: session } = authClient.useSession()
  const user = userProp !== undefined ? userProp : session?.user

  const handleLogout = async () => {
    if (onLogoutProp) {
      onLogoutProp()
      return
    }
    try {
      const { error } = await authClient.signOut()
      if (error) throw new Error(error.message || "Sign-out failed")
      queryClient.clear()
      toast.success("Logged out successfully")
      router.replace("/login")
    } catch {
      toast.error("Sign-out failed. Try again.")
    }
  }

  const handleLink = async (provider: "github" | "google") => {
    try {
      const { error } = await authClient.linkSocial({
        provider,
        callbackURL: `${window.location.origin}/cabinet`,
        errorCallbackURL: `${window.location.origin}/cabinet`,
      })
      if (error) throw new Error(error.message || "Account linking failed")
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Account linking failed. Try again."
      )
    }
  }

  return (
    <header className="flex items-center justify-between gap-3 border-b border-border pb-2 md:pb-2.5">
      {/* Cabinet identity */}
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

      {/* Action Controls & Profile */}
      <div className="flex items-center gap-4">
        {actions}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              aria-label="Display preferences and account settings"
            >
              <Gear data-icon="inline-start" />
              <span className="hidden max-w-40 truncate sm:inline">
                {user?.name || user?.email || "Settings"}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuGroup>
              {user && <DropdownMenuLabel>{user.email}</DropdownMenuLabel>}
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <Gear /> Display preferences
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  {(
                    [
                      ["showTitle", "Title"],
                      ["showDescription", "Description"],
                      ["showImage", "Image"],
                      ["showWebsite", "Website URL"],
                    ] as const
                  ).map(([key, label]) => (
                    <DropdownMenuCheckboxItem
                      key={key}
                      checked={displayPreferences?.[key] ?? true}
                      onCheckedChange={(checked) => {
                        if (displayPreferences && onDisplayPreferencesChange) {
                          onDisplayPreferencesChange({
                            ...displayPreferences,
                            [key]: checked,
                          })
                        }
                      }}
                      onSelect={(event) => event.preventDefault()}
                    >
                      {label}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              {user && <DropdownMenuSeparator />}
              {user && (
                <>
                  <DropdownMenuItem onSelect={() => handleLink("github")}>
                    <GithubLogo /> Link GitHub
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => handleLink("google")}>
                    <GoogleLogo /> Link Google
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>

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
