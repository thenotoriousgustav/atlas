"use client"

import React, { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"
import { useForm } from "@tanstack/react-form"
import * as z from "zod"
import {
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
} from "@/lib/api-client"
import { authClient } from "@/lib/auth-client"
import { useConfirm } from "@/hooks/use-confirm"
import { toast } from "@/components/ui/sonner"
import { cn } from "@/lib/utils"
import { WorkspaceHeader } from "@/components/workspace-header"
import { CabinetContainer } from "@/components/cabinet-container"
import { CabinetSidebarFilters } from "./components/cabinet-sidebar-filters"
import { Toolbar } from "./components/toolbar"
import { ShareFolderDialog } from "./components/share-folder-dialog"
import { BookmarkList } from "./components/bookmark-list"
import { Sortable } from "@/components/ui/sortable"
import { bookmarkCollisionDetection, masonrySortingStrategy } from "@/lib/bookmark-sortable"
import { Archive, Trash, ArrowCounterClockwise } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import {
  ActionBar,
  ActionBarSelection,
  ActionBarGroup,
  ActionBarItem,
  ActionBarSeparator,
} from "@/components/ui/action-bar"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer"
import { MobileBottomNav, type MobileTab } from "./components/mobile-bottom-nav"
import { MobileAddBookmarkDrawer } from "./components/mobile-add-bookmark-drawer"
import { DownloadMediaDialog } from "./components/download-media-dialog"
import { CommandMenu } from "./components/command-menu"
import {
  defaultDisplayPreferences,
  type DisplayPreferences,
} from "./components/display-preferences"
import { useCabinetFilters } from "./hooks/use-cabinet-filters"
import { useBookmarkMutations } from "./hooks/use-bookmark-mutations"
import { useClipboardPaste } from "./hooks/use-clipboard-paste"

const folderSchema = z.object({
  name: z
    .string()
    .min(1, "Folder name is required")
    .max(50, "Folder name must be at most 50 characters"),
  description: z.string(),
  parentId: z.string(),
})

const bookmarkSchema = z.object({
  url: z.string(),
  title: z.string(),
  description: z.string(),
  folderId: z.string(),
  tags: z.array(z.string()),
})

export const dynamic = "force-dynamic"

export function CabinetDashboard() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { data: session, isPending: isMeLoading } = authClient.useSession()
  const user = session?.user
  const confirm = useConfirm()
  const [isLoading, setIsLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  // Fetch Folders & Tags early
  const { data: foldersData } = useFoldersControllerFindAll({
    query: { enabled: !isMeLoading && !!user },
  })
  const folders = (foldersData as any)?.data || []

  const { data: tagsData } = useTagsControllerFindAll({
    query: { enabled: !isMeLoading && !!user },
  })
  const tags = (tagsData as any)?.data || []

  // Modular filters & preferences
  const {
    selectedFolderId,
    setSelectedFolderId,
    filterFavorite,
    setFilterFavorite,
    filterArchived,
    setFilterArchived,
    selectedTag,
    setSelectedTag,
    searchQuery,
    setSearchQuery,
    searchDebounced,
    viewMode,
    handleViewModeChange,
    sort,
    handleSortChange,
    filterBroken,
    setFilterBroken,
    filterDuplicates,
    setFilterDuplicates,
    filterTrash,
    setFilterTrash,
    columnCount,
    handleColumnCountChange,
    displayPreferences,
    handleDisplayPreferencesChange,
    mobileDrawerMode,
    setMobileDrawerMode,
    filterType,
    setFilterType,
    filterContentType,
    setFilterContentType,
    activeMobileTab,
    handleSelectMobileTab: rawHandleSelectMobileTab,
    activeFilterLabel,
  } = useCabinetFilters(folders)

  const selectedFolder = folders.find(
    (folder: any) => folder.id === selectedFolderId
  )

  const [selectedBookmarkIds, setSelectedBookmarkIds] = useState<string[]>([])
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [isMobileAddOpen, setIsMobileAddOpen] = useState(false)
  const [downloadBookmark, setDownloadBookmark] = useState<any | null>(null)
  const [isCommandMenuOpen, setIsCommandMenuOpen] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem("cabinet_sidebar_collapsed")
    if (saved === "true") setIsSidebarCollapsed(true)
  }, [])

  const toggleSidebar = React.useCallback(() => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev
      try {
        localStorage.setItem("cabinet_sidebar_collapsed", String(next))
      } catch {}
      return next
    })
  }, [])

  const handleSelectMobileTab = (tab: MobileTab) => {
    rawHandleSelectMobileTab(tab, () => {
      resetBookmarkForm()
      setIsMobileAddOpen(true)
    })
  }

  const invalidateAllQueries = React.useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["/v1/bookmarks"] })
    queryClient.invalidateQueries({ queryKey: ["infinite", "/v1/bookmarks"] })
    queryClient.invalidateQueries({ queryKey: ["/v1/bookmarks/health"] })
    queryClient.invalidateQueries({ queryKey: ["/v1/bookmarks/duplicates"] })
    queryClient.invalidateQueries({ queryKey: ["/v1/folders"] })
    queryClient.invalidateQueries({ queryKey: ["/v1/tags"] })
  }, [queryClient])

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

      let targetUrl: string | undefined = undefined
      if (value.url?.trim()) {
        targetUrl = value.url.trim()
        if (!/^https?:\/\//i.test(targetUrl)) {
          targetUrl = "https://" + targetUrl
        }
      }

      const toastId = toast.loading(
        bookmarkToEdit ? "Updating bookmark..." : "Saving bookmark..."
      )
      try {
        if (bookmarkToEdit) {
          await updateBookmarkMutation.mutateAsync({
            id: bookmarkToEdit.id,
            data: {
              type: "BOOKMARK" as any,
              url: targetUrl,
              title: value.title || undefined,
              description: value.description || undefined,
              folderId: value.folderId || undefined,
              tags: tagsArray,
            },
          })
          toast.success("Bookmark updated", {
            id: toastId,
          })
        } else {
          await createBookmarkMutation.mutateAsync({
            data: {
              type: "BOOKMARK" as any,
              url: targetUrl,
              title: value.title || undefined,
              description: value.description || undefined,
              folderId: value.folderId || undefined,
              tags: tagsArray,
            },
          })
          toast.success("Bookmark saved", {
            id: toastId,
          })
        }
        invalidateAllQueries()
        setIsBookmarkModalOpen(false)
        resetBookmarkForm()
      } catch {
        toast.error("Failed to save item", { id: toastId })
      }
    },
  })

  const {
    data: bookmarksInfiniteData,
    isLoading: isBookmarksLoading,
    isError: isBookmarksError,
    refetch: refetchBookmarks,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isFetching: isFetchingBookmarks,
    isFetchNextPageError,
  } = useBookmarksControllerFindAllInfinite(
    {
      folderId: filterTrash ? undefined : selectedFolderId,
      isFavorite: filterTrash ? undefined : filterFavorite,
      isArchived: filterTrash ? undefined : filterArchived,
      isTrash: filterTrash,
      tag: filterTrash ? undefined : selectedTag,
      type: filterTrash ? undefined : filterType,
      contentType: filterTrash ? undefined : (filterContentType as any),
      search: searchDebounced || undefined,
      limit: 20,
      sort,
      status: filterBroken ? "BROKEN" : undefined,
    } as any,
    {
      query: {
        enabled: !isMeLoading && !!user,
        initialPageParam: undefined,
        getNextPageParam: (lastPage: any) =>
          lastPage?.data?.nextCursor || undefined,
      },
    }
  )
  const bookmarkScrollRef = React.useRef<HTMLElement>(null)
  const loadMoreRef = React.useRef<HTMLDivElement>(null)
  React.useEffect(() => {
    const root = bookmarkScrollRef.current
    const target = loadMoreRef.current
    if (!root || !target || filterDuplicates || !hasNextPage || isFetchingBookmarks || isFetchNextPageError) return

    let active = true
    const observer = new IntersectionObserver((entries) => {
      if (active && entries.some((entry) => entry.isIntersecting)) {
        active = false
        observer.disconnect()
        void fetchNextPage({ cancelRefetch: false })
      }
    }, { root, rootMargin: "0px 0px 300px 0px" })
    observer.observe(target)
    return () => {
      active = false
      observer.disconnect()
    }
  }, [mounted, isLoading, user, filterDuplicates, hasNextPage, isFetchingBookmarks, isFetchNextPageError, fetchNextPage, bookmarksInfiniteData])

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

  const reorderMutation = useBookmarksControllerReorder({
    mutation: { scope: { id: "bookmark-order" } },
  })

  const handleReorder = React.useCallback(
    (newOrder: any[]) => {
      if (sort !== "custom" || filterTrash) return
      const newIds = newOrder.filter((b) => !b.isPinned).map((b) => b.id)
      setOptimisticOrder(newOrder.map((b) => b.id))
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
    [reorderMutation, queryClient, sort, filterTrash]
  )

  const filteredBookmarks = React.useMemo(() => {
    if (sort !== "custom" || !optimisticOrder || optimisticOrder.length === 0) return bookmarks
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
  }, [bookmarks, optimisticOrder, sort])

  // Health and Duplicates Queries
  const { data: healthSummaryData } = useBookmarksControllerGetHealthSummary({
    query: { enabled: !isMeLoading && !!user },
  })
  const healthSummary = (healthSummaryData as any)?.data || healthSummaryData

  const {
    data: duplicatesData,
    isLoading: isDuplicatesLoading,
    isError: isDuplicatesError,
    refetch: refetchDuplicates,
  } = useBookmarksControllerGetDuplicates({
    query: { enabled: !isMeLoading && !!user && !!filterDuplicates },
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
    if (new URLSearchParams(window.location.search).has("error")) {
      toast.error(
        "Account linking failed. Use the same verified email and try again."
      )
    }
  }, [])

  useEffect(() => {
    if (!isMeLoading) {
      if (!user) router.replace("/login")
      setIsLoading(false)
    }
  }, [user, isMeLoading, router])

  useClipboardPaste({
    createBookmarkMutation,
    invalidateAllQueries,
    selectedFolderId,
    isModalOpen: isBookmarkModalOpen || isFolderModalOpen || !!bookmarkToEdit,
  })

  const {
    toggleFavorite,
    togglePin,
    toggleArchive,
    handleDeleteBookmark,
    handleRestoreBookmark,
    handlePermanentDeleteBookmark,
    handleDuplicateBookmark,
    handleEmptyTrash,
    handleBulkRestore,
    handleBulkPermanentDelete,
  } = useBookmarkMutations({
    updateBookmarkMutation,
    createBookmarkMutation,
    removeBookmarkMutation,
    invalidateAllQueries,
    selectedBookmarkIds,
    setSelectedBookmarkIds,
  })

  const handleLogout = async () => {
    try {
      const { error } = await authClient.signOut()
      if (error) throw new Error(error.message || "Sign-out failed")
      queryClient.clear()
      router.replace("/login")
    } catch {
      toast.error("Sign-out failed. Try again.")
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
    if (bookmark.type === "NOTE") {
      router.push(`/cabinet/notes/${bookmark.id}`)
      return
    }
    setBookmarkToEdit(bookmark)
    bookmarkForm.setFieldValue("url", bookmark.url || "")
    bookmarkForm.setFieldValue("title", bookmark.title || "")
    bookmarkForm.setFieldValue("description", bookmark.description || "")
    bookmarkForm.setFieldValue("folderId", bookmark.folderId || "")
    bookmarkForm.setFieldValue(
      "tags",
      bookmark.tags?.map((t: any) => `#${t.name}`) || []
    )
    setIsBookmarkModalOpen(true)
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

  const resetBookmarkForm = () => {
    setBookmarkToEdit(null)
    bookmarkForm.reset()
    bookmarkForm.setFieldValue("url", "")
    bookmarkForm.setFieldValue("title", "")
    bookmarkForm.setFieldValue("description", "")
    bookmarkForm.setFieldValue("folderId", selectedFolderId || "")
    bookmarkForm.setFieldValue("tags", [])
  }

  // Productivity Keyboard Shortcuts (Linear / Superhuman style):
  // N: new note, B: new bookmark, /: focus search, 1 & 2: switch view, ⌘B: toggle sidebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      if (
        !target ||
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target.isContentEditable ||
        target.closest("input, textarea, [contenteditable='true'], [role='dialog'], [role='alertdialog']")
      ) {
        return
      }

      if (
        isBookmarkModalOpen ||
        isFolderModalOpen ||
        isMobileAddOpen ||
        !!downloadBookmark
      ) {
        return
      }

      // ⌘B / Ctrl+B: Toggle Sidebar
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "b") {
        e.preventDefault()
        toggleSidebar()
        return
      }

      // Do not trigger single-key actions when meta, ctrl, or alt modifier keys are pressed
      if (e.metaKey || e.ctrlKey || e.altKey) {
        return
      }

      // N: Create New Note
      if (e.key.toLowerCase() === "n") {
        e.preventDefault()
        resetBookmarkForm()
        const params = new URLSearchParams({ new: "1" })
        if (selectedFolderId) params.set("folder", selectedFolderId)
        router.push(`/cabinet/notes/${crypto.randomUUID()}?${params}`)
        return
      }

      // B: Add New Bookmark
      if (e.key.toLowerCase() === "b") {
        e.preventDefault()
        resetBookmarkForm()
        setIsBookmarkModalOpen(true)
        return
      }

      // /: Focus Search input
      if (e.key === "/") {
        e.preventDefault()
        const searchInput = document.getElementById("cabinet-search-input") as HTMLInputElement | null
        if (searchInput) {
          searchInput.focus()
          searchInput.select()
        }
        return
      }

      // 1: Switch to List View
      if (e.key === "1") {
        e.preventDefault()
        handleViewModeChange("list")
        return
      }

      // 2: Switch to Moodboard (Grid) View
      if (e.key === "2") {
        e.preventDefault()
        handleViewModeChange("moodboard")
        return
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [
    toggleSidebar,
    router,
    selectedFolderId,
    resetBookmarkForm,
    setIsBookmarkModalOpen,
    handleViewModeChange,
    isBookmarkModalOpen,
    isFolderModalOpen,
    isMobileAddOpen,
    downloadBookmark,
  ])

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
      title: "Move Selected Bookmarks to Trash",
      description: `Are you sure you want to move ${selectedBookmarkIds.length} selected bookmarks to Trash?`,
      actionLabel: "Move to Trash",
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
      toast.success("Selected bookmarks moved to Trash")
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

  const handleDropBookmarkToFolder = async (folderId: string, bookmarkIds: string[]) => {
    const targetFolder = folders.find((f: any) => f.id === folderId)
    const folderName = targetFolder ? targetFolder.name : "folder"
    const toastId = toast.loading(`Moving ${bookmarkIds.length} item(s) to "${folderName}"...`)
    try {
      await Promise.all(
        bookmarkIds.map((id) =>
          updateBookmarkMutation.mutateAsync({
            id,
            data: { folderId },
          })
        )
      )
      invalidateAllQueries()
      setSelectedBookmarkIds([])
      toast.success(`Moved ${bookmarkIds.length} item(s) to "${folderName}"`, { id: toastId })
    } catch {
      toast.error("Failed to move item(s) to folder", { id: toastId })
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
      <div
        className="flex min-h-[100dvh] items-center justify-center bg-brand-canvas text-sm text-brand-muted"
        role="status"
      >
        Loading Cabinet...
      </div>
    )
  }

  return (
    <Sortable
      value={filteredBookmarks}
      getItemValue={(bookmark) => bookmark.id}
      onValueChange={handleReorder}
      orientation="mixed"
      strategy={masonrySortingStrategy}
      collisionDetection={bookmarkCollisionDetection}
      onDragEnd={({ active, over }) => {
        const folderId = over?.data.current?.folderId
        if (!filterTrash && folderId) {
          const id = String(active.id)
          const ids = selectedBookmarkIds.includes(id) ? selectedBookmarkIds : [id]
          void handleDropBookmarkToFolder(folderId, ids)
        }
      }}
    >
    <div className="flex h-screen flex-col overflow-hidden bg-brand-canvas">
      {/* Pinned Top Workspace Nav Header */}
      <div className="z-30 shrink-0 bg-brand-canvas pt-2">
        <CabinetContainer>
          <WorkspaceHeader
            isSidebarCollapsed={isSidebarCollapsed}
            onToggleSidebar={toggleSidebar}
            user={user}
            onLogout={handleLogout}
            displayPreferences={displayPreferences}
            onDisplayPreferencesChange={handleDisplayPreferencesChange}
          >
            <Toolbar
              sort={sort}
              onSortChange={(value) => {
                setOptimisticOrder(null)
                setSelectedBookmarkIds([])
                bookmarkScrollRef.current?.scrollTo({ top: 0 })
                handleSortChange(value)
              }}
              sortDisabled={!!filterDuplicates}
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
              onOpenMobileFilters={() => setMobileDrawerMode("folders")}
              activeFilterLabel={activeFilterLabel}
              onOpenCommandMenu={() => setIsCommandMenuOpen(true)}
            />
          </WorkspaceHeader>
        </CabinetContainer>
      </div>

      {/* Main Body Layout Container */}
      <div className="flex-1 overflow-hidden py-2 sm:py-3">
        <CabinetContainer className="h-full">
          <div className="flex h-full items-start gap-3 md:gap-4">
            {/* Desktop Left Pinned Sidebar */}
            <aside
              className={cn(
                "hidden h-full shrink-0 transition-all duration-200 ease-in-out md:block",
                isSidebarCollapsed
                  ? "w-0 -ml-3 md:-ml-4 overflow-hidden opacity-0 pointer-events-none"
                  : "w-60 pr-1 opacity-100"
              )}
            >
              <CabinetSidebarFilters
                user={user}
                onLogout={handleLogout}
                displayPreferences={displayPreferences}
                onDisplayPreferencesChange={handleDisplayPreferencesChange}
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
                    setFilterTrash(undefined)
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
                    setFilterTrash(undefined)
                  }
                }}
                filterTrash={filterTrash}
                onSelectTrash={(val) => {
                  setFilterTrash(val)
                  if (val) {
                    setSelectedFolderId(undefined)
                    setSelectedTag(undefined)
                    setFilterFavorite(undefined)
                    setFilterArchived(undefined)
                    setFilterBroken(undefined)
                    setFilterDuplicates(undefined)
                    setFilterType(undefined)
                    setFilterContentType(undefined)
                  }
                }}
                filterType={filterType}
                onSelectType={(val) => {
                  setFilterType(val)
                  if (val) {
                    setSelectedFolderId(undefined)
                    setSelectedTag(undefined)
                    setFilterFavorite(undefined)
                    setFilterArchived(undefined)
                    setFilterBroken(undefined)
                    setFilterDuplicates(undefined)
                    setFilterTrash(undefined)
                    setFilterContentType(undefined)
                  }
                }}
                filterContentType={filterContentType}
                onSelectContentType={(val) => {
                  setFilterContentType(val)
                  if (val) {
                    setSelectedFolderId(undefined)
                    setSelectedTag(undefined)
                    setFilterFavorite(undefined)
                    setFilterArchived(undefined)
                    setFilterBroken(undefined)
                    setFilterDuplicates(undefined)
                    setFilterTrash(undefined)
                    setFilterType(undefined)
                  }
                }}
                healthSummary={healthSummary}
                onScan={handleScan}
                onImport={handleImport}
                resetFolderForm={resetFolderForm}
                onDropBookmarkToFolder={handleDropBookmarkToFolder}
              />
            </aside>

            {/* Mobile Bottom Drawer for Collections & Filters */}
            <Drawer
              open={mobileDrawerMode !== null}
              onOpenChange={(open) => !open && setMobileDrawerMode(null)}
            >
              <DrawerContent className="max-h-[85dvh] rounded-none border-t border-brand-border bg-brand-canvas px-0 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
                <DrawerHeader className="border-b border-brand-border px-5 py-3 text-left">
                  <DrawerTitle className="font-serif text-lg font-medium text-brand-charcoal">
                    {mobileDrawerMode === "folders"
                      ? "Folders & Tags"
                      : "Library & Tools"}
                  </DrawerTitle>
                  <DrawerDescription className="font-mono text-[10px] text-brand-muted uppercase">
                    {mobileDrawerMode === "folders"
                      ? "Browse and organize by folder hierarchy and tag"
                      : "System filters, trash, and backup utilities"}
                  </DrawerDescription>
                </DrawerHeader>
                <div className="overflow-y-auto px-4 py-2">
                  <CabinetSidebarFilters
                    user={user}
                    onLogout={handleLogout}
                    displayPreferences={displayPreferences}
                    onDisplayPreferencesChange={handleDisplayPreferencesChange}
                    viewSection={mobileDrawerMode || "all"}
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
                        setFilterTrash(undefined)
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
                        setFilterDuplicates(undefined)
                        setFilterTrash(undefined)
                      }
                    }}
                    filterTrash={filterTrash}
                    onSelectTrash={(val) => {
                      setFilterTrash(val)
                      if (val) {
                        setSelectedFolderId(undefined)
                        setSelectedTag(undefined)
                        setFilterFavorite(undefined)
                        setFilterArchived(undefined)
                        setFilterBroken(undefined)
                        setFilterDuplicates(undefined)
                        setFilterType(undefined)
                        setFilterContentType(undefined)
                      }
                    }}
                    filterType={filterType}
                    onSelectType={(val) => {
                      setFilterType(val)
                      if (val) {
                        setSelectedFolderId(undefined)
                        setSelectedTag(undefined)
                        setFilterFavorite(undefined)
                        setFilterArchived(undefined)
                        setFilterBroken(undefined)
                        setFilterDuplicates(undefined)
                        setFilterTrash(undefined)
                        setFilterContentType(undefined)
                      }
                    }}
                    filterContentType={filterContentType}
                    onSelectContentType={(val) => {
                      setFilterContentType(val)
                      if (val) {
                        setSelectedFolderId(undefined)
                        setSelectedTag(undefined)
                        setFilterFavorite(undefined)
                        setFilterArchived(undefined)
                        setFilterBroken(undefined)
                        setFilterDuplicates(undefined)
                        setFilterTrash(undefined)
                        setFilterType(undefined)
                      }
                    }}
                    healthSummary={healthSummary}
                    onScan={handleScan}
                    onImport={handleImport}
                    resetFolderForm={resetFolderForm}
                    onItemSelect={() => setMobileDrawerMode(null)}
                  />
                </div>
              </DrawerContent>
            </Drawer>

            <section ref={bookmarkScrollRef} className="h-full min-w-0 flex-1 space-y-4 overflow-y-auto pr-0 pb-[calc(env(safe-area-inset-bottom)+5.5rem)] sm:space-y-6 sm:pr-2 md:pb-8">
              {selectedFolder && !filterTrash && (
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
                  <h2 className="min-w-0 break-words text-lg font-medium">{selectedFolder.name}</h2>
                  <ShareFolderDialog key={selectedFolder.id} folder={selectedFolder} />
                </div>
              )}

              {/* Bookmarks Grid / List */}
              <BookmarkList
                sortableInParent
                displayPreferences={displayPreferences}
                bookmarks={filteredBookmarks}
                isBookmarksLoading={
                  filterDuplicates ? isDuplicatesLoading : isBookmarksLoading
                }
                isBookmarksError={filterDuplicates ? isDuplicatesError : isBookmarksError && !isFetchNextPageError}
                onRetryBookmarks={() => {
                  void (filterDuplicates ? refetchDuplicates() : refetchBookmarks())
                }}
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
                  setFilterTrash(undefined)
                }}
                onToggleFavorite={toggleFavorite}
                onTogglePin={togglePin}
                onToggleArchive={toggleArchive}
                onEditBookmark={handleEditBookmark}
                onDeleteBookmark={handleDeleteBookmark}
                onDuplicateBookmark={handleDuplicateBookmark}
                isDuplicatesView={filterDuplicates}
                duplicateGroups={duplicateGroups}
                onCleanDuplicates={handleCleanDuplicates}
                onReorder={sort === "custom" && !filterTrash ? handleReorder : undefined}
                isTrashView={filterTrash}
                onRestoreBookmark={handleRestoreBookmark}
                onPermanentDeleteBookmark={handlePermanentDeleteBookmark}
                onEmptyTrash={handleEmptyTrash}
                onOpenDownload={setDownloadBookmark}
                availableTags={tags}
                onUpdateBookmark={async (id, data) => {
                  const result = await updateBookmarkMutation.mutateAsync({ id, data })
                  invalidateAllQueries()
                  return result
                }}
              />

              {!filterDuplicates && hasNextPage && (
                <div ref={loadMoreRef} className="flex min-h-12 items-center justify-center py-4" aria-live="polite">
                  {isFetchingNextPage ? (
                    <span role="status" className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Spinner /> Loading more bookmarks...
                    </span>
                  ) : isFetchNextPageError ? (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>Could not load more bookmarks.</span>
                      <Button variant="outline" size="sm" disabled={isFetchingBookmarks} onClick={() => fetchNextPage({ cancelRefetch: false })}>
                        Try again
                      </Button>
                    </div>
                  ) : null}
                </div>
              )}
            </section>

          </div>
        </CabinetContainer>
      </div>

      {/* Global Command Menu ⌘K */}
      <CommandMenu
        open={isCommandMenuOpen}
        onOpenChange={setIsCommandMenuOpen}
        folders={folders}
        tags={tags}
        bookmarks={filteredBookmarks}
        onSelectFolder={(id) => {
          setSelectedFolderId(id)
          setSelectedTag(undefined)
          setFilterFavorite(undefined)
          setFilterArchived(undefined)
          setFilterTrash(undefined)
        }}
        onSelectTag={(name) => {
          setSelectedTag(name)
          setSelectedFolderId(undefined)
          setFilterFavorite(undefined)
          setFilterArchived(undefined)
          setFilterTrash(undefined)
        }}
        onFilterFavorite={() => {
          setFilterFavorite(true)
          setSelectedFolderId(undefined)
          setSelectedTag(undefined)
          setFilterArchived(undefined)
          setFilterTrash(undefined)
        }}
        onFilterArchived={() => {
          setFilterArchived(true)
          setSelectedFolderId(undefined)
          setSelectedTag(undefined)
          setFilterFavorite(undefined)
          setFilterTrash(undefined)
        }}
        onFilterTrash={() => {
          setFilterTrash(true)
          setSelectedFolderId(undefined)
          setSelectedTag(undefined)
          setFilterFavorite(undefined)
          setFilterArchived(undefined)
        }}
        onFilterVideo={() => {
          setFilterContentType("VIDEO" as any)
          setSelectedFolderId(undefined)
          setSelectedTag(undefined)
          setFilterFavorite(undefined)
          setFilterArchived(undefined)
          setFilterTrash(undefined)
        }}
        onFilterNotes={() => {
          setFilterType("NOTE" as any)
          setSelectedFolderId(undefined)
          setSelectedTag(undefined)
          setFilterFavorite(undefined)
          setFilterArchived(undefined)
          setFilterTrash(undefined)
        }}
        onOpenAddBookmark={() => {
          resetBookmarkForm()
          setIsBookmarkModalOpen(true)
        }}
        onOpenAddFolder={() => {
          resetFolderForm()
          setIsFolderModalOpen(true)
        }}
        onScanHealth={handleScan}
      />

      <ActionBar
        open={selectedBookmarkIds.length > 0}
        align="center"
        className="bottom-[calc(env(safe-area-inset-bottom)+4.25rem)] max-w-[calc(100vw-1.5rem)] gap-1.5 overflow-x-auto rounded-none border border-brand-border bg-white p-1.5 shadow-md md:bottom-6"
      >
        <ActionBarSelection className="border-none bg-transparent px-2 py-0 text-xs font-medium text-brand-muted">
          {selectedBookmarkIds.length} selected
        </ActionBarSelection>
        <ActionBarSeparator />
        <ActionBarGroup className="gap-1.5">
          <ActionBarItem
            onClick={handleSelectAll}
            className="h-8 rounded-none border border-brand-border bg-white px-3 text-xs font-medium text-brand-charcoal hover:bg-brand-canvas"
          >
            {!hasNextPage &&
            filteredBookmarks.length > 0 &&
            filteredBookmarks.every((b: any) =>
              selectedBookmarkIds.includes(b.id)
            )
              ? "Deselect all"
              : "Select all"}
          </ActionBarItem>

          {filterTrash ? (
            <>
              <ActionBarItem
                onClick={handleBulkRestore}
                className="h-8 rounded-none border border-brand-border bg-white px-3 text-xs font-medium text-brand-charcoal hover:bg-brand-canvas"
              >
                <ArrowCounterClockwise className="mr-1 h-3.5 w-3.5" />
                Restore
              </ActionBarItem>

              <ActionBarItem
                onClick={handleBulkPermanentDelete}
                className="bg-brand-red-bg text-brand-red-text border-brand-red-text/20 h-8 rounded-none border px-3 text-xs font-medium hover:bg-[#fff0f2]"
              >
                <Trash className="mr-1 h-3.5 w-3.5" />
                Delete permanently
              </ActionBarItem>
            </>
          ) : (
            <>
              <Select
                onValueChange={(folderId) => handleBulkMove(folderId || null)}
              >
                <SelectTrigger className="h-8 w-auto gap-1 rounded-none border-brand-border bg-white text-xs font-medium text-brand-charcoal focus-visible:ring-1 focus-visible:ring-brand-charcoal/30 focus-visible:outline-none">
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
                className="h-8 rounded-none border border-brand-border bg-white px-3 text-xs font-medium text-brand-charcoal hover:bg-brand-canvas"
              >
                <Archive className="mr-1 h-3.5 w-3.5" />
                Archive
              </ActionBarItem>

              <ActionBarItem
                onClick={handleBulkDelete}
                className="bg-brand-red-bg text-brand-red-text border-brand-red-text/20 h-8 rounded-none border px-3 text-xs font-medium hover:bg-[#fff0f2]"
              >
                <Trash className="mr-1 h-3.5 w-3.5" />
                Move to trash
              </ActionBarItem>
            </>
          )}

          <ActionBarSeparator />

          <Button
            variant="ghost"
            size="xs"
            onClick={handleClearSelection}
            className="h-8 rounded-none px-2.5 text-xs font-medium text-brand-muted hover:text-brand-charcoal"
          >
            Cancel
          </Button>
        </ActionBarGroup>
      </ActionBar>

      {/* Mobile Add Bookmark Drawer */}
      <MobileAddBookmarkDrawer
        open={isMobileAddOpen}
        onOpenChange={setIsMobileAddOpen}
        bookmarkForm={bookmarkForm}
        bookmarkToEdit={bookmarkToEdit}
        folders={folders}
        tags={tags}
      />

      {/* Mobile Bottom Navigation Bar */}
      <MobileBottomNav
        activeTab={activeMobileTab}
        onSelectTab={handleSelectMobileTab}
        onOpenAdd={() => {
          resetBookmarkForm()
          setIsMobileAddOpen(true)
        }}
        onCreateNote={() => {
          resetBookmarkForm()
          const params = new URLSearchParams({ new: "1" })
          if (selectedFolderId) params.set("folder", selectedFolderId)
          router.push(`/cabinet/notes/${crypto.randomUUID()}?${params}`)
        }}
        onOpenCollections={() => setMobileDrawerMode("folders")}
        onOpenLibrary={() => setMobileDrawerMode("library")}
        trashCount={healthSummary?.trash || 0}
      />

      {/* Download Media (Video / Audio) Dialog */}
      <DownloadMediaDialog
        bookmark={downloadBookmark}
        isOpen={!!downloadBookmark}
        onClose={() => setDownloadBookmark(null)}
      />
    </div>
    </Sortable>
  )
}
