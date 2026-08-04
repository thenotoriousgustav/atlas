import React from "react"
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@atlas/ui/components/dialog"
import { Button } from "@atlas/ui/components/button"
import { ButtonGroup } from "@atlas/ui/components/button-group"
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@atlas/ui/components/tooltip"
import { Input } from "@atlas/ui/components/input"
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldError,
} from "@atlas/ui/components/field"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@atlas/ui/components/select"
import {
  MagnifyingGlass,
  Plus,
  SquaresFour,
  List,
  Cards,
  Sparkle,
  CaretDown,
} from "@phosphor-icons/react"
import { AXIOS_INSTANCE } from "@atlas/api-client"
import { Spinner } from "@atlas/ui/components/spinner"
import { Item } from "@atlas/ui/components/item"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@atlas/ui/components/input-group"
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
} from "@atlas/ui/components/combobox"
import {
  TagsInput,
  TagsInputList,
  TagsInputInput,
  TagsInputItem,
} from "@atlas/ui/components/tags-input"

interface ToolbarProps {
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
}

export function Toolbar({
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
}: ToolbarProps) {
  const [isScraping, setIsScraping] = React.useState(false)
  const [tagInputValue, setTagInputValue] = React.useState("")
  const filteredTags = React.useMemo(() => {
    const query = tagInputValue.trim().toLowerCase().replace(/^#/, "")
    if (!query) return tags
    return tags.filter((t: any) => t.name.toLowerCase().includes(query))
  }, [tags, tagInputValue])
  const anchorRef = useComboboxAnchor()
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

  return (
    <Item
      variant="outline"
      className="flex-col justify-between gap-3 rounded-none bg-white p-3.5 shadow-none sm:flex-row"
    >
      <div className="flex w-full items-center gap-3 sm:flex-1">
        <InputGroup className="h-9 w-full sm:max-w-md">
          <InputGroupInput
            type="text"
            placeholder="Search titles, descriptions, URLs..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="text-xs"
          />
          <InputGroupAddon align="inline-start">
            <MagnifyingGlass className="text-brand-muted" />
          </InputGroupAddon>
        </InputGroup>

        {/* View Mode Toggle Group */}
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

      <Dialog open={isBookmarkModalOpen} onOpenChange={setIsBookmarkModalOpen}>
        <DialogTrigger asChild>
          <Button
            onClick={() => {
              resetBookmarkForm()
              setIsBookmarkModalOpen(true)
            }}
            className="flex h-9 w-full items-center gap-1.5 bg-brand-charcoal text-xs font-semibold uppercase hover:bg-brand-charcoal/90 sm:w-auto"
          >
            <Plus className="h-4 w-4" />
            Add Bookmark
          </Button>
        </DialogTrigger>

        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {bookmarkToEdit ? "Edit Bookmark" : "New Bookmark"}
            </DialogTitle>
            <DialogDescription>Resource collection</DialogDescription>
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
              <bookmarkForm.Field
                name="url"
                children={(field: any) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>URL</FieldLabel>
                      <div className="flex gap-2">
                        <Input
                          id={field.name}
                          name={field.name}
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          aria-invalid={isInvalid}
                          placeholder="https://example.com"
                          type="url"
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          disabled={!field.state.value || isScraping}
                          onClick={() => handleScrape(field.state.value)}
                          className="flex h-8 shrink-0 items-center gap-1.5 border border-brand-border px-3 font-mono text-[10px] font-semibold uppercase hover:bg-brand-canvas"
                        >
                          {isScraping ? (
                            <>
                              <Spinner className="h-3.5 w-3.5" />
                              Scraping...
                            </>
                          ) : (
                            <>
                              <Sparkle className="h-3.5 w-3.5" />
                              Auto Fill
                            </>
                          )}
                        </Button>
                      </div>
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
                        placeholder="Optional notes or details"
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
                selector={(state: any) => [state.isSubmitting]}
                children={([isSubmitting]: [boolean]) => (
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex flex-1 items-center justify-center gap-1.5 bg-brand-charcoal text-xs uppercase hover:bg-brand-charcoal/90"
                  >
                    {isSubmitting && <Spinner className="h-3.5 w-3.5" />}
                    Save Bookmark
                  </Button>
                )}
              />
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </Item>
  )
}
