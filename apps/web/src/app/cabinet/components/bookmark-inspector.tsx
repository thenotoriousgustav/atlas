"use client"

import * as React from "react"
import {
  X,
  ArrowSquareOut,
  Star,
  PushPin,
  Archive,
  Trash,
  FolderSimple,
  Tag,
  LinkSimple,
  CalendarBlank,
  FileText,
  Clock,
} from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Field, FieldLabel } from "@/components/ui/field"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { TagsInput, TagsInputList, TagsInputInput, TagsInputItem } from "@/components/ui/tags-input"
import { toast } from "@/components/ui/sonner"
import { cn } from "@/lib/utils"

interface BookmarkInspectorProps {
  bookmark: any | null
  folders: any[]
  availableTags: any[]
  onClose: () => void
  onUpdateBookmark: (id: string, data: any) => Promise<any>
  onDeleteBookmark: (id: string) => void
  onTogglePin?: (bookmark: any) => void
  onToggleFavorite: (bookmark: any) => void
  onToggleArchive: (bookmark: any) => void
  className?: string
}

export function BookmarkInspector({
  bookmark,
  folders,
  availableTags,
  onClose,
  onUpdateBookmark,
  onDeleteBookmark,
  onToggleFavorite,
  onTogglePin,
  onToggleArchive,
  className,
}: BookmarkInspectorProps) {
  const [title, setTitle] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [notes, setNotes] = React.useState("")
  const [folderId, setFolderId] = React.useState<string>("none")
  const [tags, setTags] = React.useState<string[]>([])
  const [isSaving, setIsSaving] = React.useState(false)
  const [inspectorImageStatus, setInspectorImageStatus] = React.useState<
    "loading" | "ready" | "error"
  >("loading")

  React.useEffect(() => {
    if (bookmark) {
      setTitle(bookmark.title || "")
      setDescription(bookmark.description || "")
      setNotes(bookmark.notes || "")
      setFolderId(bookmark.folderId || "none")
      setTags((bookmark.tags || []).map((t: any) => (typeof t === "string" ? t : t.name)))
      setInspectorImageStatus(bookmark.imageUrl ? "loading" : "error")
    }
  }, [bookmark])

  if (!bookmark) return null

  const isNote = bookmark.type === "NOTE" || !bookmark.url
  const hostname = bookmark.url ? new URL(bookmark.url).hostname : ""

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await onUpdateBookmark(bookmark.id, {
        title: title.trim() || undefined,
        description: description.trim() || undefined,
        notes: notes.trim() || undefined,
        folderId: folderId === "none" ? null : folderId,
        tags: tags.map((t) => t.trim().toLowerCase()),
      })
      toast.success("Bookmark updated")
    } catch {
      toast.error("Failed to save changes")
    } finally {
      setIsSaving(false)
    }
  }

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
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <span className="font-mono text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {isNote ? "Note Details" : "Bookmark Inspector"}
        </span>
        <div className="flex items-center gap-1">
          {onTogglePin && (
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
            onClick={() => onToggleFavorite(bookmark)}
            title={bookmark.isFavorite ? "Unfavorite" : "Favorite"}
          >
            <Star
              className={cn("size-3.5", bookmark.isFavorite ? "fill-[#956400] text-[#956400]" : "text-muted-foreground")}
              weight={bookmark.isFavorite ? "fill" : "regular"}
            />
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => onToggleArchive(bookmark)}
            title={bookmark.isArchived ? "Unarchive" : "Archive"}
          >
            <Archive className="size-3.5 text-muted-foreground" />
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={onClose}
            title="Close inspector"
          >
            <X className="size-3.5" />
          </Button>
        </div>
      </div>

      {/* Content Form Scrollable */}
      <div className="flex-1 space-y-4 overflow-y-auto p-4 text-xs">
        {/* Preview Image if available */}
        {bookmark.imageUrl && !isNote && (
          <div className="relative aspect-[16/10] w-full overflow-hidden border border-border bg-muted/20">
            {inspectorImageStatus === "loading" && (
              <div
                className="absolute inset-0 flex flex-col items-center justify-center bg-muted/40 text-muted-foreground animate-pulse"
                role="status"
              >
                <Clock
                  className="size-5 text-muted-foreground animate-spin"
                  style={{ animationDuration: "3s" }}
                />
                <span className="mt-1 font-mono text-[9px] uppercase tracking-wider text-muted-foreground/70">
                  Loading thumbnail...
                </span>
              </div>
            )}
            <img
              src={`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/v1/bookmarks/proxy-image?v=2&url=${encodeURIComponent(bookmark.imageUrl)}`}
              alt={bookmark.title || hostname}
              onLoad={() => setInspectorImageStatus("ready")}
              onError={() => setInspectorImageStatus("error")}
              className={cn(
                "size-full object-contain p-1 transition-opacity",
                inspectorImageStatus === "ready" ? "opacity-100" : "hidden"
              )}
            />
          </div>
        )}

        {/* Link URL row */}
        {!isNote && bookmark.url && (
          <div className="flex items-center justify-between gap-2 rounded-none border border-border bg-muted/30 p-2 font-mono text-[11px]">
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
              title="Copy URL"
              className="size-6 shrink-0"
            >
              <LinkSimple className="size-3" />
            </Button>
          </div>
        )}

        {/* Title */}
        <Field className="gap-1.5">
          <FieldLabel className="font-mono text-[10px] uppercase text-muted-foreground">Title</FieldLabel>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Bookmark title"
            className="h-8 text-xs font-medium"
          />
        </Field>

        {/* Folder */}
        <Field className="gap-1.5">
          <FieldLabel className="flex items-center gap-1 font-mono text-[10px] uppercase text-muted-foreground">
            <FolderSimple className="size-3" /> Folder
          </FieldLabel>
          <Select value={folderId} onValueChange={setFolderId}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="No Folder (Unsorted)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No Folder (Unsorted)</SelectItem>
              {folders.map((f) => (
                <SelectItem key={f.id} value={f.id}>
                  {f.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        {/* Tags */}
        <Field className="gap-1.5">
          <FieldLabel className="flex items-center gap-1 font-mono text-[10px] uppercase text-muted-foreground">
            <Tag className="size-3" /> Tags
          </FieldLabel>
          <TagsInput value={tags} onValueChange={setTags} className="w-full">
            <TagsInputList className="min-h-8 rounded-none border-border px-2 py-1">
              {tags.map((t) => (
                <TagsInputItem key={t} value={t} className="h-5 rounded-none px-1.5 py-0 font-mono text-[10px]">
                  #{t}
                </TagsInputItem>
              ))}
              <TagsInputInput placeholder="Add tag..." className="text-xs" />
            </TagsInputList>
          </TagsInput>
        </Field>

        {/* Description / Subtext */}
        <Field className="gap-1.5">
          <FieldLabel className="font-mono text-[10px] uppercase text-muted-foreground">Description</FieldLabel>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add brief description..."
            rows={3}
            className="text-xs resize-none"
          />
        </Field>

        {/* Personal Notes */}
        <Field className="gap-1.5">
          <FieldLabel className="flex items-center gap-1 font-mono text-[10px] uppercase text-muted-foreground">
            <FileText className="size-3" /> Personal Note
          </FieldLabel>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Write markdown or thoughts..."
            rows={4}
            className="text-xs font-mono"
          />
        </Field>

        {/* Metadata info */}
        <div className="space-y-1 border-t border-border pt-3 font-mono text-[10px] text-muted-foreground">
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
      <div className="flex items-center justify-between border-t border-border p-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDeleteBookmark(bookmark.id)}
          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash data-icon="inline-start" /> Delete
        </Button>
        <Button size="sm" onClick={handleSave} disabled={isSaving}>
          {isSaving ? "Saving..." : "Save changes"}
        </Button>
      </div>
    </aside>
  )
}
