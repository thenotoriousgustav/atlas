"use client"

import React, { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"
import { useForm } from "@tanstack/react-form"
import * as z from "zod"
import {
  useAuthControllerMe,
  useAuthControllerLogout,
  useFoldersControllerFindAll,
  useFoldersControllerCreate,
  useFoldersControllerUpdate,
  useFoldersControllerRemove,
  useBookmarksControllerFindAllInfinite,
  useBookmarksControllerCreate,
  useBookmarksControllerUpdate,
  useBookmarksControllerRemove,
  useTagsControllerFindAll,
  useTagsControllerRemove,
  useBookmarksControllerImport,
  useBookmarksControllerGetHealthSummary,
  useBookmarksControllerGetDuplicates,
  useBookmarksControllerCleanDuplicates,
  useBookmarksControllerTriggerHealthCheck,
  useBookmarksControllerReorder,
  AXIOS_INSTANCE,
} from "@atlas/api-client"
import { useAuthStore } from "@/store/useAuthStore"
import { useConfirm } from "@atlas/ui/hooks/use-confirm"
import { toast } from "sonner"
import { WorkspaceHeader } from "@/components/workspace-header"
import { ModuleContainer } from "@/components/module-container"
import { CabinetSidebarFilters } from "./components/cabinet-sidebar-filters"
import { Toolbar } from "./components/toolbar"
import { BookmarkList } from "./components/bookmark-list"
import { Archive, Trash } from "@phosphor-icons/react"
import { Button } from "@atlas/ui/components/button"
import { Spinner } from "@atlas/ui/components/spinner"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@atlas/ui/components/select"
import {
  ActionBar,
  ActionBarSelection,
  ActionBarGroup,
  ActionBarItem,
  ActionBarSeparator,
} from "@atlas/ui/components/action-bar"

const folderSchema = z.object({
  name: z.string().min(1, "Folder name is required").max(50, "Folder name must be at most 50 characters"),
  description: z.string(),
  parentId: z.string(),
})

const bookmarkSchema = z.object({
  url: z.string().min(1, "URL is required"),
  title: z.string(),
  description: z.string(),
  folderId: z.string(),
  tags: z.array(z.string()),
})

export const dynamic = "force-dynamic"

export function CabinetDashboard() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { user, setUser, logout } = useAuthStore()
  const confirm = useConfirm()
  const [isLoading, setIsLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  // Filters & State
  const [selectedFolderId, setSelectedFolderId] = useState<string | undefined>(
    undefined
  )
  const [filterFavorite, setFilterFavorite] = useState<boolean | undefined>(
    undefined
  )
  const [filterArchived, setFilterArchived] = useState<boolean | undefined>(
    false
  ) // default active only
  const [selectedTag, setSelectedTag] = useState<string | undefined>(undefined)
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [searchDebounced, setSearchDebounced] = useState<string>("")
  const [viewMode, setViewMode] = useState<"list" | "moodboard">("list")
  const [selectedBookmarkIds, setSelectedBookmarkIds] = useState<string[]>([])
  const [filterBroken, setFilterBroken] = useState<boolean | undefined>(
    undefined
  )
  const [filterDuplicates, setFilterDuplicates] = useState<boolean | undefined>(
    undefined
  )
  const [columnCount, setColumnCount] = useState<number>(3)

  // Load viewMode and columnCount from localStorage on mount
  useEffect(() => {
    const savedMode = localStorage.getItem("cabinet_view_mode")
    if (savedMode === "list" || savedMode === "moodboard") {
      setViewMode(savedMode as any)
    }
    const savedCols = localStorage.getItem("cabinet_column_count")
    if (savedCols) {
      const parsed = parseInt(savedCols, 10)
      if ([1, 2, 3, 4].includes(parsed)) {
        setColumnCount(parsed)
      }
    }
  }, [])

  const handleViewModeChange = (mode: "list" | "moodboard") => {
    setViewMode(mode)
    localStorage.setItem("cabinet_view_mode", mode)
  }

  const handleColumnCountChange = (count: number) => {
    setColumnCount(count)
    localStorage.setItem("cabinet_column_count", count.toString())
  }

  const invalidateAllQueries = () => {
    queryClient.invalidateQueries({ queryKey: ["/v1/bookmarks"] })
    queryClient.invalidateQueries({ queryKey: ["infinite", "/v1/bookmarks"] })
    queryClient.invalidateQueries({ queryKey: ["/v1/bookmarks/health"] })
    queryClient.invalidateQueries({ queryKey: ["/v1/bookmarks/duplicates"] })
    queryClient.invalidateQueries({ queryKey: ["/v1/folders"] })
    queryClient.invalidateQueries({ queryKey: ["/v1/tags"] })
  }

  // Modals state
  const [isBookmarkModalOpen, setIsBookmarkModalOpen] = useState(false)
  const [bookmarkToEdit, setBookmarkToEdit] = useState<any | null>(null)

  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false)
  const [folderToEdit, setFolderToEdit] = useState<any | null>(null)

  // TanStack Forms
  const folderForm = useForm({
    defaultValues: {
      name: "",
      description: "",
      parentId: "",
    },
    validators: {
      onSubmit: folderSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        if (folderToEdit) {
          await updateFolderMutation.mutateAsync({
            id: folderToEdit.id,
            data: {
              name: value.name,
              description: value.description || undefined,
              parentId: value.parentId || undefined,
            },
          })
        } else {
          await createFolderMutation.mutateAsync({
            data: {
              name: value.name,
              description: value.description || undefined,
              parentId: value.parentId || undefined,
            },
          })
        }
        invalidateAllQueries()
        setIsFolderModalOpen(false)
        resetFolderForm()
      } catch {
        toast.error("Failed to save folder")
      }
    },
  })

  const bookmarkForm = useForm({
    defaultValues: {
      url: "",
      title: "",
      description: "",
      folderId: "",
      tags: [] as string[],
    },
    validators: {
      onSubmit: bookmarkSchema,
    },
    onSubmit: async ({ value }) => {
      const tagsArray = (value.tags || [])
        .map((t) => t.replace(/^#/, "").trim())
        .filter((t) => t.length > 0)

      let targetUrl = value.url.trim()
      if (!/^https?:\/\//i.test(targetUrl)) {
        targetUrl = "https://" + targetUrl
      }

      try {
        if (bookmarkToEdit) {
          await updateBookmarkMutation.mutateAsync({
            id: bookmarkToEdit.id,
            data: {
              url: targetUrl,
              title: value.title || undefined,
              description: value.description || undefined,
              folderId: value.folderId || undefined,
              tags: tagsArray,
            },
          })
        } else {
          await createBookmarkMutation.mutateAsync({
            data: {
              url: targetUrl,
              title: value.title || undefined,
              description: value.description || undefined,
              folderId: value.folderId || undefined,
              tags: tagsArray,
            },
          })
        }
        invalidateAllQueries()
        setIsBookmarkModalOpen(false)
        resetBookmarkForm()
      } catch {
        toast.error("Failed to save bookmark")
      }
    },
  })

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setSearchDebounced(searchQuery)
    }, 300)
    return () => clearTimeout(handler)
  }, [searchQuery])

  const { data: meData, isLoading: isMeLoading } = useAuthControllerMe({
    query: {
      retry: false,
      enabled: true,
    },
  })

  // Fetch Folders, Bookmarks, Tags
  const { data: foldersData } = useFoldersControllerFindAll()
  const folders = (foldersData as any)?.data || []

  const { data: tagsData } = useTagsControllerFindAll()
  const tags = (tagsData as any)?.data || []

  const {
    data: bookmarksInfiniteData,
    isLoading: isBookmarksLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useBookmarksControllerFindAllInfinite(
    {
      folderId: selectedFolderId,
      isFavorite: filterFavorite,
      isArchived: filterArchived,
      tag: selectedTag,
      search: searchDebounced || undefined,
      limit: 20,
      status: filterBroken ? "BROKEN" : undefined,
    },
    {
      query: {
        initialPageParam: undefined,
        getNextPageParam: (lastPage: any) =>
          lastPage?.data?.nextCursor || undefined,
      },
    }
  )
  const rawBookmarks =
    bookmarksInfiniteData?.pages.flatMap(
      (page: any) => page?.data?.data || []
    ) || []
  const bookmarks = Array.from(
    new Map(rawBookmarks.map((b: any) => [b.id, b])).values()
  )

  const [optimisticOrder, setOptimisticOrder] = React.useState<string[] | null>(
    null
  )

  // Reset optimistic order when query data updates
  React.useEffect(() => {
    setOptimisticOrder(null)
  }, [bookmarksInfiniteData])

  const reorderMutation = useBookmarksControllerReorder()

  const handleReorder = React.useCallback(
    (newOrder: any[]) => {
      const newIds = newOrder.map((b: any) => b.id)
      setOptimisticOrder(newIds)
      reorderMutation.mutate(
        { data: { ids: newIds } },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({
              queryKey: ["infinite", "/v1/bookmarks"],
            })
            queryClient.invalidateQueries({ queryKey: ["/v1/bookmarks"] })
          },
          onError: () => {
            setOptimisticOrder(null)
            toast.error("Failed to save bookmark order")
          },
        }
      )
    },
    [reorderMutation, queryClient]
  )

  const filteredBookmarks = React.useMemo(() => {
    if (!optimisticOrder || optimisticOrder.length === 0) return bookmarks
    const itemMap = new Map(bookmarks.map((b: any) => [b.id, b]))
    const ordered: any[] = []
    optimisticOrder.forEach((id) => {
      if (itemMap.has(id)) {
        ordered.push(itemMap.get(id))
        itemMap.delete(id)
      }
    })
    itemMap.forEach((item) => ordered.push(item))
    return ordered
  }, [bookmarks, optimisticOrder])

  // Health and Duplicates Queries
  const { data: healthSummaryData } = useBookmarksControllerGetHealthSummary()
  const healthSummary = (healthSummaryData as any)?.data || healthSummaryData

  const { data: duplicatesData, refetch: refetchDuplicates } =
    useBookmarksControllerGetDuplicates({
      query: { enabled: !!filterDuplicates },
    })
  const duplicateGroups = (duplicatesData as any)?.data || duplicatesData || []

  // Mutations
  const createFolderMutation = useFoldersControllerCreate()
  const updateFolderMutation = useFoldersControllerUpdate()
  const removeFolderMutation = useFoldersControllerRemove()

  const createBookmarkMutation = useBookmarksControllerCreate()
  const updateBookmarkMutation = useBookmarksControllerUpdate()
  const removeBookmarkMutation = useBookmarksControllerRemove()
  const removeTagMutation = useTagsControllerRemove()
  const importBookmarksMutation = useBookmarksControllerImport()

  const scanHealthMutation = useBookmarksControllerTriggerHealthCheck()
  const cleanDuplicatesMutation = useBookmarksControllerCleanDuplicates()

  // Sync mount status
  useEffect(() => {
    setMounted(true)
  }, [])

  // Sync backend session into Zustand store
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

  // Handle logout mutation
  const logoutMutation = useAuthControllerLogout()

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync()
      logout()
      router.push("/login")
    } catch {
      logout()
      router.push("/login")
    }
  }

  const handleEditFolder = (folder: any) => {
    setFolderToEdit(folder)
    folderForm.setFieldValue("name", folder.name)
    folderForm.setFieldValue("description", folder.description || "")
    folderForm.setFieldValue("parentId", folder.parentId || "")
    setIsFolderModalOpen(true)
  }

  const handleDeleteFolder = async (id: string) => {
    const isConfirmed = await confirm({
      title: "Delete Folder",
      description:
        "Are you sure you want to delete this folder? All subfolders and bookmarks inside it will be soft-deleted.",
      actionLabel: "Delete",
      variant: "destructive",
    })
    if (isConfirmed) {
      try {
        await removeFolderMutation.mutateAsync({ id })
        invalidateAllQueries()
        if (selectedFolderId === id) {
          setSelectedFolderId(undefined)
        }
      } catch {
        toast.error("Failed to delete folder")
      }
    }
  }

  const handleCreateSubfolder = (parentId: string) => {
    setFolderToEdit(null)
    folderForm.reset()
    folderForm.setFieldValue("parentId", parentId)
    setIsFolderModalOpen(true)
  }

  const handleScan = async () => {
    try {
      await scanHealthMutation.mutateAsync()
      invalidateAllQueries()
      toast.success("Link status check started in the background!")
    } catch {
      toast.error("Failed to start link status scan.")
    }
  }

  const handleCleanDuplicates = async () => {
    const confirmed = await confirm({
      title: "Clean Duplicate Bookmarks?",
      description:
        "This will automatically delete duplicate bookmark copies and keep the single oldest instance per URL.",
    })
    if (confirmed) {
      try {
        await cleanDuplicatesMutation.mutateAsync()
        invalidateAllQueries()
        toast.success("Duplicate bookmarks successfully cleaned!")
      } catch {
        toast.error("Failed to clean duplicate bookmarks.")
      }
    }
  }

  const resetFolderForm = () => {
    setFolderToEdit(null)
    folderForm.reset()
  }

  const handleEditBookmark = (bookmark: any) => {
    setBookmarkToEdit(bookmark)
    bookmarkForm.setFieldValue("url", bookmark.url)
    bookmarkForm.setFieldValue("title", bookmark.title || "")
    bookmarkForm.setFieldValue("description", bookmark.description || "")
    bookmarkForm.setFieldValue("folderId", bookmark.folderId || "")
    bookmarkForm.setFieldValue(
      "tags",
      bookmark.tags?.map((t: any) => `#${t.name}`) || []
    )
    setIsBookmarkModalOpen(true)
  }

  const handleDeleteBookmark = async (id: string) => {
    const isConfirmed = await confirm({
      title: "Delete Bookmark",
      description: "Are you sure you want to delete this bookmark?",
      actionLabel: "Delete",
      variant: "destructive",
    })
    if (isConfirmed) {
      try {
        await removeBookmarkMutation.mutateAsync({ id })
        invalidateAllQueries()
      } catch {
        toast.error("Failed to delete bookmark")
      }
    }
  }

  const handleDeleteTag = async (id: string) => {
    try {
      await removeTagMutation.mutateAsync({ id })
      invalidateAllQueries()
      const tagToDelete = tags.find((t: any) => t.id === id)
      if (tagToDelete && selectedTag === tagToDelete.name) {
        setSelectedTag(undefined)
      }
    } catch {
      toast.error("Failed to delete tag")
    }
  }

  const toggleFavorite = async (bookmark: any) => {
    try {
      await updateBookmarkMutation.mutateAsync({
        id: bookmark.id,
        data: {
          isFavorite: !bookmark.isFavorite,
        },
      })
      invalidateAllQueries()
    } catch {
      toast.error("Failed to update favorite status")
    }
  }

  const toggleArchive = async (bookmark: any) => {
    try {
      await updateBookmarkMutation.mutateAsync({
        id: bookmark.id,
        data: {
          isArchived: !bookmark.isArchived,
        },
      })
      invalidateAllQueries()
    } catch {
      toast.error("Failed to update archive status")
    }
  }

  const handleDuplicateBookmark = async (bookmark: any) => {
    try {
      await createBookmarkMutation.mutateAsync({
        data: {
          url: bookmark.url,
          title: bookmark.title ? `${bookmark.title} (Copy)` : undefined,
          description: bookmark.description || undefined,
          folderId: bookmark.folderId || undefined,
          tags: bookmark.tags?.map((t: any) => t.name) || [],
        },
      })
      invalidateAllQueries()
    } catch {
      toast.error("Failed to duplicate bookmark")
    }
  }

  const resetBookmarkForm = () => {
    setBookmarkToEdit(null)
    bookmarkForm.reset()
  }

  const handleToggleSelectBookmark = (id: string) => {
    setSelectedBookmarkIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const handleClearSelection = () => {
    setSelectedBookmarkIds([])
  }

  const handleSelectAll = async () => {
    const isAllSelected =
      !hasNextPage &&
      filteredBookmarks.length > 0 &&
      filteredBookmarks.every((b: any) => selectedBookmarkIds.includes(b.id))

    if (isAllSelected) {
      setSelectedBookmarkIds([])
      return
    }

    let currentBookmarks = filteredBookmarks

    if (hasNextPage) {
      const toastId = toast.loading("Loading all bookmarks...")
      try {
        let result = await fetchNextPage()
        while (result.hasNextPage) {
          result = await result.fetchNextPage()
        }
        const allPages = result.data?.pages || []
        const loadedBookmarks = Array.from(
          new Map(
            allPages
              .flatMap((page: any) => page?.data?.data || [])
              .map((b: any) => [b.id, b])
          ).values()
        )
        currentBookmarks = loadedBookmarks
        toast.dismiss(toastId)
      } catch {
        toast.error("Failed to load all bookmarks", { id: toastId })
      }
    }

    const allIds = currentBookmarks.map((b: any) => b.id)
    setSelectedBookmarkIds(allIds)
  }

  const handleBulkDelete = async () => {
    const isConfirmed = await confirm({
      title: "Delete Selected Bookmarks",
      description: `Are you sure you want to delete ${selectedBookmarkIds.length} selected bookmarks?`,
      actionLabel: "Delete",
      variant: "destructive",
    })
    if (!isConfirmed) return
    try {
      await Promise.all(
        selectedBookmarkIds.map((id) =>
          removeBookmarkMutation.mutateAsync({ id })
        )
      )
      invalidateAllQueries()
      setSelectedBookmarkIds([])
    } catch {
      toast.error("Failed to delete some bookmarks")
    }
  }

  const handleBulkArchive = async () => {
    try {
      await Promise.all(
        selectedBookmarkIds.map((id) =>
          updateBookmarkMutation.mutateAsync({
            id,
            data: { isArchived: true },
          })
        )
      )
      invalidateAllQueries()
      setSelectedBookmarkIds([])
    } catch {
      toast.error("Failed to archive some bookmarks")
    }
  }

  const handleBulkMove = async (folderId: string | null) => {
    try {
      await Promise.all(
        selectedBookmarkIds.map((id) =>
          updateBookmarkMutation.mutateAsync({
            id,
            data: { folderId: folderId || undefined },
          })
        )
      )
      invalidateAllQueries()
      setSelectedBookmarkIds([])
    } catch {
      toast.error("Failed to move some bookmarks")
    }
  }

  // Import / Export handlers
  const handleExport = async (format: "html" | "csv" | "txt" | "zip") => {
    try {
      if (format === "html") {
        const res = await AXIOS_INSTANCE.get("/v1/bookmarks/export", {
          responseType: "blob",
        })
        const blob = new Blob([res.data], { type: "text/html" })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = "cabinet_bookmarks.html"
        document.body.appendChild(a)
        a.click()
        a.remove()
        window.URL.revokeObjectURL(url)
        toast.success("Bookmarks exported as HTML!")
        return
      }

      if (filteredBookmarks.length === 0) {
        toast.error("No bookmarks available to export.")
        return
      }

      if (format === "csv") {
        const headers = [
          "ID",
          "Title",
          "URL",
          "Description",
          "Folder",
          "Tags",
          "Created At",
        ]
        const rows = filteredBookmarks.map((b: any) => [
          `"${b.id || ""}"`,
          `"${(b.title || "").replace(/"/g, '""')}"`,
          `"${(b.url || "").replace(/"/g, '""')}"`,
          `"${(b.description || "").replace(/"/g, '""')}"`,
          `"${(b.folder?.name || "").replace(/"/g, '""')}"`,
          `"${(b.tags || [])
            .map((t: any) => t.name || t)
            .join(", ")
            .replace(/"/g, '""')}"`,
          `"${b.createdAt || ""}"`,
        ])
        const csvContent = [
          headers.join(","),
          ...rows.map((r) => r.join(",")),
        ].join("\n")
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = "cabinet_bookmarks.csv"
        document.body.appendChild(a)
        a.click()
        a.remove()
        window.URL.revokeObjectURL(url)
        toast.success("Bookmarks exported as CSV!")
        return
      }

      if (format === "txt") {
        const txtLines = filteredBookmarks.map(
          (b: any) => `${b.title || "Untitled"} - ${b.url}`
        )
        const txtContent = txtLines.join("\n")
        const blob = new Blob([txtContent], {
          type: "text/plain;charset=utf-8;",
        })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = "cabinet_bookmarks.txt"
        document.body.appendChild(a)
        a.click()
        a.remove()
        window.URL.revokeObjectURL(url)
        toast.success("Bookmarks exported as TXT!")
        return
      }

      if (format === "zip") {
        const res = await AXIOS_INSTANCE.get("/v1/bookmarks/export", {
          responseType: "blob",
        })
        const blob = new Blob([res.data], { type: "application/zip" })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = "cabinet_bookmarks_archive.zip"
        document.body.appendChild(a)
        a.click()
        a.remove()
        window.URL.revokeObjectURL(url)
        toast.success("Bookmarks exported as ZIP Archive!")
        return
      }
    } catch {
      toast.error(`Failed to export bookmarks as ${format.toUpperCase()}`)
    }
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (evt) => {
      const content = evt.target?.result as string
      try {
        await importBookmarksMutation.mutateAsync({
          data: { htmlContent: content },
        })
        invalidateAllQueries()
        toast.success("Bookmarks imported successfully!")
      } catch {
        toast.error(
          "Failed to import bookmarks. Ensure it is a valid Netscape Bookmark HTML file."
        )
      }
    }
    reader.readAsText(file)
  }

  // Rendering Loader
  if (!mounted || isLoading || !user) {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center space-y-4 bg-brand-canvas p-8 font-mono text-xs text-brand-muted">
        <div className="h-1 w-12 animate-pulse rounded-none bg-[#EAEAEA]" />
        <div className="animate-pulse tracking-widest uppercase">
          Initializing session...
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-brand-canvas">
      {/* Pinned Top Workspace Nav Header */}
      <div className="z-30 shrink-0 bg-brand-canvas pt-6">
        <ModuleContainer>
          <WorkspaceHeader
            moduleName="Cabinet"
            moduleInitial="C"
            user={user}
            onLogout={handleLogout}
          />
        </ModuleContainer>
      </div>

      {/* Main Body Layout Container */}
      <div className="flex-1 overflow-hidden py-6">
        <ModuleContainer className="h-full">
          <div className="grid h-full grid-cols-1 items-start gap-8 md:grid-cols-4">
            {/* Left Pinned Sidebar (1 col) */}
            <aside className="h-full overflow-y-auto pr-2 md:col-span-1">
              <CabinetSidebarFilters
                selectedFolderId={selectedFolderId}
                onSelectFolder={setSelectedFolderId}
                selectedTag={selectedTag}
                onSelectTag={setSelectedTag}
                filterFavorite={filterFavorite}
                onSelectFavorite={setFilterFavorite}
                filterArchived={filterArchived}
                onSelectArchived={setFilterArchived}
                folders={folders}
                tags={tags}
                onDeleteTag={handleDeleteTag}
                isFolderModalOpen={isFolderModalOpen}
                setIsFolderModalOpen={setIsFolderModalOpen}
                folderToEdit={folderToEdit}
                folderForm={folderForm}
                onEditFolder={handleEditFolder}
                onDeleteFolder={handleDeleteFolder}
                onCreateSubfolder={handleCreateSubfolder}
                filterBroken={filterBroken}
                onSelectBroken={(val) => {
                  setFilterBroken(val)
                  if (val) {
                    setSelectedFolderId(undefined)
                    setSelectedTag(undefined)
                    setFilterFavorite(undefined)
                    setFilterArchived(undefined)
                    setFilterDuplicates(undefined)
                  }
                }}
                filterDuplicates={filterDuplicates}
                onSelectDuplicates={(val) => {
                  setFilterDuplicates(val)
                  if (val) {
                    setSelectedFolderId(undefined)
                    setSelectedTag(undefined)
                    setFilterFavorite(undefined)
                    setFilterArchived(undefined)
                    setFilterBroken(undefined)
                  }
                }}
                healthSummary={healthSummary}
                onScan={handleScan}
                onExport={handleExport}
                onImport={handleImport}
                resetFolderForm={resetFolderForm}
              />
            </aside>

            {/* Main Independent Scrollable Content Area (3 cols) */}
            <section className="h-full space-y-6 overflow-y-auto pr-2 md:col-span-3">
              {/* Toolbar (Search & Add) */}
              <Toolbar
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                isBookmarkModalOpen={isBookmarkModalOpen}
                setIsBookmarkModalOpen={setIsBookmarkModalOpen}
                bookmarkToEdit={bookmarkToEdit}
                bookmarkForm={bookmarkForm}
                folders={folders}
                tags={tags}
                resetBookmarkForm={resetBookmarkForm}
                viewMode={viewMode}
                onViewModeChange={handleViewModeChange}
                columnCount={columnCount}
                onColumnCountChange={handleColumnCountChange}
              />

              {/* Bookmarks Grid / List */}
              <BookmarkList
                bookmarks={filteredBookmarks}
                isBookmarksLoading={isBookmarksLoading}
                totalBookmarks={
                  (bookmarksInfiniteData as any)?.pages?.[0]?.data
                    ?.totalCount || 0
                }
                selectedFolderId={selectedFolderId}
                selectedTag={selectedTag}
                filterFavorite={filterFavorite}
                filterArchived={filterArchived}
                folders={folders}
                viewMode={viewMode}
                columnCount={columnCount}
                selectedBookmarkIds={selectedBookmarkIds}
                onToggleSelect={handleToggleSelectBookmark}
                onSelectTag={(tag) => {
                  setSelectedTag(tag)
                  setSelectedFolderId(undefined)
                  setFilterFavorite(undefined)
                  setFilterBroken(undefined)
                  setFilterDuplicates(undefined)
                }}
                onToggleFavorite={toggleFavorite}
                onToggleArchive={toggleArchive}
                onEditBookmark={handleEditBookmark}
                onDeleteBookmark={handleDeleteBookmark}
                onDuplicateBookmark={handleDuplicateBookmark}
                isDuplicatesView={filterDuplicates}
                duplicateGroups={duplicateGroups}
                onCleanDuplicates={handleCleanDuplicates}
                onReorder={handleReorder}
              />

              {/* Load More Button */}
              {!filterDuplicates && hasNextPage && (
                <div className="flex justify-center pt-6 pb-4">
                  <Button
                    onClick={() => fetchNextPage()}
                    disabled={isFetchingNextPage}
                    variant="outline"
                    className="flex h-9 min-w-[140px] items-center justify-center gap-1.5 rounded-none border-brand-border px-6 font-mono text-xs uppercase hover:bg-brand-charcoal/5"
                  >
                    {isFetchingNextPage ? (
                      <>
                        <Spinner className="h-3.5 w-3.5 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      "Load More"
                    )}
                  </Button>
                </div>
              )}
            </section>
          </div>
        </ModuleContainer>
      </div>

      <ActionBar
        open={selectedBookmarkIds.length > 0}
        align="center"
        className="gap-1.5 rounded-none border border-brand-border bg-white p-1.5 shadow-md"
      >
        <ActionBarSelection className="border-none bg-transparent px-2 py-0 font-mono text-[10px] tracking-wider text-brand-muted uppercase">
          {selectedBookmarkIds.length} Selected
        </ActionBarSelection>
        <ActionBarSeparator />
        <ActionBarGroup className="gap-1.5">
          <ActionBarItem
            onClick={handleSelectAll}
            className="h-8 rounded-none border border-brand-border bg-white px-3 text-[10px] font-bold tracking-wider text-brand-charcoal uppercase hover:bg-brand-canvas"
          >
            {!hasNextPage &&
            filteredBookmarks.length > 0 &&
            filteredBookmarks.every((b: any) =>
              selectedBookmarkIds.includes(b.id)
            )
              ? "Deselect All"
              : "Select All"}
          </ActionBarItem>

          <Select
            onValueChange={(folderId) => handleBulkMove(folderId || null)}
          >
            <SelectTrigger className="h-8 w-auto gap-1 rounded-none border-brand-border bg-white font-mono text-[10px] font-bold text-brand-charcoal uppercase focus-visible:ring-1 focus-visible:ring-brand-charcoal/30 focus-visible:outline-none">
              <SelectValue placeholder="Move to folder..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Root (No Folder)</SelectItem>
              {folders.map((f: any) => (
                <SelectItem key={f.id} value={f.id}>
                  {f.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <ActionBarItem
            onClick={handleBulkArchive}
            className="h-8 rounded-none border border-brand-border bg-white px-3 text-[10px] font-bold tracking-wider text-brand-charcoal uppercase hover:bg-brand-canvas"
          >
            <Archive className="mr-1 h-3.5 w-3.5" />
            Archive
          </ActionBarItem>

          <ActionBarItem
            onClick={handleBulkDelete}
            className="bg-brand-red-bg text-brand-red-text border-brand-red-text/20 h-8 rounded-none border px-3 text-[10px] font-bold tracking-wider uppercase hover:bg-[#fff0f2]"
          >
            <Trash className="mr-1 h-3.5 w-3.5" />
            Delete
          </ActionBarItem>

          <ActionBarSeparator />

          <Button
            variant="ghost"
            size="xs"
            onClick={handleClearSelection}
            className="h-8 rounded-none px-2.5 font-mono text-[10px] font-bold text-brand-muted uppercase hover:text-brand-charcoal"
          >
            Cancel
          </Button>
        </ActionBarGroup>
      </ActionBar>
    </div>
  )
}
