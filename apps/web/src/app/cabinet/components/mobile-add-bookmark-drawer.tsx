"use client"

import React, { useState } from "react"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer"
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
import { ClipboardText, Sparkle, X } from "@phosphor-icons/react"
import { Spinner } from "@/components/ui/spinner"
import { AXIOS_INSTANCE } from "@/lib/api-client"
import { DuplicateBookmarkNotice } from "./duplicate-bookmark-notice"
import {
  TagsInput,
  TagsInputList,
  TagsInputInput,
  TagsInputItem,
} from "@/components/ui/tags-input"

interface MobileAddBookmarkDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  bookmarkForm: any
  bookmarkToEdit: any
  folders: any[]
}

export function MobileAddBookmarkDrawer({
  open,
  onOpenChange,
  bookmarkForm,
  bookmarkToEdit,
  folders,
}: MobileAddBookmarkDrawerProps) {
  const [isScraping, setIsScraping] = useState(false)

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

  const handleQuickPasteAndScrape = async () => {
    try {
      if (navigator.clipboard?.readText) {
        const text = await navigator.clipboard.readText()
        if (text) {
          const trimmed = text.trim()
          bookmarkForm.setFieldValue("url", trimmed)
          await handleScrape(trimmed)
        }
      }
    } catch (err) {
      console.warn("Clipboard access denied or unavailable", err)
    }
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90dvh] rounded-t-xl border-t border-border bg-card pb-[calc(env(safe-area-inset-bottom)+1rem)]">
        {/* Header */}
        <DrawerHeader className="border-b border-brand-border px-5 py-3 text-left">
          <div className="flex items-center justify-between">
            <div>
              <DrawerTitle className="text-lg font-medium text-foreground">
                {bookmarkToEdit ? "Edit bookmark" : "New bookmark"}
              </DrawerTitle>
              <DrawerDescription className="text-sm text-muted-foreground">
                Save link with auto-extracted metadata
              </DrawerDescription>
            </div>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="flex size-11 items-center justify-center text-muted-foreground hover:text-foreground"
              aria-label="Close bookmark form"
            >
              <X className="size-4" />
            </button>
          </div>
        </DrawerHeader>

        {/* Scrollable Form Body */}
        <div className="overflow-y-auto px-5 py-4">
          {/* Quick Paste & Auto-Fill Callout Button (Mobile First) */}
          {!bookmarkToEdit && (
            <button
              type="button"
              onClick={handleQuickPasteAndScrape}
              className="mb-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-md border border-border bg-muted/40 px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              <ClipboardText className="size-4 text-brand-muted" />
              <span>Paste link and auto-fill</span>
            </button>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault()
              e.stopPropagation()
              bookmarkForm.handleSubmit()
            }}
            className="flex flex-col gap-4"
          >
            <FieldGroup>
              {/* URL */}
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
                            <div className="flex items-center justify-between">
                              <FieldLabel
                                htmlFor="mobile-url"
                                className="text-sm text-muted-foreground"
                              >
                                URL
                              </FieldLabel>
                              {field.state.value && (
                                <button
                                  type="button"
                                  disabled={isScraping}
                                  onClick={() =>
                                    handleScrape(field.state.value)
                                  }
                                  className="flex min-h-11 items-center gap-1 text-xs font-medium text-foreground hover:underline"
                                >
                                  {isScraping ? (
                                    <>
                                      <Spinner className="size-3" />
                                      <span>Fetching…</span>
                                    </>
                                  ) : (
                                    <>
                                      <Sparkle className="size-3" />
                                      <span>Auto-fill</span>
                                    </>
                                  )}
                                </button>
                              )}
                            </div>
                            <Input
                              id="mobile-url"
                              name={field.name}
                              value={field.state.value}
                              onBlur={field.handleBlur}
                              onChange={(e) =>
                                field.handleChange(e.target.value)
                              }
                              aria-invalid={isInvalid}
                              placeholder="Paste a link"
                              type="url"
                              className="h-11 text-base"
                            />
                            <DuplicateBookmarkNotice url={field.state.value} excludeId={bookmarkToEdit?.id} />
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

              {/* Title */}
              <bookmarkForm.Field
                name="title"
                children={(field: any) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel
                        htmlFor="mobile-title"
                        className="text-sm text-muted-foreground"
                      >
                        Title (Optional)
                      </FieldLabel>
                      <Input
                        id="mobile-title"
                        name={field.name}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        aria-invalid={isInvalid}
                        placeholder="Auto-fetched or custom title"
                        className="h-11 text-base"
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

              {/* Description */}
              <bookmarkForm.Field
                name="description"
                children={(field: any) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel
                        htmlFor="mobile-desc"
                        className="text-sm text-muted-foreground"
                      >
                        Description (Optional)
                      </FieldLabel>
                      <Input
                        id="mobile-desc"
                        name={field.name}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        aria-invalid={isInvalid}
                        placeholder="Short summary (optional)"
                        className="h-11 text-base"
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

              {/* Folder Selection */}
              <bookmarkForm.Field
                name="folderId"
                children={(field: any) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor="mobile-folder" className="text-sm text-muted-foreground">
                        Folder
                      </FieldLabel>
                      <Select
                        value={field.state.value || "__root__"}
                        onValueChange={(val) => field.handleChange(val === "__root__" ? "" : val)}
                      >
                        <SelectTrigger
                          aria-invalid={isInvalid}
                          id="mobile-folder"
                          className="h-11 w-full rounded-md border border-input bg-card px-3 text-base text-foreground"
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

              {/* Tags */}
              <bookmarkForm.Field
                name="tags"
                children={(field: any) => {
                  return (
                    <Field>
                      <FieldLabel htmlFor="mobile-tags" className="text-sm text-muted-foreground">
                        Tags
                      </FieldLabel>
                      <TagsInput
                        value={field.state.value || []}
                        onValueChange={(val) => {
                          const formatted = val.map((t: string) =>
                            t.startsWith("#") ? t : `#${t}`
                          )
                          field.handleChange(formatted)
                        }}
                        className="min-h-11 rounded-md border border-input bg-card p-1"
                      >
                        <TagsInputList>
                          {(field.state.value || []).map((tag: string) => (
                            <TagsInputItem key={tag} value={tag}>
                              {tag}
                            </TagsInputItem>
                          ))}
                          <TagsInputInput
                            id="mobile-tags"
                            placeholder="Add #tag and press Enter..."
                            className="text-base"
                          />
                        </TagsInputList>
                      </TagsInput>
                    </Field>
                  )
                }}
              />
            </FieldGroup>

            {/* Submit Button */}
            <div className="pt-2">
              <bookmarkForm.Subscribe selector={(state: any) => state.isSubmitting}>
                {(isSubmitting: boolean) => <Button type="submit" disabled={isSubmitting} className="h-11 w-full">
                  {isSubmitting && <Spinner />}
                  {bookmarkToEdit ? "Save changes" : "Save bookmark"}
                </Button>}
              </bookmarkForm.Subscribe>
            </div>
          </form>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
