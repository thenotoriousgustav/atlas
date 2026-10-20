"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import {
  defaultDisplayPreferences,
  type DisplayPreferences,
} from "../components/display-preferences"
import type { MobileTab } from "../components/mobile-bottom-nav"
import { isBookmarkSort, type BookmarkSort } from "@/lib/bookmark-order"

export function useCabinetFilters(folders: any[]) {
  const [selectedFolderId, setSelectedFolderId] = useState<string | undefined>(
    undefined
  )
  const [filterFavorite, setFilterFavorite] = useState<boolean | undefined>(
    undefined
  )
  const [filterArchived, setFilterArchived] = useState<boolean | undefined>(
    false
  )
  const [selectedTag, setSelectedTag] = useState<string | undefined>(undefined)
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [searchDebounced, setSearchDebounced] = useState<string>("")
  const [viewMode, setViewMode] = useState<"list" | "moodboard">("list")
  const [sort, setSort] = useState<BookmarkSort>("custom")
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
  const [filterType, setFilterType] = useState<"BOOKMARK" | "NOTE" | undefined>(
    undefined
  )
  const [filterContentType, setFilterContentType] = useState<
    string | undefined
  >(undefined)

  useEffect(() => {
    const handler = setTimeout(() => {
      setSearchDebounced(searchQuery)
    }, 200)
    return () => clearTimeout(handler)
  }, [searchQuery])

  useEffect(() => {
    const folder = new URLSearchParams(window.location.search).get("folder")
    if (folder && /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(folder)) {
      setSelectedFolderId(folder)
    }
    const savedSort = localStorage.getItem("cabinet_sort")
    if (isBookmarkSort(savedSort)) setSort(savedSort)
    const savedMode = localStorage.getItem("cabinet_view_mode")
    if (savedMode === "list" || savedMode === "moodboard") {
      setViewMode(savedMode)
    }

    const savedPreferences = localStorage.getItem("cabinet_display_preferences")
    if (savedPreferences) {
      try {
        const parsed = JSON.parse(savedPreferences)
        if (typeof parsed === "object" && parsed !== null) {
          setDisplayPreferences({ ...defaultDisplayPreferences, ...parsed })
        }
      } catch {
        localStorage.removeItem("cabinet_display_preferences")
      }
    }

    const savedCols = localStorage.getItem("cabinet_column_count")
    if (savedCols) {
      const parsed = parseInt(savedCols, 10)
      if (parsed >= 1 && parsed <= 4) {
        setColumnCount(parsed)
      }
    }
  }, [])

  const handleDisplayPreferencesChange = useCallback(
    (prefs: DisplayPreferences) => {
      setDisplayPreferences(prefs)
      localStorage.setItem(
        "cabinet_display_preferences",
        JSON.stringify(prefs)
      )
    },
    []
  )

  const handleSortChange = useCallback((value: BookmarkSort) => {
    setSort(value)
    try { localStorage.setItem("cabinet_sort", value) } catch { /* Sorting still works without storage. */ }
  }, [])

  const handleViewModeChange = useCallback((mode: "list" | "moodboard") => {
    setViewMode(mode)
    localStorage.setItem("cabinet_view_mode", mode)
  }, [])

  const handleColumnCountChange = useCallback((count: number) => {
    setColumnCount(count)
    localStorage.setItem("cabinet_column_count", count.toString())
  }, [])

  const activeMobileTab = useMemo<MobileTab>(() => {
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

  const handleSelectMobileTab = useCallback(
    (tab: MobileTab, onAdd?: () => void) => {
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
        onAdd?.()
      }
    },
    []
  )

  const activeFilterLabel = useMemo(() => {
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
    filterType,
    filterContentType,
    selectedFolderId,
    selectedTag,
    filterFavorite,
    filterArchived,
    filterBroken,
    filterDuplicates,
    folders,
  ])

  const resetAllFilters = useCallback(() => {
    setSelectedFolderId(undefined)
    setSelectedTag(undefined)
    setFilterFavorite(undefined)
    setFilterArchived(false)
    setFilterBroken(undefined)
    setFilterDuplicates(undefined)
    setFilterTrash(undefined)
    setFilterType(undefined)
    setFilterContentType(undefined)
    setSearchQuery("")
  }, [])

  return {
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
    setViewMode,
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
    setColumnCount,
    handleColumnCountChange,
    displayPreferences,
    setDisplayPreferences,
    handleDisplayPreferencesChange,
    mobileDrawerMode,
    setMobileDrawerMode,
    filterType,
    setFilterType,
    filterContentType,
    setFilterContentType,
    activeMobileTab,
    handleSelectMobileTab,
    activeFilterLabel,
    resetAllFilters,
  }
}
