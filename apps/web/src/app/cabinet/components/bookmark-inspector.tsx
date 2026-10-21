"use client"

import * as React from "react"
import {
  ArrowSquareOut,
  Star,
  PushPin,
  Archive,
  Trash,
  FolderSimple,
  Hash as Tag,
  LinkSimple,
  CalendarBlank,
  FileText,
} from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Field, FieldLabel } from "@/components/ui/field"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { TagsInput, TagsInputList, TagsInputInput, TagsInputItem } from "@/components/ui/tags-input"
import { toast } from "@/components/ui/sonner"
import { cn } from "@/lib/utils"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { NoteAutosave, type NoteSaveStatus } from "@/lib/note-autosave"
import { bookmarkDraft, parseBookmarkDraft, type BookmarkDraft } from "@/lib/bookmark-draft"
import { safeHttpUrl } from "@/lib/shared-collection"
import { itemAccess } from "@/lib/bookmark-kind"
import { canAddToFolder } from "@/lib/folder-roles"

export interface BookmarkInspectorHandle { flush: () => Promise<boolean> }

interface BookmarkInspectorProps {
  bookmark: any | null
  folders: any[]
  onCloseWithDraft?: () => void
  onUpdateBookmark: (id: string, data: any) => Promise<any>
  onDeleteBookmark: (id: string) => void
  onTogglePin?: (bookmark: any) => void
  onToggleFavorite: (bookmark: any) => void
  onToggleArchive: (bookmark: any) => void
  className?: string
}

export const BookmarkInspector = React.forwardRef<BookmarkInspectorHandle, BookmarkInspectorProps>(function BookmarkInspector({
  bookmark,
  folders,
  onCloseWithDraft,
  onUpdateBookmark,
  onDeleteBookmark,
  onToggleFavorite,
  onTogglePin,
  onToggleArchive,
  className,
}: BookmarkInspectorProps, ref) {
  const fieldId = React.useId()
  const [draft, setDraft] = React.useState(() => bookmarkDraft(bookmark))
  const [status, setStatus] = React.useState<NoteSaveStatus>('saved')
  const [recovery, setRecovery] = React.useState<BookmarkDraft | null>(null)
  const [backupUnavailable, setBackupUnavailable] = React.useState(false)
  const current = React.useRef(draft)
  const updater = React.useRef(onUpdateBookmark)
  updater.current = onUpdateBookmark
  const queue = React.useRef<NoteAutosave<BookmarkDraft> | null>(null)
  const access = bookmark ? itemAccess(bookmark) : "viewer"
  const readOnly = access === "viewer"
  // Editors of a shared folder may change another person's title and description only.
  const limited = access === "editor"
  const draftKey = bookmark?.userId ? `cabinet:inspector-draft:v1:${bookmark.userId}:${bookmark.id}` : null

  React.useEffect(() => {
    if (!bookmark || readOnly) return
    let active = true
    try { setRecovery(draftKey ? parseBookmarkDraft(localStorage.getItem(draftKey)) : null) } catch { setBackupUnavailable(true) }
    const autosave = new NoteAutosave<BookmarkDraft>(async (snapshot) => {
      await updater.current(bookmark.id, limited
        ? { title: snapshot.title.trim(), description: snapshot.description }
        : {
            title: snapshot.title.trim(), description: snapshot.description, notes: snapshot.notes,
            folderId: snapshot.folderId === 'none' ? null : snapshot.folderId,
            tags: snapshot.tags.map((tag) => tag.trim().replace(/^#/, '').toLowerCase()).filter(Boolean),
          })
      if (draftKey && current.current === snapshot) {
        try {
          if (localStorage.getItem(draftKey) === JSON.stringify(snapshot)) localStorage.removeItem(draftKey)
        } catch {}
      }
    }, (next) => { if (active) setStatus(next) })
    queue.current = autosave
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (autosave.hasUnsavedChanges) { event.preventDefault(); event.returnValue = '' }
    }
    window.addEventListener('beforeunload', beforeUnload)
    return () => {
      active = false
      window.removeEventListener('beforeunload', beforeUnload)
      // Explicit preview navigation flushes first; other unmounts keep the local draft.
      autosave.dispose()
      if (queue.current === autosave) queue.current = null
    }
  }, [bookmark?.id, draftKey, readOnly, limited])

  React.useImperativeHandle(ref, () => ({ flush: () => queue.current?.flush() ?? Promise.resolve(true) }), [])
  const update = (patch: Partial<BookmarkDraft>) => {
    if (readOnly) return
    const next = { ...current.current, ...patch }
    current.current = next
    setDraft(next)
    try {
      if (!draftKey) throw new Error('Missing draft owner')
      localStorage.setItem(draftKey, JSON.stringify(next))
      setBackupUnavailable(false)
    } catch { setBackupUnavailable(true) }
    queue.current?.schedule(next)
  }
  const { title, description, notes, folderId, tags } = draft
  if (!bookmark) return null
  const disabled = readOnly || !!recovery
  const personalDisabled = disabled || limited
  const isNote = bookmark.type === 'NOTE' || !bookmark.url
  const hostname = safeHttpUrl(bookmark.url || '')?.hostname || ''

  const handleCopyLink = () => {
    if (bookmark.url) {
      navigator.clipboard?.writeText(bookmark.url)
      toast.success("URL copied to clipboard")
    }
  }

  return (
    <aside
      aria-label="Bookmark inspector"
      className={cn("flex w-full min-w-0 flex-col border border-border bg-card text-card-foreground", className)}
    >
      {/* Top Header */}
      <div className="flex min-h-14 items-center justify-between gap-2 border-b border-border/70 px-4 py-3">
        <span className="text-sm font-semibold text-foreground">
          {isNote ? "Note details" : "Details"}
        </span>
        <div className="flex items-center gap-1">
          {onTogglePin && access === "owner" && (
            <Button variant="ghost" size="icon-xs" onClick={() => onTogglePin(bookmark)}
              title={bookmark.isPinned ? "Unpin bookmark" : "Pin to top"}
              aria-label={bookmark.isPinned ? "Unpin bookmark" : "Pin to top"}
              aria-pressed={!!bookmark.isPinned}
            >
              <PushPin weight={bookmark.isPinned ? "fill" : "regular"} />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon-xs"
            disabled={access !== "owner"}
            onClick={() => onToggleFavorite(bookmark)}
            title={bookmark.isFavorite ? "Remove from favorites" : "Add to favorites"}
            aria-label={bookmark.isFavorite ? "Remove from favorites" : "Add to favorites"}
            aria-pressed={!!bookmark.isFavorite}
          >
            <Star
              className={cn("size-3.5", bookmark.isFavorite ? "text-library-olive" : "text-muted-foreground")}
              weight={bookmark.isFavorite ? "fill" : "regular"}
            />
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            disabled={access !== "owner"}
            onClick={() => onToggleArchive(bookmark)}
            title={bookmark.isArchived ? "Unarchive" : "Archive"}
            aria-label={bookmark.isArchived ? "Unarchive" : "Archive"}
          >
            <Archive className="size-3.5 text-muted-foreground" />
          </Button>
        </div>
      </div>

      {/* The website is already visible beside this editor. Keep the form in view. */}
      <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto overscroll-contain p-5 text-sm">
        {readOnly && <p role="status" className="text-muted-foreground">You can view this shared item. Only its author or a folder editor can change it.</p>}
        {limited && <p role="status" className="text-muted-foreground">Someone else saved this link. You can edit its title and description or move it to Trash. Its folder, tags, and personal note stay with its author.</p>}
        {recovery && <Alert><AlertDescription><p>An unsaved draft is available on this device. Restore it or keep the server version.</p><div className="flex gap-2">
          <Button size="sm" onClick={() => { update(recovery); setRecovery(null) }}>Restore draft</Button>
          <Button size="sm" variant="outline" onClick={() => { if (draftKey) { try { localStorage.removeItem(draftKey) } catch {} } setRecovery(null) }}>Discard draft</Button>
        </div></AlertDescription></Alert>}
        {backupUnavailable && <p role="alert" className="text-xs text-destructive">Local backup is unavailable. Keep this tab open until changes are saved.</p>}

        {/* Link URL row */}
        {!isNote && bookmark.url && (
          <div className="flex items-center justify-between gap-2 rounded-md border border-border bg-muted/30 p-2 text-sm">
            <a
              href={bookmark.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-w-0 flex-1 items-center gap-1.5 truncate text-foreground hover:underline"
            >
              <LinkSimple className="size-3.5 shrink-0 text-muted-foreground" />
              <span className="truncate">{hostname}</span>
              <ArrowSquareOut className="size-3 shrink-0 text-muted-foreground" />
            </a>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={handleCopyLink}
              title="Copy link"
              aria-label="Copy link"
              className="size-6 shrink-0"
            >
              <LinkSimple className="size-3" />
            </Button>
          </div>
        )}

        {/* Title */}
        <Field className="gap-1.5">
          <FieldLabel htmlFor={`${fieldId}-title`} className="text-xs font-medium text-muted-foreground">Title</FieldLabel>
          <Input
            disabled={disabled}
            id={`${fieldId}-title`}
            value={title}
            onChange={(e) => update({ title: e.target.value })}
            placeholder="Bookmark title"
            className="h-9 rounded-md text-base font-medium md:text-sm"
          />
        </Field>

        {/* Folder */}
        <Field className="gap-1.5">
          <FieldLabel htmlFor={`${fieldId}-folder`} className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
            <FolderSimple className="size-3" /> Folder
          </FieldLabel>
          <Select value={folderId} onValueChange={(folderId) => update({ folderId })} disabled={personalDisabled}>
            <SelectTrigger id={`${fieldId}-folder`} className="h-9 rounded-md text-sm">
              <SelectValue placeholder="Unfiled" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
              <SelectItem value="none">Unfiled</SelectItem>
              {folders.filter((f) => canAddToFolder(f) || f.id === folderId).map((f) => (
                <SelectItem key={f.id} value={f.id}>
                  {f.name}
                </SelectItem>
              ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>

        {/* Tags */}
        <Field className="gap-1.5">
          <FieldLabel htmlFor={`${fieldId}-tags`} className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
            <Tag className="size-3" /> Tags
          </FieldLabel>
          <TagsInput value={tags} onValueChange={(tags) => update({ tags })} disabled={personalDisabled} className="w-full">
            <TagsInputList className="min-h-9 px-2 py-1">
              {tags.map((t) => (
                <TagsInputItem key={t} value={t} className="h-6 rounded-sm px-1.5 py-0 text-xs">
                  #{t}
                </TagsInputItem>
              ))}
              <TagsInputInput id={`${fieldId}-tags`} placeholder="Add tag..." className="text-base md:text-sm" />
            </TagsInputList>
          </TagsInput>
        </Field>

        {/* Description / Subtext */}
        <Field className="gap-1.5">
          <FieldLabel htmlFor={`${fieldId}-description`} className="text-xs font-medium text-muted-foreground">Description</FieldLabel>
          <Textarea
            disabled={disabled}
            id={`${fieldId}-description`}
            value={description}
            onChange={(e) => update({ description: e.target.value })}
            placeholder="Add brief description..."
            rows={3}
            className="resize-none rounded-md text-base leading-6 md:text-sm"
          />
        </Field>

        {/* Personal Notes */}
        <Field className="gap-1.5">
          <FieldLabel htmlFor={`${fieldId}-notes`} className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
            <FileText className="size-3" /> Personal Note
          </FieldLabel>
          <Textarea
            disabled={personalDisabled}
            id={`${fieldId}-notes`}
            value={notes}
            onChange={(e) => update({ notes: e.target.value })}
            placeholder="Write markdown or thoughts..."
            rows={4}
            className="rounded-md text-base leading-6 md:text-sm"
          />
        </Field>

        {/* Metadata info */}
        <div className="flex flex-col gap-1 border-t border-border pt-3 text-xs text-muted-foreground">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1">
              <CalendarBlank className="size-3" /> Saved on
            </span>
            <span>
              {new Date(bookmark.createdAt).toLocaleDateString(undefined, {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </span>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="flex shrink-0 items-center justify-between gap-3 border-t border-border/70 bg-card px-5 py-4">
        <Button
          variant="ghost"
          size="sm"
          disabled={readOnly}
          onClick={() => onDeleteBookmark(bookmark.id)}
          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash data-icon="inline-start" /> Move to Trash
        </Button>
        {!readOnly && <div className="flex flex-wrap items-center justify-end gap-2 text-xs text-muted-foreground">
          <span role="status" aria-live="polite">{recovery ? 'Choose a draft version' : status === 'saving' ? 'Saving…' : status === 'unsaved' ? 'Unsaved changes' : status === 'error' ? 'Not saved. Your changes are still here.' : 'All changes saved'}</span>
          {status === 'error' && <><Button size="sm" variant="outline" onClick={() => void queue.current?.flush()}>Retry save</Button>
            {!backupUnavailable && draftKey && onCloseWithDraft && <Button size="sm" variant="ghost" onClick={onCloseWithDraft}>Close & keep draft</Button>}
          </>}
        </div>}
      </div>
    </aside>
  )
})
