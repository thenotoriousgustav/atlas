"use client"

import React from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ButtonGroup } from "@/components/ui/button-group"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectItem,
} from "@/components/ui/select"
import {
  SortAscending,
  MagnifyingGlass,
  Plus,
  SquaresFour,
  List,
  CaretDown,
  BookmarkSimple,
  FileText,
} from "@phosphor-icons/react"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { bookmarkSortOptions, isBookmarkSort, type BookmarkSort } from "@/lib/bookmark-order"
import { BookmarkDialog } from "./bookmark-dialog"

interface ToolbarProps {
  sort?: BookmarkSort
  onSortChange?: (sort: BookmarkSort) => void
  sortDisabled?: boolean
  searchQuery: string
  onSearchChange: (value: string) => void
  isBookmarkModalOpen: boolean
  setIsBookmarkModalOpen: (open: boolean) => void
  bookmarkToEdit: any
  bookmarkForm: any
  folders: any[]
  tags?: any[]
  resetBookmarkForm: () => void
  viewMode: "list" | "moodboard"
  onViewModeChange: (mode: "list" | "moodboard") => void
  columnCount?: number
  onColumnCountChange?: (count: number) => void
  onOpenMobileFilters?: () => void
  activeFilterLabel?: string
  onOpenCommandMenu?: () => void
}

export function Toolbar({
  sort = "custom",
  onSortChange,
  sortDisabled = false,
  searchQuery,
  onSearchChange,
  isBookmarkModalOpen,
  setIsBookmarkModalOpen,
  bookmarkToEdit,
  bookmarkForm,
  folders,
  tags = [],
  resetBookmarkForm,
  viewMode,
  onViewModeChange,
  columnCount = 4,
  onColumnCountChange = () => {},
  activeFilterLabel,
}: ToolbarProps) {
  const router = useRouter()

  const handleCreate = (type: "BOOKMARK" | "NOTE") => {
    if (type === "NOTE") {
      resetBookmarkForm()
      setIsBookmarkModalOpen(false)
      const params = new URLSearchParams({ new: "1" })
      if (bookmarkForm.state.values.folderId) {
        params.set("folder", bookmarkForm.state.values.folderId)
      }
      router.push(`/cabinet/notes/${crypto.randomUUID()}?${params}`)
      return
    }
    resetBookmarkForm()
    setIsBookmarkModalOpen(true)
  }

  return (
    <div className="flex w-full flex-col justify-between gap-2 rounded-none bg-transparent py-0 shadow-none sm:flex-row sm:items-center sm:justify-end sm:gap-2.5">
      {/* Mobile Top Bar (visible on < md): Active Filter Label + View Mode Toggles */}
      <div className="flex items-center justify-between gap-2 md:hidden">
        <div className="flex items-center gap-2">
          <span className="font-serif text-sm font-medium text-foreground">
            {activeFilterLabel || "All Bookmarks"}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <ButtonGroup className="shrink-0 border border-brand-border bg-muted/40 p-0.5">
            <Button
              onClick={() => onViewModeChange("moodboard")}
              variant={viewMode === "moodboard" ? "default" : "ghost"}
              size="icon-xs"
              className="size-7"
              title="Moodboard View"
            >
              <SquaresFour className="h-3.5 w-3.5" />
            </Button>
            <Button
              onClick={() => onViewModeChange("list")}
              variant={viewMode === "list" ? "default" : "ghost"}
              size="icon-xs"
              className="size-7"
              title="List View"
            >
              <List className="h-3.5 w-3.5" />
            </Button>
          </ButtonGroup>
        </div>
      </div>

      <div className="flex w-full min-w-0 flex-col gap-2 sm:flex-1 sm:flex-row sm:items-center sm:justify-end sm:gap-2.5">
        {/* Search Input */}
        <InputGroup className="h-8 w-full sm:w-52 md:w-60 lg:w-72">
          <InputGroupInput
            id="cabinet-search-input"
            type="text"
            placeholder="Search titles, descriptions... (/)"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="text-xs"
          />
          <InputGroupAddon align="inline-start">
            <MagnifyingGlass className="text-brand-muted" />
          </InputGroupAddon>
          <InputGroupAddon align="inline-end" className="hidden sm:flex">
            <kbd
              onClick={() => {
                const input = document.getElementById("cabinet-search-input") as HTMLInputElement | null
                input?.focus()
                input?.select()
              }}
              className="cursor-pointer border border-border bg-muted/60 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground hover:bg-muted"
              title="Focus Search (/)"
            >
              /
            </kbd>
          </InputGroupAddon>
        </InputGroup>

        {/* Sort Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="h-8 max-w-full shrink-0 text-xs"
              disabled={sortDisabled}
              aria-label="Sort bookmarks"
            >
              <SortAscending data-icon="inline-start" />
              <span className="truncate">
                {bookmarkSortOptions.find((option) => option.value === sort)?.label}
              </span>
              <CaretDown data-icon="inline-end" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuRadioGroup
              value={sort}
              onValueChange={(value) => {
                if (isBookmarkSort(value)) onSortChange?.(value)
              }}
            >
              {bookmarkSortOptions.map((option) => (
                <DropdownMenuRadioItem key={option.value} value={option.value}>
                  {option.label}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* View Mode & Column Toggles for Desktop */}
        <div className="hidden items-center justify-between gap-2 sm:justify-start md:flex">
          <ButtonGroup className="shrink-0 border border-brand-border bg-muted/30 p-0.5">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={() => onViewModeChange("moodboard")}
                  variant={viewMode === "moodboard" ? "default" : "ghost"}
                  size="icon-xs"
                  className="size-7"
                >
                  <SquaresFour className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Moodboard View (2)</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={() => onViewModeChange("list")}
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="icon-xs"
                  className="size-7"
                >
                  <List className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>List View (1)</TooltipContent>
            </Tooltip>
          </ButtonGroup>

          {viewMode === "moodboard" && (
            <Select
              value={columnCount.toString()}
              onValueChange={(val) => onColumnCountChange(parseInt(val, 10))}
            >
              <SelectTrigger aria-label="Maximum moodboard columns" title="Maximum columns; adapts to available space" className="h-8 w-20 rounded-none border-brand-border bg-background px-2 text-[10px] font-bold tracking-wider text-foreground uppercase focus-visible:ring-1 focus-visible:ring-brand-charcoal/30 focus-visible:outline-none">
                <SelectValue placeholder="COLS" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="1">1 Col</SelectItem>
                  <SelectItem value="2">2 Cols</SelectItem>
                  <SelectItem value="3">3 Cols</SelectItem>
                  <SelectItem value="4">4 Cols</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* Add Button & Dropdown */}
      <ButtonGroup className="hidden shrink-0 sm:flex" aria-label="Add to Cabinet">
        <Button onClick={() => handleCreate("BOOKMARK")} className="h-8">
          <Plus data-icon="inline-start" />
          Add
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              className="h-8 border-l border-primary-foreground/20"
              size="icon-xs"
              aria-label="Choose what to add"
            >
              <CaretDown />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuGroup>
              <DropdownMenuItem onSelect={() => handleCreate("BOOKMARK")}>
                <BookmarkSimple /> Add bookmark
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => handleCreate("NOTE")}>
                <FileText /> Create note
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </ButtonGroup>

      {/* Extracted Bookmark Form Dialog */}
      <BookmarkDialog
        isOpen={isBookmarkModalOpen}
        onOpenChange={setIsBookmarkModalOpen}
        bookmarkToEdit={bookmarkToEdit}
        bookmarkForm={bookmarkForm}
        folders={folders}
        tags={tags}
        onClose={() => setIsBookmarkModalOpen(false)}
      />
    </div>
  )
}
