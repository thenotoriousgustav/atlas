"use client"

import React, { useState } from "react"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@atlas/ui/components/drawer"
import { Button } from "@atlas/ui/components/button"
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
  ClipboardText,
  Sparkle,
  X,
} from "@phosphor-icons/react"
import { Spinner } from "@atlas/ui/components/spinner"
import { AXIOS_INSTANCE } from "@atlas/api-client"
import {
  TagsInput,
  TagsInputList,
  TagsInputInput,
  TagsInputItem,
} from "@atlas/ui/components/tags-input"

interface MobileAddBookmarkDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  bookmarkForm: any
  bookmarkToEdit: any
  folders: any[]
  tags?: any[]
  resetBookmarkForm: () => void
}

export function MobileAddBookmarkDrawer({
  open,
  onOpenChange,
  bookmarkForm,
  bookmarkToEdit,
  folders,
  tags = [],
  resetBookmarkForm,
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
      <DrawerContent className="max-h-[90dvh] rounded-none border-t border-brand-border bg-white pb-[calc(env(safe-area-inset-bottom)+1rem)]">
        {/* Header */}
        <DrawerHeader className="border-b border-brand-border px-5 py-3 text-left">
          <div className="flex items-center justify-between">
            <div>
              <DrawerTitle className="font-serif text-lg font-medium text-brand-charcoal">
                {bookmarkToEdit ? "Edit Bookmark" : "New Bookmark"}
              </DrawerTitle>
              <DrawerDescription className="font-mono text-[10px] text-brand-muted uppercase">
                Save link with auto-extracted metadata
              </DrawerDescription>
            </div>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="flex size-8 items-center justify-center text-brand-muted hover:text-brand-charcoal active:scale-95"
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
              className="mb-4 flex w-full items-center justify-center gap-2 rounded-none border border-brand-border bg-brand-canvas px-4 py-2.5 font-mono text-xs font-semibold text-brand-charcoal transition-all active:scale-[0.98] hover:bg-brand-charcoal/5"
            >
              <ClipboardText className="size-4 text-brand-muted" />
              <span>Paste from Clipboard & Auto-Fill</span>
            </button>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault()
              e.stopPropagation()
              bookmarkForm.handleSubmit()
              onOpenChange(false)
            }}
            className="flex flex-col gap-4"
          >
            <FieldGroup>
              {/* URL */}
              <bookmarkForm.Field
                name="url"
                children={(field: any) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid
                  return (
                    <Field data-invalid={isInvalid}>
                      <div className="flex items-center justify-between">
                        <FieldLabel htmlFor="mobile-url" className="text-xs font-mono uppercase text-brand-muted">
                          URL
                        </FieldLabel>
                        {field.state.value && (
                          <button
                            type="button"
                            disabled={isScraping}
                            onClick={() => handleScrape(field.state.value)}
                            className="flex items-center gap-1 font-mono text-[10px] font-semibold text-brand-charcoal hover:underline"
                          >
                            {isScraping ? (
                              <>
                                <Spinner className="size-3" />
                                <span>Scraping...</span>
                              </>
                            ) : (
                              <>
                                <Sparkle className="size-3" />
                                <span>Fetch Info</span>
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
                        onChange={(e) => field.handleChange(e.target.value)}
                        aria-invalid={isInvalid}
                        placeholder="https://example.com"
                        type="url"
                        className="h-10 text-sm"
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

              {/* Title */}
              <bookmarkForm.Field
                name="title"
                children={(field: any) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor="mobile-title" className="text-xs font-mono uppercase text-brand-muted">
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
                        className="h-10 text-sm"
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
                      <FieldLabel htmlFor="mobile-desc" className="text-xs font-mono uppercase text-brand-muted">
                        Description (Optional)
                      </FieldLabel>
                      <Input
                        id="mobile-desc"
                        name={field.name}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        aria-invalid={isInvalid}
                        placeholder="Notes or brief summary"
                        className="h-10 text-sm"
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
                      <FieldLabel className="text-xs font-mono uppercase text-brand-muted">
                        Folder
                      </FieldLabel>
                      <Select
                        value={field.state.value || ""}
                        onValueChange={(val) => field.handleChange(val)}
                      >
                        <SelectTrigger
                          aria-invalid={isInvalid}
                          className="h-10 w-full rounded-none border border-brand-border bg-white px-3 text-sm font-medium text-brand-charcoal"
                        >
                          <SelectValue placeholder="Root (No Folder)" />
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
                      <FieldLabel className="text-xs font-mono uppercase text-brand-muted">
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
                        className="min-h-10 rounded-none border border-brand-border bg-white p-1"
                      >
                        <TagsInputList>
                          {(field.state.value || []).map((tag: string) => (
                            <TagsInputItem key={tag} value={tag}>
                              {tag}
                            </TagsInputItem>
                          ))}
                          <TagsInputInput
                            placeholder="Add #tag and press Enter..."
                            className="text-xs"
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
              <Button
                type="submit"
                className="h-11 w-full rounded-none bg-brand-charcoal text-xs font-semibold uppercase text-white hover:bg-brand-charcoal/90 active:scale-[0.99]"
              >
                {bookmarkToEdit ? "Update Bookmark" : "Save Bookmark"}
              </Button>
            </div>
          </form>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
