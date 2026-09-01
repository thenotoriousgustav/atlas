"use client"

import React, { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"
import {
  useAuthControllerMe,
  useAuthControllerLogout,
  useFoldersControllerFindAll,
  useBookmarksControllerFindAll,
  useVehiclesControllerFindAll,
  useRemindersControllerFindAll,
  useFetchControllerGetHistory,
} from "@atlas/api-client"
import { useAuthStore } from "../store/useAuthStore"
import { Button } from "@atlas/ui/components/button"
import { Badge } from "@atlas/ui/components/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@atlas/ui/components/alert-dialog"
import { ThemeToggle } from "@/components/theme-toggle"
import { ModuleContainer } from "@/components/module-container"
import { cn } from "@/lib/utils"
import {
  BookmarkSimple,
  Clock,
  ArrowRight,
  SignOut,
  FolderSimple,
  User,
  GasPump,
  Gauge,
  Wrench,
  Download,
  Heart,
  Fingerprint,
  CalendarCheck,
} from "@phosphor-icons/react"
import { startRegistration } from "@simplewebauthn/browser"

export const dynamic = "force-dynamic"

export default function HomePortalPage() {
  const router = useRouter()
  const { user, setUser, logout } = useAuthStore()
  const [isLoading, setIsLoading] = useState(true)
  const [currentTime, setCurrentTime] = useState("")

  // Clock ticks
  useEffect(() => {
    const updateClock = () => {
      const now = new Date()
      setCurrentTime(
        now.toLocaleTimeString(undefined, {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        })
      )
    }
    updateClock()
    const interval = setInterval(updateClock, 1000)
    return () => clearInterval(interval)
  }, [])

  // Fetch Current User
  const { data: meData, isLoading: isMeLoading } = useAuthControllerMe({
    query: {
      retry: false,
      enabled: true,
    },
  })

  // Sync session
  useEffect(() => {
    if (!isMeLoading) {
      if ((meData as any)?.success && (meData as any)?.data) {
        setUser((meData as any).data)
      } else {
        setUser(null)
        router.push("/login")
      }
      setIsLoading(false)
    }
  }, [meData, isMeLoading, setUser, router])

  // Fetch Cabinet Stats
  const { data: foldersData } = useFoldersControllerFindAll({
    query: { enabled: !!user },
  })
  const { data: bookmarksData } = useBookmarksControllerFindAll(undefined, {
    query: { enabled: !!user },
  })

  // Fetch Garage Stats
  const { data: vehiclesData } = useVehiclesControllerFindAll({
    query: { enabled: !!user },
  })
  const { data: remindersData } = useRemindersControllerFindAll(undefined, {
    query: { enabled: !!user },
  })

  // Fetch Fetch Stats
  const { data: fetchHistoryData } = useFetchControllerGetHistory(undefined, {
    query: { enabled: !!user },
  })

  const queryClient = useQueryClient()
  const logoutMutation = useAuthControllerLogout()

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync()
      queryClient.clear()
      logout()
      router.push("/login")
    } catch {
      queryClient.clear()
      logout()
      router.push("/login")
    }
  }

  const [isRegisteringPasskey, setIsRegisteringPasskey] = useState(false)
  const [hasPasskey, setHasPasskey] = useState(false)
  const [passkeyAlertOpen, setPasskeyAlertOpen] = useState(false)
  const [passkeyAlertTitle, setPasskeyAlertTitle] = useState("")
  const [passkeyAlertDesc, setPasskeyAlertDesc] = useState("")

  // Check if current user has passkeys registered
  useEffect(() => {
    if (user?.email) {
      fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/v1/auth/passkey/check?email=${encodeURIComponent(user.email)}`,
        {
          credentials: "include",
        }
      )
        .then((res) => res.json())
        .then((data) => {
          setHasPasskey(data?.data?.hasPasskey || false)
        })
        .catch(() => {})
    }
  }, [user])

  const handleRegisterPasskey = async () => {
    setIsRegisteringPasskey(true)
    try {
      const optionsRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/v1/auth/passkey/register-options`,
        {
          credentials: "include",
        }
      )
      if (!optionsRes.ok) {
        throw new Error("Failed to load passkey registration options")
      }
      const options = await optionsRes.json()

      const registrationJSON = await startRegistration({
        optionsJSON: options.data,
      })

      const verifyRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/v1/auth/passkey/register-verify`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            response: registrationJSON,
          }),
        }
      )

      if (!verifyRes.ok) {
        throw new Error("Passkey verification failed")
      }

      setHasPasskey(true)
      setPasskeyAlertTitle("Registrasi Passkey Berhasil")
      setPasskeyAlertDesc(
        "Passkey telah berhasil didaftarkan di perangkat ini!"
      )
      setPasskeyAlertOpen(true)
    } catch (err: any) {
      setPasskeyAlertTitle("Registrasi Passkey Gagal")
      setPasskeyAlertDesc(`Gagal melakukan pendaftaran passkey: ${err.message}`)
      setPasskeyAlertOpen(true)
    } finally {
      setIsRegisteringPasskey(false)
    }
  }

  // Calculations for Cabinet
  const totalFolders = (foldersData as any)?.data?.length || 0
  const totalBookmarks =
    (
      (bookmarksData as any)?.data?.data ||
      (bookmarksData as any)?.data ||
      []
    ).filter((b: any) => !b.deletedAt).length || 0

  // Calculations for Garage
  const totalVehicles = (vehiclesData as any)?.data?.length || 0
  const totalActiveReminders =
    (remindersData as any)?.data?.filter((r: any) => r.status === "ACTIVE")
      .length || 0

  // Calculations for Fetch
  const totalDownloads = (fetchHistoryData as any)?.data?.length || 0
  const totalFavoriteDownloads =
    (fetchHistoryData as any)?.data?.filter((i: any) => i.isFavorite).length ||
    0

  if (isLoading || isMeLoading || !user) {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center space-y-4 bg-brand-canvas font-mono text-xs text-brand-muted select-none">
        <Clock className="h-6 w-6 animate-spin text-brand-charcoal" />
        <span>Loading Gustam Platform Portal...</span>
      </div>
    )
  }

  return (
    <div className="flex min-h-[100dvh] flex-col justify-between bg-brand-canvas px-4 py-12 font-mono select-none md:px-12">
      {/* Top Bar: Portal Greeting & Profile */}
      <ModuleContainer>
        <header className="flex flex-col justify-between gap-4 border-b border-brand-border pb-5 md:flex-row md:items-center">
          {/* Brand & Module Title */}
          <div className="flex items-center gap-3">
            <div className="flex size-7 items-center justify-center rounded-none bg-brand-charcoal font-serif text-sm font-semibold text-brand-canvas italic">
              A
            </div>

            <div>
              <h1 className="font-serif text-2xl font-medium tracking-tight text-brand-charcoal">
                Atlas
              </h1>

              <p className="font-mono text-[10px] tracking-tight text-brand-muted uppercase">
                Productivity Suite Hub
              </p>
            </div>
          </div>

          {/* Action Controls & Profile */}
          <div className="flex items-center gap-4">
            {user && (
              <div className="hidden border-l border-brand-border pl-4 text-right font-mono sm:block">
                <p className="text-xs font-semibold text-brand-charcoal">
                  {user.name}
                </p>
                <p className="text-[10px] text-brand-muted">{user.email}</p>
              </div>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={handleRegisterPasskey}
              disabled={isRegisteringPasskey}
              className="flex items-center gap-1.5 rounded-none border-brand-border text-[10px] font-semibold tracking-tight text-brand-charcoal uppercase"
            >
              <Fingerprint className="h-3.5 w-3.5" />
              {isRegisteringPasskey
                ? "Registering..."
                : hasPasskey
                  ? "Passkey Registered"
                  : "Setup Passkey"}
            </Button>

            <ThemeToggle />

            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="flex items-center gap-1.5 rounded-none border-brand-border text-[10px] font-semibold tracking-tight uppercase"
            >
              <SignOut className="h-3.5 w-3.5" />
              <span className="hidden md:inline">Sign Out</span>
            </Button>
          </div>
        </header>
      </ModuleContainer>

      {/* Main Content: Hub Grid Picker */}
      <ModuleContainer className="flex flex-1 flex-col justify-center space-y-10 py-12">
        {/* Asymmetric Header */}
        <div className="max-w-xl space-y-3">
          <div className="flex items-center gap-2 text-[10px] tracking-widest text-brand-muted uppercase">
            <span>
              {new Date().toLocaleDateString(undefined, {
                weekday: "long",
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </span>
            <span>·</span>
            <span>{currentTime}</span>
          </div>
          <h2 className="font-serif text-3xl leading-tight font-medium tracking-tight text-brand-charcoal md:text-4xl">
            Select a workspace to continue your focus session
          </h2>
        </div>

        {/* Dashboard Grid Picker */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Card 1: Cabinet Bookmark Vault */}
          <div
            onClick={() => router.push("/cabinet")}
            className="group flex min-h-60 cursor-pointer flex-col justify-between rounded-none border border-brand-border bg-white p-6 transition-all duration-200 hover:border-brand-charcoal hover:shadow-xs"
          >
            <div className="space-y-4">
              <div className="flex h-10 w-10 items-center justify-center bg-brand-charcoal/5 text-brand-charcoal">
                <BookmarkSimple className="h-5 w-5" />
              </div>

              <div className="space-y-1">
                <h3 className="font-serif text-2xl font-semibold tracking-tight text-brand-charcoal">
                  Cabinet
                </h3>
                <p className="text-xs text-brand-muted">
                  Personal knowledge vault, bookmark manager, and tag
                  taxonomies.
                </p>
              </div>
            </div>

            {/* Live Data Summary for Cabinet */}
            <div className="mt-6 flex items-center justify-between border-t border-brand-charcoal/5 pt-4">
              <div className="flex gap-4 text-[10px] text-brand-muted">
                <div className="space-y-0.5">
                  <span className="block text-[9px] tracking-wide text-slate-400 uppercase">
                    Bookmarks
                  </span>
                  <span className="flex items-center gap-1 font-semibold text-brand-charcoal">
                    <BookmarkSimple className="h-3.5 w-3.5" />
                    {totalBookmarks} saved
                  </span>
                </div>
                <div className="space-y-0.5">
                  <span className="block text-[9px] tracking-wide text-slate-400 uppercase">
                    Folders
                  </span>
                  <span className="flex items-center gap-1 font-semibold text-brand-charcoal">
                    <FolderSimple className="h-3.5 w-3.5" />
                    {totalFolders} folders
                  </span>
                </div>
              </div>

              <div className="flex h-7 w-7 items-center justify-center border border-brand-border text-brand-muted transition-colors group-hover:border-brand-charcoal group-hover:bg-brand-charcoal group-hover:text-white">
                <ArrowRight className="h-4 w-4" />
              </div>
            </div>
          </div>

          {/* Card 2: Garage Vehicle Vault */}
          <div
            onClick={() => router.push("/garage")}
            className="group flex min-h-60 cursor-pointer flex-col justify-between rounded-none border border-brand-border bg-white p-6 transition-all duration-200 hover:border-brand-charcoal hover:shadow-xs"
          >
            <div className="space-y-4">
              <div className="flex h-10 w-10 items-center justify-center bg-brand-charcoal/5 text-brand-charcoal">
                <Wrench className="h-5 w-5" />
              </div>

              <div className="space-y-1">
                <h3 className="font-serif text-2xl font-semibold tracking-tight text-brand-charcoal">
                  Garage
                </h3>
                <p className="text-xs text-brand-muted">
                  Personal vehicle logs, maintenance intervals, refueling
                  efficiency, and papers.
                </p>
              </div>
            </div>

            {/* Live Data Summary for Garage */}
            <div className="mt-6 flex items-center justify-between border-t border-brand-charcoal/5 pt-4">
              <div className="flex gap-4 text-[10px] text-brand-muted">
                <div className="space-y-0.5">
                  <span className="block text-[9px] tracking-wide text-slate-400 uppercase">
                    Vehicles
                  </span>
                  <span className="flex items-center gap-1 font-semibold text-brand-charcoal">
                    <Gauge className="h-3.5 w-3.5" />
                    {totalVehicles} active
                  </span>
                </div>
                <div className="space-y-0.5">
                  <span className="block text-[9px] tracking-wide text-slate-400 uppercase">
                    Reminders
                  </span>
                  <span className="flex items-center gap-1 font-semibold text-brand-charcoal">
                    <Clock className="h-3.5 w-3.5" />
                    {totalActiveReminders} active
                  </span>
                </div>
              </div>

              <div className="flex h-7 w-7 items-center justify-center border border-brand-border text-brand-muted transition-colors group-hover:border-brand-charcoal group-hover:bg-brand-charcoal group-hover:text-white">
                <ArrowRight className="h-4 w-4" />
              </div>
            </div>
          </div>

          {/* Card 3: Fetch Media Downloader */}
          <div
            onClick={() => router.push("/fetch")}
            className="group flex min-h-60 cursor-pointer flex-col justify-between rounded-none border border-brand-border bg-white p-6 transition-all duration-200 hover:border-brand-charcoal hover:shadow-xs"
          >
            <div className="space-y-4">
              <div className="flex h-10 w-10 items-center justify-center bg-brand-charcoal/5 text-brand-charcoal">
                <Download className="h-5 w-5" />
              </div>

              <div className="space-y-1">
                <h3 className="font-serif text-2xl font-semibold tracking-tight text-brand-charcoal">
                  Fetch
                </h3>
                <p className="text-xs text-brand-muted">
                  Social media video, audio, and image downloader with metadata
                  history.
                </p>
              </div>
            </div>

            {/* Live Data Summary for Fetch */}
            <div className="mt-6 flex items-center justify-between border-t border-brand-charcoal/5 pt-4">
              <div className="flex gap-4 text-[10px] text-brand-muted">
                <div className="space-y-0.5">
                  <span className="block text-[9px] tracking-wide text-slate-400 uppercase">
                    Downloads
                  </span>
                  <span className="flex items-center gap-1 font-semibold text-brand-charcoal">
                    <Download className="h-3.5 w-3.5" />
                    {totalDownloads} items
                  </span>
                </div>
                <div className="space-y-0.5">
                  <span className="block text-[9px] tracking-wide text-slate-400 uppercase">
                    Favorites
                  </span>
                  <span className="flex items-center gap-1 font-semibold text-brand-charcoal">
                    <Heart className="h-3.5 w-3.5 text-[#b3261e]" />
                    {totalFavoriteDownloads} saved
                  </span>
                </div>
              </div>

              <div className="flex h-7 w-7 items-center justify-center border border-brand-border text-brand-muted transition-colors group-hover:border-brand-charcoal group-hover:bg-brand-charcoal group-hover:text-white">
                <ArrowRight className="h-4 w-4" />
              </div>
            </div>
          </div>

          {/* Card 4: Habit Behavior Tracker */}
          <div
            onClick={() => router.push("/habit")}
            className="group flex min-h-60 cursor-pointer flex-col justify-between rounded-none border border-brand-border bg-white p-6 transition-all duration-200 hover:border-brand-charcoal hover:shadow-xs"
          >
            <div className="space-y-4">
              <div className="flex h-10 w-10 items-center justify-center bg-brand-charcoal/5 text-brand-charcoal">
                <CalendarCheck className="h-5 w-5" />
              </div>

              <div className="space-y-1">
                <h3 className="font-serif text-2xl font-semibold tracking-tight text-brand-charcoal">
                  Habit
                </h3>
                <p className="text-xs text-brand-muted">
                  Daily habit &amp; behavior tracking, 365-day heatmaps,
                  streaks, and fast &lt;5s check-in engine.
                </p>
              </div>
            </div>

            {/* Live Data Summary for Habit */}
            <div className="mt-6 flex items-center justify-between border-t border-brand-charcoal/5 pt-4">
              <div className="flex gap-4 text-[10px] text-brand-muted">
                <div className="space-y-0.5">
                  <span className="block text-[9px] tracking-wide text-slate-400 uppercase">
                    Heatmap
                  </span>
                  <span className="flex items-center gap-1 font-semibold text-brand-charcoal">
                    <CalendarCheck className="h-3.5 w-3.5" />
                    365 Days
                  </span>
                </div>
                <div className="space-y-0.5">
                  <span className="block text-[9px] tracking-wide text-slate-400 uppercase">
                    Fast Input
                  </span>
                  <span className="flex items-center gap-1 font-semibold text-brand-charcoal">
                    ⌘K Enabled
                  </span>
                </div>
              </div>

              <div className="flex h-7 w-7 items-center justify-center border border-brand-border text-brand-muted transition-colors group-hover:border-brand-charcoal group-hover:bg-brand-charcoal group-hover:text-white">
                <ArrowRight className="h-4 w-4" />
              </div>
            </div>
          </div>
        </div>
      </ModuleContainer>

      {/* Footer Details */}
      <ModuleContainer className="flex flex-col justify-between gap-4 border-t border-brand-border pt-6 text-[9px] tracking-wider text-brand-muted uppercase sm:flex-row">
        <span>Gustam Platform · Personal Workspaces</span>
        <span className="flex items-center gap-1">
          <User className="h-3 w-3" />
          Seeded Single-User Authorization Active
        </span>
      </ModuleContainer>

      {/* Passkey Alert Dialog */}
      <AlertDialog open={passkeyAlertOpen} onOpenChange={setPasskeyAlertOpen}>
        <AlertDialogContent className="rounded-none font-mono">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-sm font-bold tracking-wider text-zinc-900 uppercase dark:text-zinc-100">
              {passkeyAlertTitle}
            </AlertDialogTitle>
            <AlertDialogDescription className="mt-2 text-xs text-[#787774] dark:text-zinc-400">
              {passkeyAlertDesc}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4">
            <AlertDialogAction
              onClick={() => setPasskeyAlertOpen(false)}
              className="rounded-none bg-[#111111] px-4 py-2 text-xs text-white dark:bg-zinc-100 dark:text-zinc-900"
            >
              Lanjutkan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
