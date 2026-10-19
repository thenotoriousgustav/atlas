"use client"

import * as React from "react"
import {
  BookmarkSimple,
  Star,
  Archive,
  FolderSimple,
  Plus,
  Trash,
  FileText,
  VideoCamera,
  ArrowsClockwise,
  PencilSimple,
  UploadSimple,
  LinkSimple,
} from "@phosphor-icons/react"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarSeparator,
  SidebarHeader,
} from "@/components/ui/sidebar"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldLabel } from "@/components/ui/field"

interface AppSidebarProps {
  selectedFolderId?: string
  onSelectFolder: (id: string | undefined) => void
  selectedTag?: string
  onSelectTag: (tag: string | undefined) => void
  filterFavorite?: boolean
  onSelectFavorite: (fav: boolean | undefined) => void
  filterArchived?: boolean
  onSelectArchived: (arch: boolean | undefined) => void
  folders: any[]
  tags: any[]
  onDeleteTag: (id: string) => void
  isFolderModalOpen: boolean
  setIsFolderModalOpen: (open: boolean) => void
  folderToEdit: any | null
  folderForm: any
  onEditFolder: (folder: any) => void
  onDeleteFolder: (id: string) => void
  onCreateSubfolder?: (parentId: string) => void
  filterBroken?: boolean
  onSelectBroken: (broken: boolean | undefined) => void
  filterDuplicates?: boolean
  onSelectDuplicates: (dup: boolean | undefined) => void
  filterTrash?: boolean
  onSelectTrash: (trash: boolean | undefined) => void
  filterType?: "BOOKMARK" | "NOTE" | undefined
  onSelectType?: (type: "BOOKMARK" | "NOTE" | undefined) => void
  filterContentType?: string | undefined
  onSelectContentType?: (type: string | undefined) => void
  healthSummary?: any
  onScan: () => void
  onImport: (e: React.ChangeEvent<HTMLInputElement>) => void
  resetFolderForm: () => void
}

export function AppSidebar({
  selectedFolderId,
  onSelectFolder,
  selectedTag,
  onSelectTag,
  filterFavorite,
  onSelectFavorite,
  filterArchived,
  onSelectArchived,
  folders,
  tags,
  onDeleteTag,
  isFolderModalOpen,
  setIsFolderModalOpen,
  folderToEdit,
  folderForm,
  onEditFolder,
  onDeleteFolder,
  onCreateSubfolder,
  filterBroken,
  onSelectBroken,
  filterDuplicates,
  onSelectDuplicates,
  filterTrash,
  onSelectTrash,
  filterType,
  onSelectType,
  filterContentType,
  onSelectContentType,
  healthSummary,
  onScan,
  onImport,
  resetFolderForm,
}: AppSidebarProps) {
  const isAllSelected =
    !selectedFolderId &&
    !selectedTag &&
    !filterFavorite &&
    !filterArchived &&
    !filterTrash &&
    !filterBroken &&
    !filterDuplicates &&
    !filterType &&
    !filterContentType

  const handleClearAll = () => {
    onSelectFolder(undefined)
    onSelectTag(undefined)
    onSelectFavorite(undefined)
    onSelectArchived(undefined)
    onSelectTrash(undefined)
    onSelectBroken(undefined)
    onSelectDuplicates(undefined)
    onSelectType?.(undefined)
    onSelectContentType?.(undefined)
  }

  return (
    <Sidebar variant="sidebar" className="border-r border-border bg-sidebar">
      {/* Brand Header Inside Sidebar */}
      <SidebarHeader className="border-b border-sidebar-border px-4 py-3.5">
        <div className="flex items-center gap-2.5">
          <div className="flex size-7 shrink-0 items-center justify-center rounded-none bg-brand-charcoal font-serif text-sm font-semibold text-brand-canvas italic">
            C
          </div>
          <div className="flex min-w-0 flex-col">
            <span className="font-serif text-base font-semibold leading-tight text-sidebar-foreground">
              Cabinet
            </span>
            <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
              Bookmarks · Notes
            </span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="p-2">
        {/* Library Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Library</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={isAllSelected}
                  onClick={handleClearAll}
                >
                  <BookmarkSimple />
                  <span>All Items</span>
                </SidebarMenuButton>
                {healthSummary?.total !== undefined && (
                  <SidebarMenuBadge>{healthSummary.total}</SidebarMenuBadge>
                )}
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={filterType === "BOOKMARK"}
                  onClick={() => {
                    handleClearAll()
                    onSelectType?.("BOOKMARK")
                  }}
                >
                  <LinkSimple />
                  <span>Bookmarks</span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={filterType === "NOTE"}
                  onClick={() => {
                    handleClearAll()
                    onSelectType?.("NOTE")
                  }}
                >
                  <FileText className="text-amber-600" />
                  <span>Notes</span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={filterContentType === "VIDEO"}
                  onClick={() => {
                    handleClearAll()
                    onSelectContentType?.("VIDEO")
                  }}
                >
                  <VideoCamera className="text-purple-600" />
                  <span>Media & Videos</span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={filterFavorite === true}
                  onClick={() => {
                    handleClearAll()
                    onSelectFavorite(true)
                  }}
                >
                  <Star className="text-[#956400]" weight={filterFavorite ? "fill" : "regular"} />
                  <span>Favorites</span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={filterArchived === true}
                  onClick={() => {
                    handleClearAll()
                    onSelectArchived(true)
                  }}
                >
                  <Archive />
                  <span>Archive</span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={filterTrash === true}
                  onClick={() => {
                    handleClearAll()
                    onSelectTrash(true)
                  }}
                >
                  <Trash className="text-red-600" />
                  <span>Trash</span>
                </SidebarMenuButton>
                {healthSummary?.trash ? (
                  <SidebarMenuBadge>{healthSummary.trash}</SidebarMenuBadge>
                ) : null}
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {/* Collections / Folders */}
        <SidebarGroup>
          <SidebarGroupLabel>Collections</SidebarGroupLabel>
          <SidebarGroupAction
            title="Create folder"
            onClick={() => {
              resetFolderForm()
              setIsFolderModalOpen(true)
            }}
          >
            <Plus />
            <span className="sr-only">New Folder</span>
          </SidebarGroupAction>
          <SidebarGroupContent>
            {folders.length === 0 ? (
              <p className="px-2 py-1.5 font-mono text-[11px] text-muted-foreground/60">
                No folders yet
              </p>
            ) : (
              <SidebarMenu>
                {folders.map((folder) => {
                  const isSelected = selectedFolderId === folder.id
                  return (
                    <SidebarMenuItem key={folder.id}>
                      <SidebarMenuButton
                        isActive={isSelected}
                        onClick={() => {
                          handleClearAll()
                          onSelectFolder(folder.id)
                        }}
                      >
                        <FolderSimple />
                        <span className="truncate">{folder.name}</span>
                      </SidebarMenuButton>
                      <SidebarMenuAction
                        showOnHover
                        title="Edit folder"
                        onClick={(e) => {
                          e.stopPropagation()
                          onEditFolder(folder)
                        }}
                      >
                        <PencilSimple />
                      </SidebarMenuAction>
                      {folder._count?.bookmarks !== undefined && (
                        <SidebarMenuBadge>{folder._count.bookmarks}</SidebarMenuBadge>
                      )}
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            )}
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {/* Tags */}
        {tags.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Tags</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {tags.map((tag) => {
                  const isSelected = selectedTag === tag.name
                  return (
                    <SidebarMenuItem key={tag.id}>
                      <SidebarMenuButton
                        isActive={isSelected}
                        onClick={() => {
                          handleClearAll()
                          onSelectTag(tag.name)
                        }}
                      >
                        <span className="font-mono text-[11px] text-muted-foreground">#</span>
                        <span className="truncate font-mono text-[11px]">{tag.name}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        <SidebarSeparator />

        {/* Maintenance */}
        <SidebarGroup>
          <SidebarGroupLabel>Maintenance</SidebarGroupLabel>
          <SidebarGroupAction title="Run health check" onClick={onScan}>
            <ArrowsClockwise />
            <span className="sr-only">Check Links</span>
          </SidebarGroupAction>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={filterBroken === true}
                  onClick={() => {
                    handleClearAll()
                    onSelectBroken(true)
                  }}
                >
                  <span className="truncate">Broken links</span>
                </SidebarMenuButton>
                {healthSummary?.broken ? (
                  <SidebarMenuBadge className="text-red-600">
                    {healthSummary.broken}
                  </SidebarMenuBadge>
                ) : null}
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={filterDuplicates === true}
                  onClick={() => {
                    handleClearAll()
                    onSelectDuplicates(true)
                  }}
                >
                  <span className="truncate">Duplicate URLs</span>
                </SidebarMenuButton>
                {healthSummary?.duplicates ? (
                  <SidebarMenuBadge>{healthSummary.duplicates}</SidebarMenuBadge>
                ) : null}
              </SidebarMenuItem>
            </SidebarMenu>

            {/* Import HTML */}
            <div className="pt-2 px-1">
              <label className="flex h-7 w-full cursor-pointer items-center justify-center gap-1.5 border border-border bg-background px-2 font-mono text-[10px] uppercase text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                <UploadSimple className="size-3" />
                <span>Import HTML</span>
                <input
                  type="file"
                  accept=".html"
                  onChange={onImport}
                  className="hidden"
                />
              </label>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Folder Modal */}
      <Dialog open={isFolderModalOpen} onOpenChange={setIsFolderModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{folderToEdit ? "Edit Folder" : "New Folder"}</DialogTitle>
            <DialogDescription>
              {folderToEdit ? "Update folder name." : "Create a new folder for your bookmarks."}
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              e.stopPropagation()
              folderForm.handleSubmit()
            }}
            className="space-y-4"
          >
            <folderForm.Field name="name">
              {(field: any) => (
                <Field className="gap-1.5">
                  <FieldLabel>Folder Name</FieldLabel>
                  <Input
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="e.g. Design Inspiration, Articles"
                    autoFocus
                  />
                </Field>
              )}
            </folderForm.Field>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsFolderModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {folderToEdit ? "Update Folder" : "Create Folder"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </Sidebar>
  )
}
