import React from "react"
import { useDroppable } from "@dnd-kit/core"
import { Button } from "@/components/ui/button"
import { FolderSimple, PencilSimple, Trash, Plus } from "@phosphor-icons/react"
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion"
import { cn } from "@/lib/utils"

function FolderDropTarget({ folderId, disabled, className, ...props }: React.ComponentProps<"div"> & {
  folderId: string
  disabled: boolean
}) {
  const instanceId = React.useId()
  const { setNodeRef, isOver } = useDroppable({
    id: `folder:${folderId}:${instanceId}`,
    data: { type: "folder", folderId },
    disabled,
  })
  return <div {...props} ref={setNodeRef} data-folder-drop={folderId} className={cn(
    className,
    isOver && "bg-primary text-primary-foreground ring-2 ring-primary/40",
  )} />
}

interface FolderTreeProps {
  folders: any[]
  selectedFolderId?: string
  onSelectFolder: (id: string) => void
  onEditFolder: (folder: any) => void
  onDeleteFolder: (id: string) => void
  onCreateSubfolder?: (parentId: string) => void
  onDropBookmarkToFolder?: (folderId: string, bookmarkIds: string[]) => void
  parentId?: string | null
  depth?: number
}

export function FolderTree({
  folders,
  selectedFolderId,
  onSelectFolder,
  onEditFolder,
  onDeleteFolder,
  onCreateSubfolder,
  onDropBookmarkToFolder,
  parentId = null,
  depth = 0,
}: FolderTreeProps) {
  const [dragOverFolderId, setDragOverFolderId] = React.useState<string | null>(null)
  const list = folders.filter((f: any) => f.parentId === parentId)
  if (list.length === 0) return null

  const handleDragOver = (e: React.DragEvent, folderId: string) => {
    if (e.dataTransfer.types.includes("application/json") || e.dataTransfer.types.includes("text/plain")) {
      e.preventDefault()
      e.stopPropagation()
      e.dataTransfer.dropEffect = "move"
      setDragOverFolderId(folderId)

    }
  }

  const handleDragLeave = (e: React.DragEvent, folderId: string) => {
    e.preventDefault()
    e.stopPropagation()
    if (dragOverFolderId === folderId) {
      setDragOverFolderId(null)
    }
  }

  const handleDrop = (e: React.DragEvent, folderId: string) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOverFolderId(null)
    try {
      const rawData = e.dataTransfer.getData("application/json") || e.dataTransfer.getData("text/plain")
      if (rawData) {
        const parsed = JSON.parse(rawData)
        const ids = Array.isArray(parsed) ? parsed : parsed.bookmarkIds || [parsed.id]
        if (ids && ids.length > 0) {
          onDropBookmarkToFolder?.(folderId, ids)
        }
      }
    } catch (err) {
      console.error("Drop failed parsing data:", err)
    }
  }

  return (
    <Accordion type="multiple" className="space-y-1 [&_[data-folder-readonly=true]_[data-folder-actions]]:hidden">
      {list.map((folder: any) => {
        const isSelected = selectedFolderId === folder.id
        const hasChildren = folders.some((f: any) => f.parentId === folder.id)

        if (hasChildren) {
          return (
            <AccordionItem
              key={folder.id}
              value={folder.id}
              className="border-none"
            >
              <FolderDropTarget
                data-folder-readonly={folder.isOwner === false}
                folderId={folder.id}
                disabled={!onDropBookmarkToFolder}
                onDragOver={(e) => handleDragOver(e, folder.id)}
                onDragLeave={(e) => handleDragLeave(e, folder.id)}
                onDrop={(e) => handleDrop(e, folder.id)}
                style={{ paddingLeft: `${depth * 12 + 8}px` }}
                className={cn(
                  "group/folder flex w-full cursor-pointer items-center justify-between rounded-md py-1 pr-2 text-left text-sm transition-colors",
                  dragOverFolderId === folder.id
                    ? "bg-primary text-primary-foreground font-semibold shadow-xs scale-[1.02] ring-2 ring-primary/40 pl-3"
                    : isSelected
                      ? "bg-brand-charcoal/10 font-semibold text-brand-charcoal"
                      : "text-brand-muted hover:bg-brand-charcoal/5 hover:text-brand-charcoal"
                )}
              >
                <button
                  type="button"
                  className="flex min-h-8 min-w-0 flex-1 items-center gap-2 truncate rounded-sm text-left focus-visible:outline-2 focus-visible:outline-ring"
                  onClick={() => onSelectFolder(folder.id)}
                >
                  <FolderSimple className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{folder.name}</span>
                  {folder._count?.bookmarks !== undefined && (
                    <span className="text-xs tabular-nums text-muted-foreground">
                      ({folder._count.bookmarks})
                    </span>
                  )}
                </button>
                <div className="flex shrink-0 items-center gap-1">
                  <div data-folder-actions className="flex max-w-0 items-center gap-1 overflow-hidden opacity-0 group-hover/folder:max-w-20 group-hover/folder:opacity-100 group-focus-within/folder:max-w-20 group-focus-within/folder:opacity-100">
                    <Button
                      onClick={(e) => {
                        e.stopPropagation()
                        onCreateSubfolder?.(folder.id)
                      }}
                      variant="ghost"
                      size="icon-xs"
                      className="size-4 p-0 hover:bg-brand-charcoal/10"
                      title="Add subfolder"
                    >
                      <Plus className="h-3 w-3 text-brand-muted" />
                    </Button>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation()
                        onEditFolder(folder)
                      }}
                      variant="ghost"
                      size="icon-xs"
                      className="size-4 p-0 hover:bg-brand-charcoal/10"
                      title="Edit folder"
                    >
                      <PencilSimple className="h-3 w-3 text-brand-muted" />
                    </Button>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation()
                        onDeleteFolder(folder.id)
                      }}
                      variant="ghost"
                      size="icon-xs"
                      className="size-6 p-0 text-destructive hover:bg-destructive/10"
                      title="Delete folder"
                    >
                      <Trash className="h-3 w-3" />
                    </Button>
                  </div>
                  <AccordionTrigger
                    className="flex size-4 items-center justify-center p-0 after:hidden hover:bg-brand-charcoal/5 hover:no-underline focus-visible:ring-0"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              </FolderDropTarget>
              <AccordionContent className="pt-0.5 pb-0">
                <FolderTree
                  folders={folders}
                  selectedFolderId={selectedFolderId}
                  onSelectFolder={onSelectFolder}
                  onEditFolder={onEditFolder}
                  onDeleteFolder={onDeleteFolder}
                  onCreateSubfolder={onCreateSubfolder}
                  onDropBookmarkToFolder={onDropBookmarkToFolder}
                  parentId={folder.id}
                  depth={depth + 1}
                />
              </AccordionContent>
            </AccordionItem>
          )
        }

        return (
          <div key={folder.id} className="space-y-1">
            <FolderDropTarget
              data-folder-readonly={folder.isOwner === false}
              folderId={folder.id}
              disabled={!onDropBookmarkToFolder}
              onDragOver={(e) => handleDragOver(e, folder.id)}
              onDragLeave={(e) => handleDragLeave(e, folder.id)}
              onDrop={(e) => handleDrop(e, folder.id)}
              style={{ paddingLeft: `${depth * 12 + 8}px` }}
              className={cn(
                "group/folder flex w-full cursor-pointer items-center justify-between rounded-md py-1 pr-2 text-left text-sm transition-colors",
                dragOverFolderId === folder.id
                  ? "bg-primary text-primary-foreground font-semibold shadow-xs scale-[1.02] ring-2 ring-primary/40 pl-3"
                  : isSelected
                    ? "bg-brand-charcoal/10 font-semibold text-brand-charcoal"
                    : "text-brand-muted hover:bg-brand-charcoal/5 hover:text-brand-charcoal"
              )}
            >
              <button type="button" onClick={() => onSelectFolder(folder.id)} className="flex min-h-8 min-w-0 flex-1 items-center gap-2 truncate rounded-sm text-left focus-visible:outline-2 focus-visible:outline-ring">
                <FolderSimple className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{folder.name}</span>
                {folder._count?.bookmarks !== undefined && (
                  <span className="text-xs tabular-nums text-muted-foreground">
                    ({folder._count.bookmarks})
                  </span>
                )}
              </button>
              <div data-folder-actions className="flex max-w-0 shrink-0 items-center gap-1 overflow-hidden opacity-0 group-hover/folder:max-w-20 group-hover/folder:opacity-100 group-focus-within/folder:max-w-20 group-focus-within/folder:opacity-100">
                <Button
                  onClick={(e) => {
                    e.stopPropagation()
                    onCreateSubfolder?.(folder.id)
                  }}
                  variant="ghost"
                  size="icon-xs"
                  className="size-4 p-0 hover:bg-brand-charcoal/10"
                  title="Add subfolder"
                >
                  <Plus className="h-3 w-3 text-brand-muted" />
                </Button>
                <Button
                  onClick={(e) => {
                    e.stopPropagation()
                    onEditFolder(folder)
                  }}
                  variant="ghost"
                  size="icon-xs"
                  className="size-4 p-0 hover:bg-brand-charcoal/10"
                  title="Edit folder"
                >
                  <PencilSimple className="h-3 w-3 text-brand-muted" />
                </Button>
                <Button
                  onClick={(e) => {
                    e.stopPropagation()
                    onDeleteFolder(folder.id)
                  }}
                  variant="ghost"
                  size="icon-xs"
                  className="size-6 p-0 text-destructive hover:bg-destructive/10"
                  title="Delete folder"
                >
                  <Trash className="h-3 w-3" />
                </Button>
              </div>
            </FolderDropTarget>
          </div>
        )
      })}
    </Accordion>
  )
}
