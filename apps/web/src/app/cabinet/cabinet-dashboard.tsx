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
import { WorkspaceHeader } from "@/components/workspace-header"
import { CabinetContainer } from "@/components/cabinet-container"
import { CabinetSidebarFilters } from "./components/cabinet-sidebar-filters"
import { Toolbar } from "./components/toolbar"
import { BookmarkList } from "./components/bookmark-list"
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
import { BookmarkInspector } from "./components/bookmark-inspector"
import { CommandMenu } from "./components/command-menu"
import {
  defaultDisplayPreferences,
  type DisplayPreferences,
} from "./components/display-preferences"

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
  const [filterTrash, setFilterTrash] = useState<boolean | undefined>(undefined)
  const [columnCount, setColumnCount] = useState<number>(3)
  const [displayPreferences, setDisplayPreferences] =
    useState<DisplayPreferences>(defaultDisplayPreferences)
  const [mobileDrawerMode, setMobileDrawerMode] = useState<
    "folders" | "library" | null
  >(null)
  const [isMobileAddOpen, setIsMobileAddOpen] = useState(false)
  const [downloadBookmark, setDownloadBookmark] = useState<any | null>(null)
  const [inspectedBookmark, setInspectedBookmark] = useState<any | null>(null)
  const [isCommandMenuOpen, setIsCommandMenuOpen] = useState(false)
  const [filterType, setFilterType] = useState<"BOOKMARK" | "NOTE" | undefined>(
    undefined
  )
  const [filterContentType, setFilterContentType] = useState<
    string | undefined
  >(undefined)

  const activeMobileTab = React.useMemo<MobileTab>(() => {
    if (filterFavorite) return "favorites"
    if (selectedFolderId) return "folders"
    if (filterTrash || filterBroken || filterDuplicates || filterArchived)
      return "library"
    return "all"
  }, [
    filterFavorite,
    selectedFolderId,
    filterTrash,
    filterBroken,
    filterDuplicates,
    filterArchived,
  ])

  const handleSelectMobileTab = (tab: MobileTab) => {
    if (tab === "all") {
      setSelectedFolderId(undefined)
      setSelectedTag(undefined)
      setFilterFavorite(undefined)
      setFilterArchived(false)
      setFilterBroken(undefined)
      setFilterDuplicates(undefined)
      setFilterTrash(undefined)
    } else if (tab === "favorites") {
      setSelectedFolderId(undefined)
      setSelectedTag(undefined)
      setFilterFavorite(true)
      setFilterArchived(undefined)
      setFilterBroken(undefined)
      setFilterDuplicates(undefined)
      setFilterTrash(undefined)
    } else if (tab === "folders") {
      setMobileDrawerMode("folders")
    } else if (tab === "library") {
      setMobileDrawerMode("library")
    } else if (tab === "add") {
      resetBookmarkForm()
      setIsMobileAddOpen(true)
    }
  }

  // Load viewMode and columnCount from localStorage on mount
  useEffect(() => {
    const savedMode = localStorage.getItem("cabinet_view_mode")
    if (savedMode === "list" || savedMode === "moodboard") {
      setViewMode(savedMode as any)
    }
    const savedPreferences = localStorage.getItem("cabinet_display_preferences")
    if (savedPreferences) {
      try {
        setDisplayPreferences({
          ...defaultDisplayPreferences,
          ...JSON.parse(savedPreferences),
        })
      } catch {
        localStorage.removeItem("cabinet_display_preferences")
      }
    }
    const savedCols = localStorage.getItem("cabinet_column_count")
    if (savedCols) {
      const parsed = parseInt(savedCols, 10)
      if ([1, 2, 3, 4].includes(parsed)) {
        setColumnCount(parsed)
      }
    }
  }, [])

  const handleDisplayPreferencesChange = (preferences: DisplayPreferences) => {
    setDisplayPreferences(preferences)
    localStorage.setItem(
      "cabinet_display_preferences",
      JSON.stringify(preferences)
    )
  }

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

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setSearchDebounced(searchQuery)
    }, 300)
    return () => clearTimeout(handler)
  }, [searchQuery])

  // Fetch Folders, Bookmarks, Tags
  const { data: foldersData } = useFoldersControllerFindAll()
  const folders = (foldersData as any)?.data || []

  const { data: tagsData } = useTagsControllerFindAll()
  const tags = (tagsData as any)?.data || []

  const activeFilterLabel = React.useMemo(() => {
    if (filterTrash) return "Trash"
    if (filterType === "NOTE") return "Notes"
    if (filterType === "BOOKMARK") return "Bookmarks"
    if (filterContentType === "VIDEO") return "Videos & Media"
    if (selectedFolderId) {
      const folder = folders.find((f: any) => f.id === selectedFolderId)
      return folder ? folder.name : "Folder"
    }
    if (selectedTag) return `#${selectedTag}`
    if (filterFavorite) return "Favorites"
    if (filterArchived) return "Archive"
    if (filterBroken) return "Broken"
    if (filterDuplicates) return "Duplicates"
    return undefined
  }, [
    filterTrash,
    selectedFolderId,
    selectedTag,
    filterFavorite,
    filterArchived,
    filterBroken,
    filterDuplicates,
    folders,
  ])

  const {
    data: bookmarksInfiniteData,
    isLoading: isBookmarksLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
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
      status: filterBroken ? "BROKEN" : undefined,
    } as any,
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

  const {
    data: duplicatesData,
    isLoading: isDuplicatesLoading,
    refetch: refetchDuplicates,
  } = useBookmarksControllerGetDuplicates({
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

  // Quick save bookmark via Command/Ctrl + V shortcut
  useEffect(() => {
    const saveBookmarkFromUrl = async (rawText: string) => {
      const text = rawText.trim()
      if (!text) return false

      let targetUrl = ""
      try {
        const urlObj = new URL(text)
        if (urlObj.protocol === "http:" || urlObj.protocol === "https:") {
          targetUrl = urlObj.toString()
        }
      } catch {
        // Tolerant match for domain-like strings (e.g. www.google.com, github.com, etc)
        if (/^(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(?:\/.*)?$/i.test(text)) {
          targetUrl = `https://${text}`
        }
      }

      if (!targetUrl) {
        return false
      }

      const toastId = toast.loading("Saving bookmark from clipboard...")

      try {
        const res = await createBookmarkMutation.mutateAsync({
          data: {
            url: targetUrl,
            folderId: selectedFolderId || undefined,
          },
        })
        invalidateAllQueries()
        const savedTitle =
          (res as any)?.data?.title || (res as any)?.title || targetUrl
        toast.success(`Saved: ${savedTitle}`, { id: toastId })
        return true
      } catch (err: any) {
        toast.error(err?.message || "Failed to save bookmark from clipboard", {
          id: toastId,
        })
        return false
      }
    }

    // 1. Native paste event (fires on Cmd+V / Ctrl+V in most browsers)
    const handlePaste = async (e: ClipboardEvent) => {
      const activeTag = (document.activeElement?.tagName || "").toLowerCase()
      const isEditable =
        activeTag === "input" ||
        activeTag === "textarea" ||
        (document.activeElement as HTMLElement)?.isContentEditable

      if (isEditable || isBookmarkModalOpen || isFolderModalOpen) {
        return
      }

      const clipboardText =
        e.clipboardData?.getData("text/plain") ||
        e.clipboardData?.getData("text") ||
        ""

      if (!clipboardText) return

      const saved = await saveBookmarkFromUrl(clipboardText)
      if (saved) {
        e.preventDefault()
      }
    }

    window.addEventListener("paste", handlePaste)
    return () => {
      window.removeEventListener("paste", handlePaste)
    }
  }, [
    createBookmarkMutation,
    invalidateAllQueries,
    isBookmarkModalOpen,
    isFolderModalOpen,
    selectedFolderId,
  ])

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

  const handleDeleteBookmark = async (id: string) => {
    const isConfirmed = await confirm({
      title: "Move to Trash",
      description:
        "Are you sure you want to move this bookmark to Trash? You can restore it anytime.",
      actionLabel: "Move to Trash",
      variant: "destructive",
    })
    if (isConfirmed) {
      try {
        await removeBookmarkMutation.mutateAsync({ id })
        invalidateAllQueries()
        toast.success("Bookmark moved to Trash")
      } catch {
        toast.error("Failed to move bookmark to Trash")
      }
    }
  }

  // Trash handlers
  const handleRestoreBookmark = async (id: string) => {
    try {
      await AXIOS_INSTANCE.post(`/v1/bookmarks/${id}/restore`)
      invalidateAllQueries()
      toast.success("Bookmark restored")
    } catch {
      toast.error("Failed to restore bookmark")
    }
  }

  const handlePermanentDeleteBookmark = async (id: string) => {
    const isConfirmed = await confirm({
      title: "Permanently Delete Bookmark",
      description:
        "This will permanently delete this bookmark. This action cannot be undone.",
      actionLabel: "Delete Permanently",
      variant: "destructive",
    })
    if (!isConfirmed) return
    try {
      await AXIOS_INSTANCE.delete(`/v1/bookmarks/${id}/permanent`)
      invalidateAllQueries()
      toast.success("Bookmark permanently deleted")
    } catch {
      toast.error("Failed to permanently delete bookmark")
    }
  }

  const handleEmptyTrash = async () => {
    const isConfirmed = await confirm({
      title: "Empty Trash?",
      description:
        "Are you sure you want to permanently delete all bookmarks in Trash? This action cannot be undone.",
      actionLabel: "Empty Trash",
      variant: "destructive",
    })
    if (!isConfirmed) return
    try {
      await AXIOS_INSTANCE.delete("/v1/bookmarks/trash/empty")
      invalidateAllQueries()
      setSelectedBookmarkIds([])
      toast.success("Trash emptied")
    } catch {
      toast.error("Failed to empty trash")
    }
  }

  const handleBulkRestore = async () => {
    if (selectedBookmarkIds.length === 0) return
    try {
      await AXIOS_INSTANCE.post("/v1/bookmarks/bulk/restore", {
        ids: selectedBookmarkIds,
      })
      invalidateAllQueries()
      setSelectedBookmarkIds([])
      toast.success("Selected bookmarks restored")
    } catch {
      toast.error("Failed to restore some bookmarks")
    }
  }

  const handleBulkPermanentDelete = async () => {
    if (selectedBookmarkIds.length === 0) return
    const isConfirmed = await confirm({
      title: "Permanently Delete Selected Bookmarks",
      description: `Are you sure you want to permanently delete ${selectedBookmarkIds.length} selected bookmarks? This action cannot be undone.`,
      actionLabel: "Delete Permanently",
      variant: "destructive",
    })
    if (!isConfirmed) return
    try {
      await AXIOS_INSTANCE.post("/v1/bookmarks/bulk/permanent-delete", {
        ids: selectedBookmarkIds,
      })
      invalidateAllQueries()
      setSelectedBookmarkIds([])
      toast.success("Selected bookmarks permanently deleted")
    } catch {
      toast.error("Failed to delete some bookmarks")
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
          type: bookmark.type,
          noteDocument: bookmark.noteDocument || undefined,
          url: bookmark.url || undefined,
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
    bookmarkForm.setFieldValue("url", "")
    bookmarkForm.setFieldValue("title", "")
    bookmarkForm.setFieldValue("description", "")
    bookmarkForm.setFieldValue("folderId", selectedFolderId || "")
    bookmarkForm.setFieldValue("tags", [])
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
      <div className="z-30 shrink-0 bg-brand-canvas pt-2.5">
        <CabinetContainer>
          <WorkspaceHeader
            user={user}
            onLogout={handleLogout}
            displayPreferences={displayPreferences}
            onDisplayPreferencesChange={handleDisplayPreferencesChange}
          />
        </CabinetContainer>
      </div>

      {/* Main Body Layout Container */}
      <div className="flex-1 overflow-hidden py-2 sm:py-3">
        <CabinetContainer className="h-full">
          <div className="flex h-full items-start gap-3 md:gap-4">
            {/* Desktop Left Pinned Sidebar */}
            <aside className="hidden h-full w-60 shrink-0 overflow-y-auto pr-2 md:block">
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

            <section className="h-full min-w-0 flex-1 space-y-4 overflow-y-auto pr-0 pb-[calc(env(safe-area-inset-bottom)+5.5rem)] sm:space-y-6 sm:pr-2 md:pb-8">
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
                onOpenMobileFilters={() => setMobileDrawerMode("folders")}
                activeFilterLabel={activeFilterLabel}
                onOpenCommandMenu={() => setIsCommandMenuOpen(true)}
              />

              {/* Bookmarks Grid / List */}
              <BookmarkList
                displayPreferences={displayPreferences}
                bookmarks={filteredBookmarks}
                isBookmarksLoading={
                  filterDuplicates ? isDuplicatesLoading : isBookmarksLoading
                }
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
                onToggleArchive={toggleArchive}
                onEditBookmark={handleEditBookmark}
                onDeleteBookmark={handleDeleteBookmark}
                onDuplicateBookmark={handleDuplicateBookmark}
                isDuplicatesView={filterDuplicates}
                duplicateGroups={duplicateGroups}
                onCleanDuplicates={handleCleanDuplicates}
                onReorder={handleReorder}
                isTrashView={filterTrash}
                onRestoreBookmark={handleRestoreBookmark}
                onPermanentDeleteBookmark={handlePermanentDeleteBookmark}
                onEmptyTrash={handleEmptyTrash}
                onOpenDownload={setDownloadBookmark}
                onInspectBookmark={setInspectedBookmark}
              />

              {/* Load More Button */}
              {!filterDuplicates && hasNextPage && (
                <div className="flex justify-center pt-4 pb-4 sm:pt-6">
                  <Button onClick={() => fetchNextPage()} disabled={isFetchingNextPage} variant="outline">
                    {isFetchingNextPage ? <><Spinner /> Loading...</> : "Load More"}
                  </Button>
                </div>
              )}
            </section>

            {/* Right Desktop Inspector Panel */}
            <BookmarkInspector
              bookmark={inspectedBookmark}
              folders={folders}
              availableTags={tags}
              onClose={() => setInspectedBookmark(null)}
              onUpdateBookmark={async (id, data) => {
                const res = await updateBookmarkMutation.mutateAsync({ id, data })
                invalidateAllQueries()
                return res
              }}
              onDeleteBookmark={handleDeleteBookmark}
              onToggleFavorite={toggleFavorite}
              onToggleArchive={toggleArchive}
            />
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
  )
}
