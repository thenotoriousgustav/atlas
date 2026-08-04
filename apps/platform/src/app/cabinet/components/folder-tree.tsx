import React from "react"
import { Button } from "@atlas/ui/components/button"
import { FolderSimple, PencilSimple, Trash, Plus } from "@phosphor-icons/react"
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@atlas/ui/components/accordion"
import { cn } from "@/lib/utils"

interface FolderTreeProps {
  folders: any[]
  selectedFolderId?: string
  onSelectFolder: (id: string) => void
  onEditFolder: (folder: any) => void
  onDeleteFolder: (id: string) => void
  onCreateSubfolder?: (parentId: string) => void
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
  parentId = null,
  depth = 0,
}: FolderTreeProps) {
  const list = folders.filter((f: any) => f.parentId === parentId)
  if (list.length === 0) return null

  return (
    <Accordion type="multiple" className="space-y-1">
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
              <div
                style={{ paddingLeft: `${depth * 12 + 8}px` }}
                className={cn(
                  "group flex w-full cursor-pointer items-center justify-between rounded-none py-1.5 pr-2 text-left font-sans text-xs transition-colors",
                  isSelected
                    ? "bg-brand-charcoal/10 font-semibold text-brand-charcoal"
                    : "text-brand-muted hover:bg-brand-charcoal/5 hover:text-brand-charcoal"
                )}
              >
                <span
                  className="flex flex-1 items-center gap-2 truncate"
                  onClick={() => onSelectFolder(folder.id)}
                >
                  <FolderSimple className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{folder.name}</span>
                  {folder._count?.bookmarks !== undefined && (
                    <span className="font-mono text-[10px] text-brand-muted/70">
                      ({folder._count.bookmarks})
                    </span>
                  )}
                </span>
                <div className="flex shrink-0 items-center gap-1">
                  <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
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
                      className="hover:bg-brand-red-bg hover:text-brand-red-text size-4 p-0"
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
              </div>
              <AccordionContent className="pt-0.5 pb-0">
                <FolderTree
                  folders={folders}
                  selectedFolderId={selectedFolderId}
                  onSelectFolder={onSelectFolder}
                  onEditFolder={onEditFolder}
                  onDeleteFolder={onDeleteFolder}
                  onCreateSubfolder={onCreateSubfolder}
                  parentId={folder.id}
                  depth={depth + 1}
                />
              </AccordionContent>
            </AccordionItem>
          )
        }

        return (
          <div key={folder.id} className="space-y-1">
            <div
              style={{ paddingLeft: `${depth * 12 + 8}px` }}
              className={cn(
                "group flex w-full cursor-pointer items-center justify-between rounded-none py-1.5 pr-2 text-left font-sans text-xs transition-colors",
                isSelected
                  ? "bg-brand-charcoal/10 font-semibold text-brand-charcoal"
                  : "text-brand-muted hover:bg-brand-charcoal/5 hover:text-brand-charcoal"
              )}
              onClick={() => onSelectFolder(folder.id)}
            >
              <span className="flex items-center gap-2 truncate">
                <FolderSimple className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{folder.name}</span>
                {folder._count?.bookmarks !== undefined && (
                  <span className="font-mono text-[10px] text-brand-muted/70">
                    ({folder._count.bookmarks})
                  </span>
                )}
              </span>
              <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
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
                  className="hover:bg-brand-red-bg hover:text-brand-red-text size-4 p-0"
                  title="Delete folder"
                >
                  <Trash className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        )
      })}
    </Accordion>
  )
}
