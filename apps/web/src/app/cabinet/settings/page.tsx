"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { useQueryClient } from "@tanstack/react-query"
import {
  ArrowLeft,
  PaintBrush,
  User,
  Database,
  Wrench,
  Keyboard,
  Sun,
  Moon,
  Desktop,
  DownloadSimple,
  UploadSimple,
  GithubLogo,
  GoogleLogo,
  SignOut,
  Trash,
  ArrowCounterClockwise,
  Check,
  WarningCircle,
  ArrowSquareOut,
  SquaresFour,
  List,
} from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "@/components/ui/sonner"
import { useConfirm } from "@/hooks/use-confirm"
import { authClient } from "@/lib/auth-client"
import {
  AXIOS_INSTANCE,
  useBookmarksControllerGetHealthSummary,
  useBookmarksControllerGetDuplicates,
  useBookmarksControllerCleanDuplicates,
  useBookmarksControllerTriggerHealthCheck,
  useBookmarksControllerImport,
} from "@/lib/api-client"
import {
  defaultDisplayPreferences,
  type DisplayPreferences,
} from "@/app/cabinet/components/display-preferences"
import { cn } from "@/lib/utils"

export default function SettingsPage() {
  const router = useRouter()
  const confirm = useConfirm()
  const queryClient = useQueryClient()
  const { theme, setTheme } = useTheme()
  const { data: session } = authClient.useSession()
  const user = session?.user

  // Local storage state
  const [mounted, setMounted] = useState(false)
  const [displayPrefs, setDisplayPrefs] = useState<DisplayPreferences>(defaultDisplayPreferences)
  const [defaultViewMode, setDefaultViewMode] = useState<"list" | "moodboard">("list")
  const [defaultColumns, setDefaultColumns] = useState<number>(3)

  // Maintenance queries
  const { data: healthData, refetch: refetchHealth, isFetching: isFetchingHealth } =
    useBookmarksControllerGetHealthSummary()
  const health = (healthData as any)?.data || healthData

  const { data: duplicatesData, refetch: refetchDuplicates, isFetching: isFetchingDuplicates } =
    useBookmarksControllerGetDuplicates({ query: { enabled: true } })
  const duplicates = (duplicatesData as any)?.data || duplicatesData || []

  const cleanDuplicatesMutation = useBookmarksControllerCleanDuplicates()
  const triggerHealthMutation = useBookmarksControllerTriggerHealthCheck()
  const importMutation = useBookmarksControllerImport()

  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [isScanning, setIsScanning] = useState(false)
  const [isEmptyingTrash, setIsEmptyingTrash] = useState(false)

  useEffect(() => {
    setMounted(true)
    const savedMode = localStorage.getItem("cabinet_view_mode")
    if (savedMode === "list" || savedMode === "moodboard") {
      setDefaultViewMode(savedMode)
    }

    const savedPrefs = localStorage.getItem("cabinet_display_preferences")
    if (savedPrefs) {
      try {
        const parsed = JSON.parse(savedPrefs)
        if (typeof parsed === "object" && parsed !== null) {
          setDisplayPrefs({ ...defaultDisplayPreferences, ...parsed })
        }
      } catch {}
    }

    const savedCols = localStorage.getItem("cabinet_column_count")
    if (savedCols) {
      const parsed = parseInt(savedCols, 10)
      if (parsed >= 1 && parsed <= 4) setDefaultColumns(parsed)
    }
  }, [])

  const handlePrefToggle = (key: keyof DisplayPreferences, checked: boolean) => {
    const updated = { ...displayPrefs, [key]: checked }
    setDisplayPrefs(updated)
    try {
      localStorage.setItem("cabinet_display_preferences", JSON.stringify(updated))
    } catch {}
    toast.success("Display preference saved")
  }

  const handleViewModeToggle = (mode: "list" | "moodboard") => {
    setDefaultViewMode(mode)
    try {
      localStorage.setItem("cabinet_view_mode", mode)
    } catch {}
    toast.success(`Default view set to ${mode === "moodboard" ? "Moodboard" : "List"}`)
  }

  const handleColumnsToggle = (cols: number) => {
    setDefaultColumns(cols)
    try {
      localStorage.setItem("cabinet_column_count", cols.toString())
    } catch {}
    toast.success(`Default columns set to ${cols}`)
  }

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const response = await AXIOS_INSTANCE.get("/v1/bookmarks/export", {
        responseType: "blob",
      })
      const blob = new Blob([response.data], { type: "text/html;charset=utf-8" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `cabinet-bookmarks-${new Date().toISOString().split("T")[0]}.html`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success("Bookmarks exported successfully")
    } catch {
      toast.error("Failed to export bookmarks")
    } finally {
      setIsExporting(false)
    }
  }

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsImporting(true)
    const toastId = toast.loading("Importing bookmarks from file...")
    try {
      const content = await file.text()
      const res: any = await importMutation.mutateAsync({
        data: { htmlContent: content },
      })
      queryClient.invalidateQueries({ queryKey: ["/v1/bookmarks"] })
      queryClient.invalidateQueries({ queryKey: ["infinite", "/v1/bookmarks"] })
      queryClient.invalidateQueries({ queryKey: ["/v1/folders"] })
      queryClient.invalidateQueries({ queryKey: ["/v1/tags"] })
      toast.success(`Import complete! ${res?.data?.imported || 0} bookmarks imported.`, { id: toastId })
    } catch {
      toast.error("Failed to import bookmarks HTML file", { id: toastId })
    } finally {
      setIsImporting(false)
      e.target.value = ""
    }
  }

  const handleScanLinks = async () => {
    setIsScanning(true)
    try {
      await triggerHealthMutation.mutateAsync()
      toast.success("Bookmark link check started in background")
      setTimeout(() => refetchHealth(), 3000)
    } catch {
      toast.error("Failed to start health scan")
    } finally {
      setIsScanning(false)
    }
  }

  const handleCleanDuplicates = async () => {
    const isConfirmed = await confirm({
      title: "Clean Duplicate Bookmarks?",
      description:
        "This will automatically remove duplicate bookmark instances and keep the oldest instance of each URL.",
      actionLabel: "Clean Duplicates",
      variant: "destructive",
    })
    if (!isConfirmed) return

    try {
      await cleanDuplicatesMutation.mutateAsync()
      queryClient.invalidateQueries({ queryKey: ["/v1/bookmarks"] })
      queryClient.invalidateQueries({ queryKey: ["infinite", "/v1/bookmarks"] })
      refetchDuplicates()
      toast.success("Duplicate bookmarks successfully cleaned")
    } catch {
      toast.error("Failed to clean duplicates")
    }
  }

  const handleEmptyTrash = async () => {
    const isConfirmed = await confirm({
      title: "Empty Trash?",
      description:
        "This will permanently delete all bookmarks currently in the Trash. This action cannot be undone.",
      actionLabel: "Empty Trash",
      variant: "destructive",
    })
    if (!isConfirmed) return

    setIsEmptyingTrash(true)
    try {
      await AXIOS_INSTANCE.delete("/v1/bookmarks/trash/empty")
      queryClient.invalidateQueries({ queryKey: ["/v1/bookmarks"] })
      queryClient.invalidateQueries({ queryKey: ["infinite", "/v1/bookmarks"] })
      refetchHealth()
      toast.success("Trash emptied permanently")
    } catch {
      toast.error("Failed to empty trash")
    } finally {
      setIsEmptyingTrash(false)
    }
  }

  const handleLinkSocial = async (provider: "github" | "google") => {
    try {
      const { error } = await authClient.linkSocial({
        provider,
        callbackURL: `${window.location.origin}/cabinet/settings`,
        errorCallbackURL: `${window.location.origin}/cabinet/settings?error=link_failed`,
      })
      if (error) throw new Error(error.message || "Failed to link account")
    } catch (err: any) {
      toast.error(err.message || "Failed to link account")
    }
  }

  const handleLogout = async () => {
    try {
      const { error } = await authClient.signOut()
      if (error) throw new Error(error.message || "Sign-out failed")
      queryClient.clear()
      router.replace("/login")
    } catch {
      toast.error("Sign out failed. Try again.")
    }
  }

  return (
    <div className="mx-auto flex min-h-[100dvh] max-w-5xl flex-col bg-background px-4 py-6 sm:px-8 sm:py-10">
      {/* Top Header */}
      <div className="flex flex-col gap-4 border-b border-border pb-6 sm:pb-8">
        <Link
          href="/cabinet"
          className="group inline-flex w-fit items-center gap-2 font-mono text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-3.5 transition-transform group-hover:-translate-x-0.5" />
          <span>Back to Cabinet</span>
        </Link>
        <div className="flex flex-col gap-1">
          <h1 className="font-serif text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
            Settings
          </h1>
          <p className="text-xs text-muted-foreground sm:text-sm">
            Manage your display preferences, account connections, data portability, and library maintenance.
          </p>
        </div>
      </div>

      {/* Settings Tabs */}
      <Tabs defaultValue="appearance" className="mt-6 flex-1 sm:mt-8">
        <TabsList className="mb-6 flex w-full flex-wrap justify-start gap-1 rounded-none border-b border-border bg-transparent p-0">
          <TabsTrigger
            value="appearance"
            className="flex items-center gap-2 rounded-none border-b-2 border-transparent px-3 py-2 text-xs font-medium data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:text-foreground"
          >
            <PaintBrush className="size-4" />
            <span>Appearance</span>
          </TabsTrigger>
          <TabsTrigger
            value="account"
            className="flex items-center gap-2 rounded-none border-b-2 border-transparent px-3 py-2 text-xs font-medium data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:text-foreground"
          >
            <User className="size-4" />
            <span>Account</span>
          </TabsTrigger>
          <TabsTrigger
            value="data"
            className="flex items-center gap-2 rounded-none border-b-2 border-transparent px-3 py-2 text-xs font-medium data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:text-foreground"
          >
            <Database className="size-4" />
            <span>Data & Export</span>
          </TabsTrigger>
          <TabsTrigger
            value="maintenance"
            className="flex items-center gap-2 rounded-none border-b-2 border-transparent px-3 py-2 text-xs font-medium data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:text-foreground"
          >
            <Wrench className="size-4" />
            <span>Maintenance</span>
          </TabsTrigger>
          <TabsTrigger
            value="shortcuts"
            className="flex items-center gap-2 rounded-none border-b-2 border-transparent px-3 py-2 text-xs font-medium data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:text-foreground"
          >
            <Keyboard className="size-4" />
            <span>Shortcuts</span>
          </TabsTrigger>
        </TabsList>

        {/* 1. Appearance Tab */}
        <TabsContent value="appearance" className="space-y-6 focus-visible:outline-none">
          {/* Theme Selector */}
          <Card className="rounded-none border border-border bg-card p-5">
            <div className="flex flex-col gap-1">
              <h2 className="text-sm font-semibold text-foreground">Theme & Atmosphere</h2>
              <p className="text-xs text-muted-foreground">
                Choose how Cabinet looks in your browser or match your operating system theme.
              </p>
            </div>
            <div className="mt-4 flex flex-wrap gap-2.5">
              {[
                { value: "light", label: "Light", icon: Sun },
                { value: "dark", label: "Dark", icon: Moon },
                { value: "system", label: "System", icon: Desktop },
              ].map(({ value, label, icon: Icon }) => (
                <Button
                  key={value}
                  variant={theme === value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTheme(value)}
                  className="flex items-center gap-2 rounded-none text-xs"
                >
                  <Icon className="size-3.5" />
                  <span>{label}</span>
                </Button>
              ))}
            </div>
          </Card>

          {/* View Mode Default */}
          <Card className="rounded-none border border-border bg-card p-5">
            <div className="flex flex-col gap-1">
              <h2 className="text-sm font-semibold text-foreground">Default View Mode</h2>
              <p className="text-xs text-muted-foreground">
                Select your default visual presentation when opening your Cabinet.
              </p>
            </div>
            <div className="mt-4 flex flex-wrap gap-2.5">
              <Button
                variant={defaultViewMode === "list" ? "default" : "outline"}
                size="sm"
                onClick={() => handleViewModeToggle("list")}
                className="flex items-center gap-2 rounded-none text-xs"
              >
                <List className="size-4" />
                <span>Compact List</span>
              </Button>
              <Button
                variant={defaultViewMode === "moodboard" ? "default" : "outline"}
                size="sm"
                onClick={() => handleViewModeToggle("moodboard")}
                className="flex items-center gap-2 rounded-none text-xs"
              >
                <SquaresFour className="size-4" />
                <span>Moodboard (Masonry)</span>
              </Button>
            </div>

            {defaultViewMode === "moodboard" && (
              <div className="mt-4 border-t border-border pt-4">
                <span className="font-mono text-xs text-muted-foreground uppercase">
                  Default Columns (Desktop)
                </span>
                <div className="mt-2 flex gap-2">
                  {[1, 2, 3, 4].map((cols) => (
                    <Button
                      key={cols}
                      variant={defaultColumns === cols ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleColumnsToggle(cols)}
                      className="size-8 rounded-none p-0 text-xs font-mono"
                    >
                      {cols}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </Card>

          {/* Card Element Visibility */}
          <Card className="rounded-none border border-border bg-card p-5">
            <div className="flex flex-col gap-1">
              <h2 className="text-sm font-semibold text-foreground">Card Detail Elements</h2>
              <p className="text-xs text-muted-foreground">
                Toggle which elements appear on cards in Moodboard view.
              </p>
            </div>
            <div className="mt-4 divide-y divide-border border-t border-border">
              {(
                [
                  ["showImage", "Show Preview / Thumbnail Image", "Display rich OpenGraph preview images when available."],
                  ["showTitle", "Show Title", "Display the extracted or custom title of the bookmark."],
                  ["showDescription", "Show Description", "Display a two-line summary snippet below the title."],
                  ["showWebsite", "Show Website URL / Hostname", "Display the origin website domain in monospace."],
                  ["showFolder", "Show Folder", "Display the folder containing each bookmark."],
                  ["showDate", "Show Date Added", "Display when each bookmark was added to Cabinet."],
                ] as const
              ).map(([key, label, desc]) => (
                <div key={key} className="flex items-center justify-between py-3">
                  <div className="flex flex-col gap-0.5 pr-4">
                    <span className="text-xs font-medium text-foreground">{label}</span>
                    <span className="text-[11px] text-muted-foreground">{desc}</span>
                  </div>
                  <Switch
                    checked={displayPrefs[key]}
                    onCheckedChange={(checked) => handlePrefToggle(key, checked)}
                  />
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        {/* 2. Account Tab */}
        <TabsContent value="account" className="space-y-6 focus-visible:outline-none">
          <Card className="rounded-none border border-border bg-card p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex size-12 items-center justify-center rounded-none border border-border bg-muted font-serif text-lg font-semibold text-foreground">
                  {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "C"}
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-foreground">{user?.name || "Cabinet User"}</span>
                  <span className="font-mono text-xs text-muted-foreground">{user?.email || "No email available"}</span>
                </div>
              </div>
              <Badge variant="outline" className="w-fit font-mono text-[10px]">
                ID: {user?.id?.slice(0, 8)}...
              </Badge>
            </div>
          </Card>

          {/* Connected OAuth Providers */}
          <Card className="rounded-none border border-border bg-card p-5">
            <div className="flex flex-col gap-1">
              <h2 className="text-sm font-semibold text-foreground">Connected Providers</h2>
              <p className="text-xs text-muted-foreground">
                Link additional authentication providers to sign in with GitHub or Google.
              </p>
            </div>
            <div className="mt-4 flex flex-col gap-3">
              <div className="flex items-center justify-between border border-border p-3">
                <div className="flex items-center gap-2.5 text-xs font-medium">
                  <GithubLogo className="size-4" />
                  <span>GitHub</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleLinkSocial("github")}
                  className="rounded-none text-xs"
                >
                  Link GitHub
                </Button>
              </div>

              <div className="flex items-center justify-between border border-border p-3">
                <div className="flex items-center gap-2.5 text-xs font-medium">
                  <GoogleLogo className="size-4" />
                  <span>Google</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleLinkSocial("google")}
                  className="rounded-none text-xs"
                >
                  Link Google
                </Button>
              </div>
            </div>
          </Card>

          {/* Session Actions */}
          <Card className="rounded-none border border-destructive/20 bg-destructive/5 p-5">
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <h2 className="text-sm font-semibold text-destructive">Sign Out of Session</h2>
                <p className="text-xs text-muted-foreground">
                  Disconnect your current browser session from Cabinet.
                </p>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleLogout}
                className="rounded-none text-xs"
              >
                <SignOut className="size-3.5" />
                <span>Sign Out</span>
              </Button>
            </div>
          </Card>
        </TabsContent>

        {/* 3. Data & Export Tab */}
        <TabsContent value="data" className="space-y-6 focus-visible:outline-none">
          <Card className="rounded-none border border-border bg-card p-5">
            <div className="flex flex-col gap-1">
              <h2 className="text-sm font-semibold text-foreground">Export Your Bookmarks</h2>
              <p className="text-xs text-muted-foreground">
                Download a clean, standard Netscape HTML file containing all your folders and bookmarks.
                Compatible with Chrome, Safari, Firefox, Arc, Brave, and Raindrop.io.
              </p>
            </div>
            <div className="mt-4">
              <Button
                variant="default"
                size="sm"
                disabled={isExporting}
                onClick={handleExport}
                className="flex items-center gap-2 rounded-none text-xs"
              >
                {isExporting ? <Spinner /> : <DownloadSimple className="size-3.5" />}
                <span>{isExporting ? "Generating Export..." : "Download HTML Export (.html)"}</span>
              </Button>
            </div>
          </Card>

          <Card className="rounded-none border border-border bg-card p-5">
            <div className="flex flex-col gap-1">
              <h2 className="text-sm font-semibold text-foreground">Import Bookmarks</h2>
              <p className="text-xs text-muted-foreground">
                Upload a bookmarks export file (`.html`) from any browser or service.
                Folders and links will be automatically mapped and metadata enriched in the background.
              </p>
            </div>
            <div className="mt-4">
              <label>
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  disabled={isImporting}
                  className="cursor-pointer rounded-none text-xs"
                >
                  <span>
                    {isImporting ? <Spinner /> : <UploadSimple className="size-3.5" />}
                    <span>{isImporting ? "Importing..." : "Choose HTML File to Import"}</span>
                  </span>
                </Button>
                <input
                  type="file"
                  accept=".html"
                  onChange={handleImportFile}
                  disabled={isImporting}
                  className="hidden"
                />
              </label>
            </div>
          </Card>
        </TabsContent>

        {/* 4. Maintenance Tab */}
        <TabsContent value="maintenance" className="space-y-6 focus-visible:outline-none">
          {/* Health Scanner */}
          <Card className="rounded-none border border-border bg-card p-5">
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-foreground">Link Health & Status</h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleScanLinks}
                  disabled={isScanning}
                  className="rounded-none text-xs"
                >
                  {isScanning ? <Spinner /> : <ArrowCounterClockwise className="size-3.5" />}
                  <span>{isScanning ? "Scanning..." : "Run Health Scan"}</span>
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Check whether your saved bookmarks are still online, redirected, or broken.
              </p>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="border border-border p-3 text-center">
                <span className="font-mono text-xl font-bold text-foreground">{health?.total || 0}</span>
                <p className="font-mono text-[10px] text-muted-foreground uppercase">Total Links</p>
              </div>
              <div className="border border-border p-3 text-center">
                <span className="font-mono text-xl font-bold text-emerald-600">{health?.ok || 0}</span>
                <p className="font-mono text-[10px] text-muted-foreground uppercase">Healthy Links</p>
              </div>
              <div className="border border-border p-3 text-center">
                <span className="font-mono text-xl font-bold text-blue-600">{health?.redirected || 0}</span>
                <p className="font-mono text-[10px] text-muted-foreground uppercase">Redirected</p>
              </div>
              <div className="border border-border p-3 text-center">
                <span className="font-mono text-xl font-bold text-destructive">{health?.broken || 0}</span>
                <p className="font-mono text-[10px] text-muted-foreground uppercase">Broken</p>
              </div>
            </div>
          </Card>

          {/* Clean Duplicates */}
          <Card className="rounded-none border border-border bg-card p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-semibold text-foreground">Clean Duplicate URLs</h2>
                  {duplicates.length > 0 && (
                    <Badge variant="outline" className="font-mono text-[9px] text-amber-600">
                      {duplicates.length} duplicate groups
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Finds multiple bookmark copies pointing to the identical web address and deletes extras.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCleanDuplicates}
                disabled={duplicates.length === 0}
                className="rounded-none text-xs"
              >
                Clean Duplicates
              </Button>
            </div>
          </Card>

          {/* Empty Trash */}
          <Card className="rounded-none border border-destructive/20 bg-destructive/5 p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-col gap-1">
                <h2 className="text-sm font-semibold text-destructive">Empty Trash Permanently</h2>
                <p className="text-xs text-muted-foreground">
                  Currently {health?.trash || 0} bookmark(s) in the trash.
                </p>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleEmptyTrash}
                disabled={(health?.trash || 0) === 0 || isEmptyingTrash}
                className="rounded-none text-xs"
              >
                <Trash className="size-3.5" />
                <span>Empty Trash</span>
              </Button>
            </div>
          </Card>
        </TabsContent>

        {/* 5. Shortcuts Tab */}
        <TabsContent value="shortcuts" className="space-y-6 focus-visible:outline-none">
          <Card className="rounded-none border border-border bg-card p-5">
            <div className="flex flex-col gap-1">
              <h2 className="text-sm font-semibold text-foreground">Keyboard Shortcuts</h2>
              <p className="text-xs text-muted-foreground">
                Speed up your reading, navigation, and sorting with keyboard shortcuts.
              </p>
            </div>
            <div className="mt-4 divide-y divide-border border-t border-border">
              {[
                { keys: ["/"], label: "Focus Search Bar", desc: "Instantly jump to search query field" },
                { keys: ["N"], label: "Create Note", desc: "Open note editor for a new personal note" },
                { keys: ["B"], label: "Add Bookmark", desc: "Open modal to add a new bookmark" },
                { keys: ["1"], label: "List View", desc: "Switch layout to compact list presentation" },
                { keys: ["2"], label: "Moodboard View", desc: "Switch layout to visual masonry grid" },
                { keys: ["⌘B"], label: "Toggle Sidebar", desc: "Collapse or expand left navigation panel" },
                { keys: ["⌘K"], label: "Command Menu", desc: "Open command palette and global search" },
                { keys: ["Space", "Enter"], label: "Pick up / Drop Sortable Item", desc: "Keyboard drag-and-drop sorting" },
                { keys: ["Arrow Keys"], label: "Reorder / Move Item", desc: "Move active sortable item in 4 directions" },
                { keys: ["Esc"], label: "Cancel Drag / Close Dialog", desc: "Dismiss active operations safely" },
                { keys: ["Shift + Click"], label: "Select Multiple Bookmarks", desc: "Activate bulk action bar" },
              ].map(({ keys, label, desc }, idx) => (
                <div key={idx} className="flex items-center justify-between py-3">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-medium text-foreground">{label}</span>
                    <span className="text-[11px] text-muted-foreground">{desc}</span>
                  </div>
                  <div className="flex gap-1">
                    {keys.map((k) => (
                      <kbd
                        key={k}
                        className="rounded-none border border-border bg-muted/60 px-2 py-0.5 font-mono text-[10px] font-semibold text-foreground"
                      >
                        {k}
                      </kbd>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="rounded-none border border-border bg-card p-5">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="font-serif text-lg font-medium tracking-tight text-foreground">Cabinet</span>
                <Badge variant="outline" className="font-mono text-[9px]">v1.0</Badge>
              </div>
              <p className="font-serif text-xs italic text-muted-foreground">
                "A personal place for what you want to keep."
              </p>
              <p className="text-xs text-muted-foreground">
                Designed for calm, focused reading and durable bookmark organization.
              </p>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
