"use client"

import React from "react"
import { Archive, ArrowCounterClockwise, FolderSimple, Trash, Tray } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"

const itemCount = (count: number) => (count === 1 ? "1 item" : `${count} items`)

export function BulkTagForm({ tags, count, onAddTags }: {
  tags: any[]
  count: number
  onAddTags: (tags: string[]) => Promise<void> | void
}) {
  const [value, setValue] = React.useState("")
  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    const clean = value.trim().replace(/^#/, "")
    if (!clean) return
    void onAddTags([clean])
    setValue("")
  }
  return (
    <div className="flex flex-col gap-2.5">
      <span className="text-xs font-medium text-foreground">Add a tag to {itemCount(count)}</span>
      <form onSubmit={submit} className="flex gap-1.5">
        <Input
          value={value}
          onChange={(event) => setValue(event.target.value)}
          aria-label="Tag name"
          placeholder="Tag name"
          maxLength={30}
          className="h-9 text-base md:text-sm"
        />
        <Button type="submit" disabled={!value.trim()}>Add</Button>
      </form>
      {tags.length > 0 && (
        <div className="flex flex-col gap-1.5 border-t border-border pt-2">
          <span className="text-xs text-muted-foreground">Or pick an existing tag</span>
          <div className="flex max-h-32 flex-wrap gap-1.5 overflow-y-auto">
            {tags.map((tag: any) => (
              <button
                key={tag.id || tag.name}
                type="button"
                onClick={() => void onAddTags([tag.name])}
                className="min-h-8 cursor-pointer rounded-sm bg-muted/60 px-2 text-xs text-muted-foreground hover:bg-library-highlight hover:text-library-olive focus-visible:outline-2 focus-visible:outline-ring"
              >
                #{tag.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

interface BulkActionsSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  count: number
  isTrashView: boolean
  folders: any[]
  onMove: (folderId: string | null, folderName?: string) => Promise<void> | void
  onArchive: () => Promise<void> | void
  onTrash: () => Promise<void> | void
  onRestore: () => Promise<void> | void
  onPermanentDelete: () => Promise<void> | void
  tagForm: React.ReactNode
}

/** Touch-friendly bulk actions; the desktop action bar is too wide for a phone. */
export function BulkActionsSheet({
  open, onOpenChange, count, isTrashView, folders,
  onMove, onArchive, onTrash, onRestore, onPermanentDelete, tagForm,
}: BulkActionsSheetProps) {
  const run = (action: () => Promise<void> | void) => {
    onOpenChange(false)
    void action()
  }
  const rowClass = "flex min-h-12 w-full items-center gap-3 rounded-md px-4 text-left text-sm font-medium hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring"

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85dvh] bg-card pb-[calc(env(safe-area-inset-bottom)+1rem)]">
        <DrawerHeader className="border-b border-border px-5 py-3 text-left">
          <DrawerTitle>{itemCount(count)} selected</DrawerTitle>
          <DrawerDescription>Choose what to do with the selected items.</DrawerDescription>
        </DrawerHeader>
        <div className="flex flex-col gap-4 overflow-y-auto p-2">
          {isTrashView ? (
            <div className="flex flex-col gap-1">
              <button type="button" className={rowClass} onClick={() => run(onRestore)}>
                <ArrowCounterClockwise className="size-4" />Restore
              </button>
              <button type="button" className={`${rowClass} text-destructive hover:bg-destructive/10`} onClick={() => run(onPermanentDelete)}>
                <Trash className="size-4" />Delete permanently
              </button>
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-1">
                <button type="button" className={rowClass} onClick={() => run(onArchive)}>
                  <Archive className="size-4" />Archive
                </button>
                <button type="button" className={`${rowClass} text-destructive hover:bg-destructive/10`} onClick={() => run(onTrash)}>
                  <Trash className="size-4" />Move to Trash
                </button>
              </div>
              <section aria-labelledby="bulk-move-heading" className="flex flex-col gap-1 border-t border-border pt-3">
                <h3 id="bulk-move-heading" className="px-4 pb-1 text-xs font-medium text-muted-foreground">Move to folder</h3>
                <button type="button" className={rowClass} onClick={() => run(() => onMove(null))}>
                  <Tray className="size-4" />Unfiled
                </button>
                {folders.map((folder: any) => (
                  <button key={folder.id} type="button" className={rowClass} onClick={() => run(() => onMove(folder.id, folder.name))}>
                    <FolderSimple className="size-4 shrink-0" /><span className="truncate">{folder.name}</span>
                  </button>
                ))}
              </section>
              <section className="border-t border-border px-4 pt-3">{tagForm}</section>
            </>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  )
}
