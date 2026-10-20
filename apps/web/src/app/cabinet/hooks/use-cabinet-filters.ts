"use client"

import { useState, useEffect, useMemo, useCallback, useRef } from "react"
import {
  defaultDisplayPreferences,
  type DisplayPreferences,
} from "../components/display-preferences"
import type { MobileTab } from "../components/mobile-bottom-nav"
import { isBookmarkSort, type BookmarkSort } from "@/lib/bookmark-order"

function parseUrlFilters() {
  if (typeof window === "undefined") return {}
  const params = new URLSearchParams(window.location.search)
  const folder = params.get("folder")
  const tag = params.get("tag")
  const view = params.get("view")
  const q = params.get("q")
  const sort = params.get("sort")

  return {
    folderId:
      folder &&
      /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(
        folder
      )
        ? folder
        : undefined,
    tag: tag ? tag.trim().replace(/^#/, "") : undefined,
    view: view || undefined,
    searchQuery: q || "",
    sort: isBookmarkSort(sort) ? sort : undefined,
  }
}

export function useCabinetFilters(folders: any[]) {
  const initialUrl = useMemo(() => parseUrlFilters(), [])

  const [selectedFolderId, setSelectedFolderIdState] = useState<string | undefined>(
    initialUrl.folderId
  )
  const [filterFavorite, setFilterFavoriteState] = useState<boolean | undefined>(
    initialUrl.view === "favorites" ? true : undefined
  )
  const [filterArchived, setFilterArchivedState] = useState<boolean | undefined>(
    initialUrl.view === "archive" ? true : false
  )
  const [selectedTag, setSelectedTagState] = useState<string | undefined>(
    initialUrl.tag
  )
  const [searchQuery, setSearchQuery] = useState<string>(initialUrl.searchQuery || "")
  const [searchDebounced, setSearchDebounced] = useState<string>(
    initialUrl.searchQuery || ""
  )
  const [viewMode, setViewMode] = useState<"list" | "moodboard">("list")
  const [sort, setSortState] = useState<BookmarkSort>(
    initialUrl.sort || "custom"
  )
  const [filterBroken, setFilterBrokenState] = useState<boolean | undefined>(
    initialUrl.view === "broken" ? true : undefined
  )
  const [filterDuplicates, setFilterDuplicatesState] = useState<boolean | undefined>(
    initialUrl.view === "duplicates" ? true : undefined
  )
  const [filterTrash, setFilterTrashState] = useState<boolean | undefined>(
    initialUrl.view === "trash" ? true : undefined
  )
  const [columnCount, setColumnCount] = useState<number>(4)
  const [displayPreferences, setDisplayPreferences] =
    useState<DisplayPreferences>(defaultDisplayPreferences)
  const [mobileDrawerMode, setMobileDrawerMode] = useState<
    "folders" | "library" | null
  >(null)
  const [filterType, setFilterTypeState] = useState<
    "BOOKMARK" | "NOTE" | undefined
  >(
    initialUrl.view === "notes"
      ? "NOTE"
      : initialUrl.view === "bookmarks"
        ? "BOOKMARK"
        : undefined
  )
  const [filterContentType, setFilterContentTypeState] = useState<
    string | undefined
  >(initialUrl.view === "media" ? "VIDEO" : undefined)

  const isNavigatingRef = useRef(false)

  // Current active view key
  const currentView = useMemo(() => {
    if (filterTrash) return "trash"
    if (filterFavorite) return "favorites"
    if (filterArchived) return "archive"
    if (filterBroken) return "broken"
    if (filterDuplicates) return "duplicates"
    if (filterType === "NOTE") return "notes"
    if (filterType === "BOOKMARK") return "bookmarks"
    if (filterContentType === "VIDEO") return "media"
    return undefined
  }, [
    filterTrash,
    filterFavorite,
    filterArchived,
    filterBroken,
    filterDuplicates,
    filterType,
    filterContentType,
  ])

  // Sync URL search params helper
  const syncUrl = useCallback(
    ({
      folderId,
      tag,
      view,
      q,
      sortMode,
      replace = false,
    }: {
      folderId?: string
      tag?: string
      view?: string
      q?: string
      sortMode?: string
      replace?: boolean
    }) => {
      if (typeof window === "undefined" || isNavigatingRef.current) return
      const params = new URLSearchParams()
      if (folderId) params.set("folder", folderId)
      if (tag) params.set("tag", tag)
      if (view) params.set("view", view)
      if (q && q.trim()) params.set("q", q.trim())
      if (sortMode && sortMode !== "custom") params.set("sort", sortMode)

      const qs = params.toString()
      const newUrl = qs ? `${window.location.pathname}?${qs}` : window.location.pathname
      const currentUrl = `${window.location.pathname}${window.location.search}`
      if (newUrl !== currentUrl) {
        if (replace) {
          window.history.replaceState(null, "", newUrl)
        } else {
          window.history.pushState(null, "", newUrl)
        }
      }
    },
    []
  )

  // Debounce search query input
  useEffect(() => {
    const handler = setTimeout(() => {
      setSearchDebounced(searchQuery)
      syncUrl({
        folderId: selectedFolderId,
        tag: selectedTag,
        view: currentView,
        q: searchQuery,
        sortMode: sort,
        replace: true,
      })
    }, 200)
    return () => clearTimeout(handler)
  }, [searchQuery, selectedFolderId, selectedTag, currentView, sort, syncUrl])

  // Browser Back / Forward (popstate) event listener
  useEffect(() => {
    const handlePopState = () => {
      isNavigatingRef.current = true
      const parsed = parseUrlFilters()
      setSelectedFolderIdState(parsed.folderId)
      setSelectedTagState(parsed.tag)
      setSearchQuery(parsed.searchQuery || "")
      setSearchDebounced(parsed.searchQuery || "")
      if (parsed.sort) setSortState(parsed.sort)

      // Apply view mode
      setFilterFavoriteState(parsed.view === "favorites" ? true : undefined)
      setFilterArchivedState(parsed.view === "archive" ? true : false)
      setFilterBrokenState(parsed.view === "broken" ? true : undefined)
      setFilterDuplicatesState(parsed.view === "duplicates" ? true : undefined)
      setFilterTrashState(parsed.view === "trash" ? true : undefined)
      setFilterTypeState(
        parsed.view === "notes"
          ? "NOTE"
          : parsed.view === "bookmarks"
            ? "BOOKMARK"
            : undefined
      )
      setFilterContentTypeState(parsed.view === "media" ? "VIDEO" : undefined)

      setTimeout(() => {
        isNavigatingRef.current = false
      }, 50)
    }

    window.addEventListener("popstate", handlePopState)
    return () => window.removeEventListener("popstate", handlePopState)
  }, [])

  // Local storage preferences on mount
  useEffect(() => {
    const savedSort = localStorage.getItem("cabinet_sort")
    if (isBookmarkSort(savedSort) && !initialUrl.sort) {
      setSortState(savedSort)
    }
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
  }, [initialUrl.sort])

  const setSelectedFolderId = useCallback(
    (id: string | undefined) => {
      setSelectedFolderIdState(id)
      syncUrl({
        folderId: id,
        tag: undefined,
        view: undefined,
        q: searchDebounced,
        sortMode: sort,
      })
    },
    [searchDebounced, sort, syncUrl]
  )

  const setSelectedTag = useCallback(
    (tag: string | undefined) => {
      setSelectedTagState(tag)
      syncUrl({
        folderId: undefined,
        tag,
        view: undefined,
        q: searchDebounced,
        sortMode: sort,
      })
    },
    [searchDebounced, sort, syncUrl]
  )

  const setFilterFavorite = useCallback(
    (fav: boolean | undefined) => {
      setFilterFavoriteState(fav)
      syncUrl({
        folderId: undefined,
        tag: undefined,
        view: fav ? "favorites" : undefined,
        q: searchDebounced,
        sortMode: sort,
      })
    },
    [searchDebounced, sort, syncUrl]
  )

  const setFilterArchived = useCallback(
    (archived: boolean | undefined) => {
      setFilterArchivedState(archived)
      syncUrl({
        folderId: undefined,
        tag: undefined,
        view: archived ? "archive" : undefined,
        q: searchDebounced,
        sortMode: sort,
      })
    },
    [searchDebounced, sort, syncUrl]
  )

  const setFilterBroken = useCallback(
    (broken: boolean | undefined) => {
      setFilterBrokenState(broken)
      syncUrl({
        folderId: undefined,
        tag: undefined,
        view: broken ? "broken" : undefined,
        q: searchDebounced,
        sortMode: sort,
      })
    },
    [searchDebounced, sort, syncUrl]
  )

  const setFilterDuplicates = useCallback(
    (duplicates: boolean | undefined) => {
      setFilterDuplicatesState(duplicates)
      syncUrl({
        folderId: undefined,
        tag: undefined,
        view: duplicates ? "duplicates" : undefined,
        q: searchDebounced,
        sortMode: sort,
      })
    },
    [searchDebounced, sort, syncUrl]
  )

  const setFilterTrash = useCallback(
    (trash: boolean | undefined) => {
      setFilterTrashState(trash)
      syncUrl({
        folderId: undefined,
        tag: undefined,
        view: trash ? "trash" : undefined,
        q: searchDebounced,
        sortMode: sort,
      })
    },
    [searchDebounced, sort, syncUrl]
  )

  const setFilterType = useCallback(
    (type: "BOOKMARK" | "NOTE" | undefined) => {
      setFilterTypeState(type)
      syncUrl({
        folderId: undefined,
        tag: undefined,
        view: type === "NOTE" ? "notes" : type === "BOOKMARK" ? "bookmarks" : undefined,
        q: searchDebounced,
        sortMode: sort,
      })
    },
    [searchDebounced, sort, syncUrl]
  )

  const setFilterContentType = useCallback(
    (ct: string | undefined) => {
      setFilterContentTypeState(ct)
      syncUrl({
        folderId: undefined,
        tag: undefined,
        view: ct === "VIDEO" ? "media" : undefined,
        q: searchDebounced,
        sortMode: sort,
      })
    },
    [searchDebounced, sort, syncUrl]
  )

  const handleSortChange = useCallback(
    (value: BookmarkSort) => {
      setSortState(value)
      try {
        localStorage.setItem("cabinet_sort", value)
      } catch {}
      syncUrl({
        folderId: selectedFolderId,
        tag: selectedTag,
        view: currentView,
        q: searchDebounced,
        sortMode: value,
        replace: true,
      })
    },
    [selectedFolderId, selectedTag, currentView, searchDebounced, syncUrl]
  )

  const handleDisplayPreferencesChange = useCallback(
    (prefs: DisplayPreferences) => {
      setDisplayPreferences(prefs)
      try {
        localStorage.setItem(
          "cabinet_display_preferences",
          JSON.stringify(prefs)
        )
      } catch {}
    },
    []
  )

  const handleViewModeChange = useCallback((mode: "list" | "moodboard") => {
    setViewMode(mode)
    try {
      localStorage.setItem("cabinet_view_mode", mode)
    } catch {}
  }, [])

  const handleColumnCountChange = useCallback((count: number) => {
    setColumnCount(count)
    try {
      localStorage.setItem("cabinet_column_count", count.toString())
    } catch {}
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
    [setSelectedFolderId, setSelectedTag, setFilterFavorite, setFilterArchived, setFilterBroken, setFilterDuplicates, setFilterTrash]
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
    if (typeof window !== "undefined") {
      window.history.pushState(null, "", window.location.pathname)
    }
  }, [setSelectedFolderId, setSelectedTag, setFilterFavorite, setFilterArchived, setFilterBroken, setFilterDuplicates, setFilterTrash, setFilterType, setFilterContentType])

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
