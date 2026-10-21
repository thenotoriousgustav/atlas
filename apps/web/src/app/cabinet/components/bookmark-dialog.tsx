"use client"

import React, { useState, useMemo } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
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
  SelectGroup,
  SelectItem,
} from "@/components/ui/select"
import {
  Combobox,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxGroup,
  ComboboxEmpty,
  ComboboxChipsInput,
  ComboboxAnchor,
} from "@/components/ui/combobox"
import {
  TagsInput,
  TagsInputList,
  TagsInputInput,
  TagsInputItem,
} from "@/components/ui/tags-input"
import { Spinner } from "@/components/ui/spinner"
import { ClipboardText, Sparkle } from "@phosphor-icons/react"
import { AXIOS_INSTANCE } from "@/lib/api-client"
import { DuplicateBookmarkNotice } from "./duplicate-bookmark-notice"

interface BookmarkDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  bookmarkToEdit: any | null
  bookmarkForm: any
  folders: any[]
  tags?: any[]
  onClose: () => void
}

export function BookmarkDialog({
  isOpen,
  onOpenChange,
  bookmarkToEdit,
  bookmarkForm,
  folders,
  tags = [],
  onClose,
}: BookmarkDialogProps) {
  const [isScraping, setIsScraping] = useState(false)
  const [tagInputValue, setTagInputValue] = useState("")

  const filteredTags = useMemo(() => {
    const query = tagInputValue.trim().toLowerCase().replace(/^#/, "")
    if (!query) return tags
    return tags.filter((t: any) => t.name.toLowerCase().includes(query))
  }, [tags, tagInputValue])

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
      if (data?.success && data?.data) {
        const metadata = data.data
        if (metadata.title) bookmarkForm.setFieldValue("title", metadata.title)
        if (metadata.description) bookmarkForm.setFieldValue("description", metadata.description)
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
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-2xl sm:w-full sm:max-w-2xl">
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
          className="flex flex-col gap-4"
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
                        field.state.meta.isTouched && !field.state.meta.isValid
                      return (
                        <Field data-invalid={isInvalid}>
                          <FieldLabel htmlFor={field.name}>URL</FieldLabel>
                          <div className="flex flex-col gap-2 sm:flex-row">
                            <Input
                              id={field.name}
                              name={field.name}
                              value={field.state.value}
                              onBlur={field.handleBlur}
                              onChange={(e) => field.handleChange(e.target.value)}
                              aria-invalid={isInvalid}
                              placeholder="Paste a link"
                              type="url"
                              className="flex-1"
                            />
                            <div className="flex shrink-0 items-center gap-1.5">
                              <Button
                                type="button"
                                variant="outline"
                                onClick={handlePasteFromClipboard}
                                className="flex h-11 flex-1 items-center justify-center gap-1 rounded-md border border-border px-2.5 text-sm font-medium hover:bg-muted sm:h-9 sm:flex-initial"
                                title="Paste from clipboard and auto-fill"
                              >
                                <ClipboardText className="size-3.5" />
                                Paste
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                disabled={!field.state.value || isScraping}
                                onClick={() => handleScrape(field.state.value)}
                                className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-md border border-border px-3 text-sm font-medium hover:bg-muted sm:h-9 sm:flex-initial"
                              >
                                {isScraping ? (
                                  <>
                                    <Spinner className="size-3.5" />
                                    Fetching…
                                  </>
                                ) : (
                                  <>
                                    <Sparkle className="size-3.5" />
                                    Auto-fill
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                          <DuplicateBookmarkNotice url={field.state.value} excludeId={bookmarkToEdit?.id} />
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
                    <FieldLabel htmlFor={field.name}>Title (Optional)</FieldLabel>
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
                    <FieldLabel htmlFor={field.name}>Description (Optional)</FieldLabel>
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

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <bookmarkForm.Field
                name="folderId"
                children={(field: any) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>Folder</FieldLabel>
                      <Select
                        value={field.state.value || '__root__'}
                        onValueChange={(val) => field.handleChange(val === '__root__' ? '' : val)}
                      >
                        <SelectTrigger
                          id={field.name}
                          aria-invalid={isInvalid}
                          className="h-10 w-full rounded-md border border-input bg-background px-3 text-base text-foreground focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none md:text-sm"
                        >
                          <SelectValue placeholder="Unfiled" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                          <SelectItem value="__root__">Unfiled</SelectItem>
                          {folders.map((f: any) => (
                            <SelectItem key={f.id} value={f.id}>
                              {f.name}
                            </SelectItem>
                          ))}
                          </SelectGroup>
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
                            <TagsInputList className="flex min-h-10 w-full flex-wrap items-center gap-1.5 rounded-md border border-input bg-background px-3 py-1.5 text-sm text-foreground focus-within:ring-1 focus-within:ring-ring">
                              {(field.state.value || []).map((tag: string) => (
                                <TagsInputItem
                                  key={tag}
                                  value={tag}
                                  className="gap-1 rounded-sm border-border bg-muted/50 px-2 py-0.5 text-xs text-foreground"
                                >
                                  {tag}
                                </TagsInputItem>
                              ))}
                              <ComboboxChipsInput
                                render={
                                  <TagsInputInput
                                    placeholder="Select or add tags..."
                                    className="flex-1 text-base text-foreground outline-none placeholder:text-muted-foreground focus:outline-none md:text-sm"
                                  />
                                }
                              />
                            </TagsInputList>
                          </TagsInput>
                        </ComboboxAnchor>
                        <ComboboxContent className="z-50 max-h-60 w-[var(--radix-popover-trigger-width)] overflow-y-auto rounded-lg border border-border bg-popover p-1 shadow-sm">
                          <ComboboxList className="no-scrollbar max-h-[200px] overflow-y-auto overscroll-contain">
                            {filteredTags.length === 0 ? (
                              <ComboboxEmpty className="py-4 text-center text-xs text-muted-foreground">
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
                                        const isSelected = (field.state.value || []).includes(tagValue)
                                        const nextValue = isSelected
                                          ? (field.state.value || []).filter((t: string) => t !== tagValue)
                                          : [...(field.state.value || []), tagValue]
                                        field.handleChange(nextValue)
                                        setTagInputValue("")
                                      }}
                                      className="flex cursor-pointer items-center justify-between px-3 py-2 text-xs text-foreground hover:bg-muted"
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
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <bookmarkForm.Subscribe
              selector={(state: any) => state.isSubmitting}
              children={(isSubmitting: boolean) => (
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex flex-1 items-center justify-center gap-1.5"
                >
                  {isSubmitting && <Spinner className="h-3.5 w-3.5" />}
                  {bookmarkToEdit ? "Save changes" : "Save bookmark"}
                </Button>
              )}
            />
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
