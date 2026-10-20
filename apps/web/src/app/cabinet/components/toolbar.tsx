import React from "react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
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
import { Input } from "@/components/ui/input"
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldError,
} from "@/components/ui/field"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import {
  SortAscending,
  MagnifyingGlass,
  Plus,
  SquaresFour,
  List,
  Cards,
  Sparkle,
  CaretDown,
  Faders,
  ClipboardText,
  BookmarkSimple,
  FileText,
} from "@phosphor-icons/react"
import { AXIOS_INSTANCE } from "@/lib/api-client"
import { Spinner } from "@/components/ui/spinner"
import { Item } from "@/components/ui/item"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import {
  Combobox,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxGroup,
  ComboboxLabel,
  ComboboxEmpty,
  ComboboxChipsInput,
  ComboboxTrigger,
  useComboboxAnchor,
  ComboboxAnchor,
} from "@/components/ui/combobox"
import {
  TagsInput,
  TagsInputList,
  TagsInputInput,
  TagsInputItem,
} from "@/components/ui/tags-input"

import { bookmarkSortOptions, isBookmarkSort, type BookmarkSort } from "@/lib/bookmark-order"

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
  columnCount = 3,
  onColumnCountChange = () => {},
  onOpenMobileFilters,
  activeFilterLabel,
  onOpenCommandMenu,
}: ToolbarProps) {
  const router = useRouter()
  const [isScraping, setIsScraping] = React.useState(false)
  const [tagInputValue, setTagInputValue] = React.useState("")
  const filteredTags = React.useMemo(() => {
    const query = tagInputValue.trim().toLowerCase().replace(/^#/, "")
    if (!query) return tags
    return tags.filter((t: any) => t.name.toLowerCase().includes(query))
  }, [tags, tagInputValue])
  const anchorRef = useComboboxAnchor()

  const handleCreate = (type: "BOOKMARK" | "NOTE") => {
    if (type === "NOTE") {
      resetBookmarkForm()
      setIsBookmarkModalOpen(false)
      const params = new URLSearchParams({ new: "1" })
      if (bookmarkForm.state.values.folderId)
        params.set("folder", bookmarkForm.state.values.folderId)
      router.push(`/cabinet/notes/${crypto.randomUUID()}?${params}`)
      return
    }
    resetBookmarkForm()
    setTagInputValue("")
    setIsBookmarkModalOpen(true)
  }

  const handleScrape = async (url: string) => {
    if (!url) return
    let targetUrl = url.trim()
    if (!/^https?:\/\//i.test(targetUrl)) {
      targetUrl = "https://" + targetUrl
      bookmarkForm.setFieldValue("url", targetUrl)
    }
    setIsScraping(true)
    try {
      const res = await AXIOS_INSTANCE.get("/v1/bookmarks/scrape", {
        params: { url: targetUrl },
      })
      const data = res.data
      if (data && data.success && data.data) {
        const metadata = data.data
        if (metadata.title) {
          bookmarkForm.setFieldValue("title", metadata.title)
        }
        if (metadata.description) {
          bookmarkForm.setFieldValue("description", metadata.description)
        }
      }
    } catch (err) {
      console.error("Failed to scrape URL:", err)
    } finally {
      setIsScraping(false)
    }
  }

  const handlePasteFromClipboard = async () => {
    try {
      if (navigator.clipboard?.readText) {
        const text = await navigator.clipboard.readText()
        if (text) {
          const trimmed = text.trim()
          bookmarkForm.setFieldValue("url", trimmed)
          handleScrape(trimmed)
        }
      }
    } catch (err) {
      console.warn("Clipboard access denied or unavailable", err)
    }
  }

  return (
    <div className="flex flex-col justify-between gap-2.5 rounded-none bg-white py-1 shadow-none sm:flex-row sm:items-center">
      {/* Mobile Top Bar (visible on < md): Active Filter Label + View Mode Toggles */}
      <div className="flex items-center justify-between gap-2 md:hidden">
        <div className="flex items-center gap-2">
          <span className="font-serif text-base font-medium text-brand-charcoal">
            {activeFilterLabel || "All Bookmarks"}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <ButtonGroup className="shrink-0 border border-brand-border bg-brand-charcoal/5 p-0.5">
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

      <div className="flex w-full min-w-0 flex-col gap-2.5 sm:flex-1 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
        {/* Search Input */}
        <InputGroup className="h-9 w-full sm:min-w-40 sm:max-w-md sm:flex-1">
          <InputGroupInput
            type="text"
            placeholder="Search titles, descriptions, URLs... (⌘K)"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="text-xs"
          />
          <InputGroupAddon align="inline-start">
            <MagnifyingGlass className="text-brand-muted" />
          </InputGroupAddon>
          {onOpenCommandMenu && (
            <InputGroupAddon align="inline-end" className="hidden sm:flex">
              <kbd
                onClick={onOpenCommandMenu}
                className="cursor-pointer border border-border bg-muted/60 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground hover:bg-muted"
                title="Open Command Menu (⌘K)"
              >
                ⌘K
              </kbd>
            </InputGroupAddon>
          )}
        </InputGroup>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="h-9 max-w-full shrink-0" disabled={sortDisabled} aria-label="Sort bookmarks">
              <SortAscending data-icon="inline-start" />
              <span className="truncate">{bookmarkSortOptions.find((option) => option.value === sort)?.label}</span>
              <CaretDown data-icon="inline-end" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuRadioGroup value={sort} onValueChange={(value) => {
              if (isBookmarkSort(value)) onSortChange?.(value)
            }}>
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
          <ButtonGroup className="shrink-0 border border-brand-border bg-brand-charcoal/5 p-0.5">
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
              <TooltipContent>Moodboard View</TooltipContent>
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
              <TooltipContent>List View</TooltipContent>
            </Tooltip>
          </ButtonGroup>

          {viewMode === "moodboard" && (
            <Select
              value={columnCount.toString()}
              onValueChange={(val) => onColumnCountChange(parseInt(val, 10))}
            >
              <SelectTrigger className="h-8 w-24 rounded-none border-brand-border bg-white px-2 text-[10px] font-bold tracking-wider text-brand-charcoal uppercase focus-visible:ring-1 focus-visible:ring-brand-charcoal/30 focus-visible:outline-none">
                <SelectValue placeholder="COLUMNS" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 Col</SelectItem>
                <SelectItem value="2">2 Cols</SelectItem>
                <SelectItem value="3">3 Cols</SelectItem>
                <SelectItem value="4">4 Cols</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      <Dialog open={isBookmarkModalOpen} onOpenChange={setIsBookmarkModalOpen}>
        <ButtonGroup
          className="hidden shrink-0 sm:flex"
          aria-label="Add to Cabinet"
        >
          <DialogTrigger asChild>
            <Button onClick={() => handleCreate("BOOKMARK")} className="h-9">
              <Plus data-icon="inline-start" />
              Add
            </Button>
          </DialogTrigger>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                className="h-9 border-l border-primary-foreground/20"
                size="icon"
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

        <DialogContent className="w-[calc(100vw-2rem)] max-w-2xl rounded-none sm:w-full sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {bookmarkToEdit ? "Edit bookmark" : "New bookmark"}
            </DialogTitle>
            <DialogDescription>
              Save a link with auto-extracted metadata.
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={(e) => {
              e.preventDefault()
              e.stopPropagation()
              bookmarkForm.handleSubmit()
            }}
            className="space-y-4"
          >
            <FieldGroup>
              <bookmarkForm.Subscribe
                selector={(state: any) => state.values.type}
                children={(currentType: string) => {
                  if (currentType === "NOTE") return null
                  return (
                    <bookmarkForm.Field
                      name="url"
                      children={(field: any) => {
                        const isInvalid =
                          field.state.meta.isTouched &&
                          !field.state.meta.isValid
                        return (
                          <Field data-invalid={isInvalid}>
                            <FieldLabel htmlFor={field.name}>URL</FieldLabel>
                            <div className="flex flex-col gap-2 sm:flex-row">
                              <Input
                                id={field.name}
                                name={field.name}
                                value={field.state.value}
                                onBlur={field.handleBlur}
                                onChange={(e) =>
                                  field.handleChange(e.target.value)
                                }
                                aria-invalid={isInvalid}
                                placeholder="https://example.com"
                                type="url"
                                className="flex-1"
                              />
                              <div className="flex shrink-0 items-center gap-1.5">
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={handlePasteFromClipboard}
                                  className="flex h-9 flex-1 items-center justify-center gap-1 rounded-none border border-brand-border px-2.5 font-mono text-[10px] font-semibold uppercase hover:bg-brand-canvas sm:flex-initial"
                                  title="Paste from clipboard and auto-fill"
                                >
                                  <ClipboardText className="size-3.5" />
                                  Paste
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  disabled={!field.state.value || isScraping}
                                  onClick={() =>
                                    handleScrape(field.state.value)
                                  }
                                  className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-none border border-brand-border px-3 font-mono text-[10px] font-semibold uppercase hover:bg-brand-canvas sm:flex-initial"
                                >
                                  {isScraping ? (
                                    <>
                                      <Spinner className="size-3.5" />
                                      Scraping...
                                    </>
                                  ) : (
                                    <>
                                      <Sparkle className="size-3.5" />
                                      Auto Fill
                                    </>
                                  )}
                                </Button>
                              </div>
                            </div>
                            {isInvalid && (
                              <FieldError
                                errors={field.state.meta.errors.map(
                                  (err: any) =>
                                    typeof err === "string"
                                      ? { message: err }
                                      : err
                                )}
                              />
                            )}
                          </Field>
                        )
                      }}
                    />
                  )
                }}
              />

              <bookmarkForm.Field
                name="title"
                children={(field: any) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>
                        Title (Optional)
                      </FieldLabel>
                      <Input
                        id={field.name}
                        name={field.name}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        aria-invalid={isInvalid}
                        placeholder="Leave blank to fetch from URL metadata"
                      />
                      {isInvalid && (
                        <FieldError
                          errors={field.state.meta.errors.map((err: any) =>
                            typeof err === "string" ? { message: err } : err
                          )}
                        />
                      )}
                    </Field>
                  )
                }}
              />

              <bookmarkForm.Field
                name="description"
                children={(field: any) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>
                        Description (Optional)
                      </FieldLabel>
                      <Input
                        id={field.name}
                        name={field.name}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        aria-invalid={isInvalid}
                        placeholder="Short summary (optional)"
                      />
                      {isInvalid && (
                        <FieldError
                          errors={field.state.meta.errors.map((err: any) =>
                            typeof err === "string" ? { message: err } : err
                          )}
                        />
                      )}
                    </Field>
                  )
                }}
              />

              <div className="grid grid-cols-2 gap-4">
                <bookmarkForm.Field
                  name="folderId"
                  children={(field: any) => {
                    const isInvalid =
                      field.state.meta.isTouched && !field.state.meta.isValid
                    return (
                      <Field data-invalid={isInvalid}>
                        <FieldLabel htmlFor={field.name}>Folder</FieldLabel>
                        <Select
                          value={field.state.value}
                          onValueChange={(val) => field.handleChange(val)}
                        >
                          <SelectTrigger
                            aria-invalid={isInvalid}
                            className="h-10 w-full rounded-none border border-brand-border bg-white px-3 text-sm font-medium text-brand-charcoal focus-visible:ring-1 focus-visible:ring-brand-charcoal/30 focus-visible:outline-none"
                          >
                            <SelectValue placeholder="None (Root)" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">None (Root)</SelectItem>
                            {folders.map((f: any) => (
                              <SelectItem key={f.id} value={f.id}>
                                {f.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {isInvalid && (
                          <FieldError
                            errors={field.state.meta.errors.map((err: any) =>
                              typeof err === "string" ? { message: err } : err
                            )}
                          />
                        )}
                      </Field>
                    )
                  }}
                />

                <bookmarkForm.Field
                  name="tags"
                  children={(field: any) => {
                    const isInvalid =
                      field.state.meta.isTouched && !field.state.meta.isValid
                    return (
                      <Field data-invalid={isInvalid}>
                        <FieldLabel htmlFor={field.name}>Tags</FieldLabel>
                        <Combobox
                          value={field.state.value || []}
                          onValueChange={(val) => {
                            const formatted = val.map((t: string) =>
                              t.startsWith("#") ? t : `#${t}`
                            )
                            field.handleChange(formatted)
                            setTagInputValue("")
                          }}
                          inputValue={tagInputValue}
                          onInputValueChange={setTagInputValue}
                        >
                          <ComboboxAnchor className="w-full">
                            <TagsInput
                              value={field.state.value || []}
                              onValueChange={(val) => {
                                const formatted = val.map((t: string) =>
                                  t.startsWith("#") ? t : `#${t}`
                                )
                                field.handleChange(formatted)
                                setTagInputValue("")
                              }}
                              className="w-full gap-0"
                            >
                              <TagsInputList className="flex min-h-10 w-full flex-wrap items-center gap-1.5 rounded-none border border-brand-border bg-white px-3 py-1.5 text-sm text-brand-charcoal focus-within:ring-1 focus-within:ring-brand-charcoal/30">
                                {(field.state.value || []).map(
                                  (tag: string) => (
                                    <TagsInputItem
                                      key={tag}
                                      value={tag}
                                      className="gap-1 rounded-none border-brand-border bg-brand-charcoal/5 px-2 py-0.5 text-xs text-brand-charcoal"
                                    >
                                      {tag}
                                    </TagsInputItem>
                                  )
                                )}
                                <ComboboxChipsInput
                                  render={
                                    <TagsInputInput
                                      placeholder="Select or add tags..."
                                      className="flex-1 text-xs text-brand-charcoal outline-none placeholder:text-brand-muted focus:outline-none"
                                    />
                                  }
                                />
                              </TagsInputList>
                            </TagsInput>
                          </ComboboxAnchor>
                          <ComboboxContent className="z-50 max-h-60 w-[var(--radix-popover-trigger-width)] overflow-y-auto rounded-none border border-brand-border bg-white p-1 shadow-sm">
                            <ComboboxList className="no-scrollbar max-h-[200px] overflow-y-auto overscroll-contain">
                              {filteredTags.length === 0 ? (
                                <ComboboxEmpty className="py-4 text-center text-xs text-brand-muted">
                                  {tagInputValue.trim()
                                    ? `Press enter to create "${tagInputValue}"`
                                    : "No tags found."}
                                </ComboboxEmpty>
                              ) : (
                                <ComboboxGroup>
                                  {filteredTags.map((tag: any) => {
                                    const tagValue = `#${tag.name}`
                                    return (
                                      <ComboboxItem
                                        key={tag.id}
                                        value={tagValue}
                                        onSelect={() => {
                                          const isSelected = (
                                            field.state.value || []
                                          ).includes(tagValue)
                                          const nextValue = isSelected
                                            ? (field.state.value || []).filter(
                                                (t: string) => t !== tagValue
                                              )
                                            : [
                                                ...(field.state.value || []),
                                                tagValue,
                                              ]
                                          field.handleChange(nextValue)
                                          setTagInputValue("")
                                        }}
                                        className="flex cursor-pointer items-center justify-between px-3 py-2 text-xs text-brand-charcoal hover:bg-brand-canvas"
                                      >
                                        <span>{tagValue}</span>
                                      </ComboboxItem>
                                    )
                                  })}
                                </ComboboxGroup>
                              )}
                            </ComboboxList>
                          </ComboboxContent>
                        </Combobox>
                        {isInvalid && (
                          <FieldError
                            errors={field.state.meta.errors.map((err: any) =>
                              typeof err === "string" ? { message: err } : err
                            )}
                          />
                        )}
                      </Field>
                    )
                  }}
                />
              </div>
            </FieldGroup>

            <div className="flex gap-2.5 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsBookmarkModalOpen(false)}
                className="flex-1 text-xs uppercase"
              >
                Cancel
              </Button>
              <bookmarkForm.Subscribe
                selector={(state: any) => state.isSubmitting}
                children={(isSubmitting: boolean) => (
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex flex-1 items-center justify-center gap-1.5 bg-brand-charcoal text-xs uppercase hover:bg-brand-charcoal/90"
                  >
                    {isSubmitting && <Spinner className="h-3.5 w-3.5" />}
                    Save bookmark
                  </Button>
                )}
              />
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
