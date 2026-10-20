"use client"

import { useCallback, useRef } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "@/components/ui/sonner"
import { useConfirm } from "@/hooks/use-confirm"
import { AXIOS_INSTANCE } from "@/lib/api-client"
import { useBookmarkCache } from "./use-bookmark-cache"

interface BookmarkMutationsOptions {
  updateBookmarkMutation: any
  createBookmarkMutation: any
  removeBookmarkMutation: any
  invalidateAllQueries: () => void
  selectedBookmarkIds: string[]
  setSelectedBookmarkIds: (ids: string[]) => void
}

export function useBookmarkMutations({
  updateBookmarkMutation,
  createBookmarkMutation,
  removeBookmarkMutation,
  invalidateAllQueries,
  selectedBookmarkIds,
  setSelectedBookmarkIds,
}: BookmarkMutationsOptions) {
  const confirm = useConfirm()
  const queryClient = useQueryClient()
  const pinning = useRef(new Set<string>())
  const { updateBookmarkInCache, removeBookmarkFromCache } = useBookmarkCache()

  const toggleFavorite = useCallback(
    async (bookmark: any) => {
      const nextState = !bookmark.isFavorite
      updateBookmarkInCache(bookmark.id, (b) => ({
        ...b,
        isFavorite: nextState,
      }))
      try {
        await updateBookmarkMutation.mutateAsync({
          id: bookmark.id,
          data: { isFavorite: nextState },
        })
      } catch {
        updateBookmarkInCache(bookmark.id, (b) => ({
          ...b,
          isFavorite: bookmark.isFavorite,
        }))
        toast.error("Failed to update favorite status")
      }
    },
    [updateBookmarkMutation, updateBookmarkInCache]
  )

  const togglePin = useCallback(async (bookmark: any) => {
    if (pinning.current.has(bookmark.id)) return
    pinning.current.add(bookmark.id)
    try {
      await updateBookmarkMutation.mutateAsync({
        id: bookmark.id,
        data: { isPinned: !bookmark.isPinned },
      })
      // Refetch the full paginated ordering: a pinned item may come from a later page.
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["infinite", "/v1/bookmarks"] }),
        queryClient.invalidateQueries({ queryKey: ["/v1/bookmarks"] }),
        queryClient.invalidateQueries({ queryKey: ["/v1/bookmarks/duplicates"] }),
      ])
      toast.success(bookmark.isPinned ? "Bookmark unpinned" : "Bookmark pinned to top")
    } catch {
      toast.error("Failed to update pin status")
    } finally {
      pinning.current.delete(bookmark.id)
    }
  }, [updateBookmarkMutation, queryClient])

  const toggleArchive = useCallback(
    async (bookmark: any) => {
      const nextState = !bookmark.isArchived
      updateBookmarkInCache(bookmark.id, (b) => ({
        ...b,
        isArchived: nextState,
      }))
      try {
        await updateBookmarkMutation.mutateAsync({
          id: bookmark.id,
          data: { isArchived: nextState },
        })
      } catch {
        updateBookmarkInCache(bookmark.id, (b) => ({
          ...b,
          isArchived: bookmark.isArchived,
        }))
        toast.error("Failed to update archive status")
      }
    },
    [updateBookmarkMutation, updateBookmarkInCache]
  )

  const handleDeleteBookmark = useCallback(
    async (id: string) => {
      const isConfirmed = await confirm({
        title: "Move to Trash?",
        description:
          "Are you sure you want to move this bookmark to Trash? You can restore it anytime.",
        actionLabel: "Move to Trash",
        variant: "destructive",
      })
      if (!isConfirmed) return

      removeBookmarkFromCache(id)
      try {
        await removeBookmarkMutation.mutateAsync({ id })
        toast.success("Bookmark moved to Trash")
      } catch {
        invalidateAllQueries()
        toast.error("Failed to move bookmark to Trash")
      }
    },
    [confirm, removeBookmarkMutation, removeBookmarkFromCache, invalidateAllQueries]
  )

  const handleRestoreBookmark = useCallback(
    async (id: string) => {
      removeBookmarkFromCache(id)
      try {
        await AXIOS_INSTANCE.post(`/v1/bookmarks/${id}/restore`)
        toast.success("Bookmark restored")
      } catch {
        invalidateAllQueries()
        toast.error("Failed to restore bookmark")
      }
    },
    [removeBookmarkFromCache, invalidateAllQueries]
  )

  const handlePermanentDeleteBookmark = useCallback(
    async (id: string) => {
      const isConfirmed = await confirm({
        title: "Delete Permanently?",
        description:
          "This will permanently delete this bookmark. This action cannot be undone.",
        actionLabel: "Delete Permanently",
        variant: "destructive",
      })
      if (!isConfirmed) return

      removeBookmarkFromCache(id)
      try {
        await AXIOS_INSTANCE.delete(`/v1/bookmarks/${id}/permanent`)
        toast.success("Bookmark permanently deleted")
      } catch {
        invalidateAllQueries()
        toast.error("Failed to permanently delete bookmark")
      }
    },
    [confirm, removeBookmarkFromCache, invalidateAllQueries]
  )

  const handleDuplicateBookmark = useCallback(
    async (bookmark: any) => {
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
        toast.success("Bookmark duplicated")
      } catch {
        toast.error("Failed to duplicate bookmark")
      }
    },
    [createBookmarkMutation, invalidateAllQueries]
  )

  const handleEmptyTrash = useCallback(async () => {
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
  }, [confirm, invalidateAllQueries, setSelectedBookmarkIds])

  const handleBulkRestore = useCallback(async () => {
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
  }, [selectedBookmarkIds, invalidateAllQueries, setSelectedBookmarkIds])

  const handleBulkTrash = useCallback(async () => {
    if (selectedBookmarkIds.length === 0) return
    const isConfirmed = await confirm({
      title: "Move Selected to Trash?",
      description: `Are you sure you want to move ${selectedBookmarkIds.length} selected bookmarks to Trash?`,
      actionLabel: "Move to Trash",
      variant: "destructive",
    })
    if (!isConfirmed) return
    try {
      await AXIOS_INSTANCE.post("/v1/bookmarks/bulk/trash", {
        ids: selectedBookmarkIds,
      })
      invalidateAllQueries()
      setSelectedBookmarkIds([])
      toast.success("Selected bookmarks moved to Trash")
    } catch {
      toast.error("Failed to move bookmarks to Trash")
    }
  }, [confirm, selectedBookmarkIds, invalidateAllQueries, setSelectedBookmarkIds])

  const handleBulkArchive = useCallback(
    async (isArchived = true) => {
      if (selectedBookmarkIds.length === 0) return
      try {
        await AXIOS_INSTANCE.post("/v1/bookmarks/bulk/archive", {
          ids: selectedBookmarkIds,
          isArchived,
        })
        invalidateAllQueries()
        setSelectedBookmarkIds([])
        toast.success(
          isArchived
            ? "Selected bookmarks archived"
            : "Selected bookmarks unarchived"
        )
      } catch {
        toast.error("Failed to update archive status")
      }
    },
    [selectedBookmarkIds, invalidateAllQueries, setSelectedBookmarkIds]
  )

  const handleBulkMove = useCallback(
    async (folderId: string | null) => {
      if (selectedBookmarkIds.length === 0) return
      try {
        await AXIOS_INSTANCE.post("/v1/bookmarks/bulk/move", {
          ids: selectedBookmarkIds,
          folderId: folderId || null,
        })
        invalidateAllQueries()
        setSelectedBookmarkIds([])
        toast.success("Bookmarks moved successfully")
      } catch {
        toast.error("Failed to move bookmarks")
      }
    },
    [selectedBookmarkIds, invalidateAllQueries, setSelectedBookmarkIds]
  )

  const handleBulkAddTags = useCallback(
    async (tagNames: string[]) => {
      if (selectedBookmarkIds.length === 0 || tagNames.length === 0) return
      try {
        await AXIOS_INSTANCE.post("/v1/bookmarks/bulk/tags", {
          ids: selectedBookmarkIds,
          tags: tagNames,
        })
        invalidateAllQueries()
        setSelectedBookmarkIds([])
        toast.success("Tags added to selected bookmarks")
      } catch {
        toast.error("Failed to add tags")
      }
    },
    [selectedBookmarkIds, invalidateAllQueries, setSelectedBookmarkIds]
  )

  const handleBulkPermanentDelete = useCallback(async () => {
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
  }, [confirm, selectedBookmarkIds, invalidateAllQueries, setSelectedBookmarkIds])

  return {
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
    handleBulkTrash,
    handleBulkArchive,
    handleBulkMove,
    handleBulkAddTags,
  }
}
