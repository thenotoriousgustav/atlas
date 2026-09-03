import React from "react"
import { Spinner } from "@atlas/ui/components/spinner"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@atlas/ui/components/dialog"
import { Button } from "@atlas/ui/components/button"
import { Input } from "@atlas/ui/components/input"
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldError,
} from "@atlas/ui/components/field"
import { useForm } from "@tanstack/react-form"
import { useQueryClient } from "@tanstack/react-query"
import * as z from "zod"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@atlas/ui/components/select"
import {
  BookmarkSimple,
  Star,
  Archive,
  FolderPlus,
  Tag as TagIcon,
  DownloadSimple,
  UploadSimple,
  X,
  Copy,
  Warning,
  ArrowClockwise,
  Plus,
  Trash,
} from "@phosphor-icons/react"
import { AXIOS_INSTANCE } from "@atlas/api-client"
import { toast } from "@atlas/ui/components/sonner"
import { FolderTree } from "./folder-tree"
import { useConfirm } from "@atlas/ui/hooks/use-confirm"
import {
  WorkspaceSidebar,
  WorkspaceSidebarGroup,
  WorkspaceSidebarItem,
} from "@/components/workspace-sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@atlas/ui/components/dropdown-menu"

interface SidebarFiltersProps {
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
  onCreateTag?: (name: string) => Promise<void>
  isFolderModalOpen: boolean
  setIsFolderModalOpen: (open: boolean) => void
  folderToEdit: any
  folderForm: any
  onEditFolder: (folder: any) => void
  onDeleteFolder: (id: string) => void
  onCreateSubfolder?: (parentId: string) => void
  filterBroken?: boolean
  onSelectBroken: (broken: boolean | undefined) => void
  filterDuplicates?: boolean
  onSelectDuplicates: (dup: boolean | undefined) => void
  filterTrash?: boolean
  onSelectTrash?: (trash: boolean | undefined) => void
  healthSummary?: any
  onScan: () => void
  onExport: (format: "html" | "csv" | "txt" | "zip") => void
  onImport: (e: React.ChangeEvent<HTMLInputElement>) => void
  resetFolderForm: () => void
  onItemSelect?: () => void
  viewSection?: "all" | "folders" | "library"
}

const tagSchema = z.object({
  name: z
    .string()
    .min(1, "Tag name is required")
    .max(30, "Tag name must be at most 30 characters"),
})

export function CabinetSidebarFilters({
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
  onCreateTag,
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
  healthSummary,
  onScan,
  onExport,
  onImport,
  resetFolderForm,
  onItemSelect,
  viewSection = "all",
}: SidebarFiltersProps) {
  const confirm = useConfirm()
  const queryClient = useQueryClient()
  const [isTagModalOpen, setIsTagModalOpen] = React.useState(false)
  const [isCreatingTag, setIsCreatingTag] = React.useState(false)

  const tagForm = useForm({
    defaultValues: {
      name: "",
    },
    validators: {
      onSubmit: tagSchema,
    },
    onSubmit: async ({ value }) => {
      const cleanName = value.name.replace(/^#/, "").trim()
      if (!cleanName) return
      setIsCreatingTag(true)
      try {
        if (onCreateTag) {
          await onCreateTag(cleanName)
        } else {
          await AXIOS_INSTANCE.post("/v1/tags", { name: cleanName })
        }
        await queryClient.invalidateQueries({ queryKey: ["/v1/tags"] })
        tagForm.reset()
        setIsTagModalOpen(false)
        toast.success(`Tag #${cleanName} created!`)
      } catch {
        toast.error("Failed to create tag")
      } finally {
        setIsCreatingTag(false)
      }
    },
  })

  return (
    <WorkspaceSidebar>
      {/* Quick Filters / Library Group */}
      {viewSection !== "folders" && (
        <>
          <WorkspaceSidebarGroup title="Library">
            <WorkspaceSidebarItem
              icon={<BookmarkSimple className="h-3.5 w-3.5" />}
              label="All Bookmarks"
              badge={healthSummary?.total}
              isActive={
                selectedFolderId === undefined &&
                filterFavorite === undefined &&
                filterArchived === false &&
                selectedTag === undefined &&
                filterBroken === undefined &&
                filterDuplicates === undefined &&
                filterTrash === undefined
              }
              onClick={() => {
                onSelectFolder(undefined)
                onSelectTag(undefined)
                onSelectFavorite(undefined)
                onSelectArchived(false)
                onSelectBroken(undefined)
                onSelectDuplicates(undefined)
                onSelectTrash?.(undefined)
                onItemSelect?.()
              }}
            />

            <WorkspaceSidebarItem
              icon={<Star className="h-3.5 w-3.5 text-[#956400]" />}
              label="Favorites"
              badge={healthSummary?.favorites}
              isActive={filterFavorite === true}
              onClick={() => {
                onSelectFolder(undefined)
                onSelectTag(undefined)
                onSelectFavorite(true)
                onSelectArchived(false)
                onSelectBroken(undefined)
                onSelectDuplicates(undefined)
                onSelectTrash?.(undefined)
                onItemSelect?.()
              }}
            />

            <WorkspaceSidebarItem
              icon={<Archive className="h-3.5 w-3.5" />}
              label="Archive"
              badge={healthSummary?.archived}
              isActive={filterArchived === true}
              onClick={() => {
                onSelectFolder(undefined)
                onSelectTag(undefined)
                onSelectFavorite(undefined)
                onSelectArchived(true)
                onSelectBroken(undefined)
                onSelectDuplicates(undefined)
                onSelectTrash?.(undefined)
                onItemSelect?.()
              }}
            />

            <WorkspaceSidebarItem
              icon={<Trash className="h-3.5 w-3.5" />}
              label="Trash"
              badge={healthSummary?.trash}
              isActive={filterTrash === true}
              onClick={() => {
                onSelectFolder(undefined)
                onSelectTag(undefined)
                onSelectFavorite(undefined)
                onSelectArchived(undefined)
                onSelectBroken(undefined)
                onSelectDuplicates(undefined)
                onSelectTrash?.(true)
                onItemSelect?.()
              }}
            />
          </WorkspaceSidebarGroup>

          {/* Health / Maintenance Group */}
          <WorkspaceSidebarGroup
            title="Health"
            action={
              <button
                onClick={onScan}
                title="Scan links status now"
                className="rounded-none p-1 text-brand-muted transition-colors hover:bg-brand-charcoal/5 hover:text-brand-charcoal"
              >
                <ArrowClockwise className="h-3 w-3" />
              </button>
            }
          >
            <WorkspaceSidebarItem
              icon={<Warning className="h-3.5 w-3.5 text-red-500" />}
              label="Broken Links"
              badge={healthSummary?.broken}
              isActive={filterBroken === true}
              onClick={() => {
                onSelectFolder(undefined)
                onSelectTag(undefined)
                onSelectFavorite(undefined)
                onSelectArchived(undefined)
                onSelectBroken(true)
                onSelectDuplicates(undefined)
                onSelectTrash?.(undefined)
                onItemSelect?.()
              }}
            />

            <WorkspaceSidebarItem
              icon={<Copy className="h-3.5 w-3.5" />}
              label="Duplicates"
              badge={healthSummary?.duplicates}
              isActive={filterDuplicates === true}
              onClick={() => {
                onSelectFolder(undefined)
                onSelectTag(undefined)
                onSelectFavorite(undefined)
                onSelectArchived(undefined)
                onSelectBroken(undefined)
                onSelectDuplicates(true)
                onSelectTrash?.(undefined)
                onItemSelect?.()
              }}
            />
          </WorkspaceSidebarGroup>
        </>
      )}

      {/* Folders Group */}
      {viewSection !== "library" && (
        <>
          <WorkspaceSidebarGroup
            title="Folders"
            action={
              <Dialog open={isFolderModalOpen} onOpenChange={setIsFolderModalOpen}>
                <DialogTrigger
                  onClick={() => {
                    resetFolderForm()
                    setIsFolderModalOpen(true)
                  }}
                  className="rounded-none p-1 text-brand-muted hover:bg-brand-charcoal/5 hover:text-brand-charcoal"
                  title="Create folder"
                >
                  <FolderPlus className="h-3.5 w-3.5" />
                </DialogTrigger>

                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>
                      {folderToEdit ? "Edit Folder" : "New Folder"}
                    </DialogTitle>
                    <DialogDescription>
                      Cabinet collection management
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
                    <FieldGroup>
                      <folderForm.Field
                        name="name"
                        children={(field: any) => {
                          const isInvalid =
                            field.state.meta.isTouched && !field.state.meta.isValid
                          return (
                            <Field data-invalid={isInvalid}>
                              <FieldLabel htmlFor={field.name}>
                                Folder Name
                              </FieldLabel>
                              <Input
                                id={field.name}
                                name={field.name}
                                value={field.state.value}
                                onChange={(e) => field.handleChange(e.target.value)}
                                onBlur={field.handleBlur}
                                aria-invalid={isInvalid}
                                placeholder="e.g. Design Inspiration"
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

                      <folderForm.Field
                        name="description"
                        children={(field: any) => {
                          const isInvalid =
                            field.state.meta.isTouched && !field.state.meta.isValid
                          return (
                            <Field data-invalid={isInvalid}>
                              <FieldLabel htmlFor={field.name}>
                                Description (optional)
                              </FieldLabel>
                              <Input
                                id={field.name}
                                name={field.name}
                                value={field.state.value}
                                onChange={(e) => field.handleChange(e.target.value)}
                                onBlur={field.handleBlur}
                                aria-invalid={isInvalid}
                                placeholder="Short notes about this collection..."
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

                      <folderForm.Field
                        name="parentId"
                        children={(field: any) => {
                          const isInvalid =
                            field.state.meta.isTouched && !field.state.meta.isValid
                          return (
                            <Field data-invalid={isInvalid}>
                              <FieldLabel htmlFor={field.name}>
                                Parent Folder (optional)
                              </FieldLabel>
                              <Select
                                value={field.state.value || ""}
                                onValueChange={(val) =>
                                  field.handleChange(val === "" ? null : val)
                                }
                              >
                                <SelectTrigger
                                  id={field.name}
                                  className="rounded-none border-brand-border"
                                >
                                  <SelectValue placeholder="Root (No parent folder)" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="">
                                    Root (No parent folder)
                                  </SelectItem>
                                  {folders
                                    .filter((f) =>
                                      folderToEdit ? f.id !== folderToEdit.id : true
                                    )
                                    .map((f) => (
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
                    </FieldGroup>

                    <div className="flex gap-2.5 pt-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsFolderModalOpen(false)}
                        className="flex-1 text-xs uppercase"
                      >
                        Cancel
                      </Button>
                      <folderForm.Subscribe
                        selector={(state: any) => [
                          state.canSubmit,
                          state.isSubmitting,
                        ]}
                        children={([canSubmit, isSubmitting]: any) => (
                          <Button
                            type="submit"
                            disabled={!canSubmit || isSubmitting}
                            className="flex-1 text-xs uppercase"
                          >
                            {isSubmitting ? (
                              <Spinner className="h-3.5 w-3.5 animate-spin" />
                            ) : folderToEdit ? (
                              "Save Changes"
                            ) : (
                              "Save Folder"
                            )}
                          </Button>
                        )}
                      />
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            }
          >
            <FolderTree
              folders={folders}
              selectedFolderId={selectedFolderId}
              onSelectFolder={(id) => {
                onSelectFolder(id)
                onSelectTag(undefined)
                onSelectFavorite(undefined)
                onSelectArchived(undefined)
                onSelectBroken(undefined)
                onSelectDuplicates(undefined)
                onSelectTrash?.(undefined)
                onItemSelect?.()
              }}
              onEditFolder={onEditFolder}
              onDeleteFolder={onDeleteFolder}
              onCreateSubfolder={onCreateSubfolder}
            />
          </WorkspaceSidebarGroup>

          {/* Tags Group */}
          <WorkspaceSidebarGroup
            title="Tags"
            action={
              <Dialog open={isTagModalOpen} onOpenChange={setIsTagModalOpen}>
                <DialogTrigger
                  onClick={() => {
                    tagForm.reset()
                    setIsTagModalOpen(true)
                  }}
                  className="rounded-none p-1 text-brand-muted hover:bg-brand-charcoal/5 hover:text-brand-charcoal"
                  title="Create tag"
                >
                  <Plus className="h-3.5 w-3.5" />
                </DialogTrigger>

                <DialogContent className="sm:max-w-xs">
                  <DialogHeader>
                    <DialogTitle>New Tag</DialogTitle>
                    <DialogDescription>
                      Create a tag label to organize your bookmarks
                    </DialogDescription>
                  </DialogHeader>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      tagForm.handleSubmit()
                    }}
                    className="space-y-4"
                  >
                    <tagForm.Field
                      name="name"
                      children={(field: any) => {
                        const isInvalid =
                          field.state.meta.isTouched && !field.state.meta.isValid
                        return (
                          <Field data-invalid={isInvalid}>
                            <FieldLabel htmlFor={field.name}>Tag Name</FieldLabel>
                            <Input
                              id={field.name}
                              name={field.name}
                              value={field.state.value}
                              onChange={(e) => field.handleChange(e.target.value)}
                              onBlur={field.handleBlur}
                              aria-invalid={isInvalid}
                              placeholder="e.g. design, ai, reading"
                              autoFocus
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

                    <div className="flex gap-2 pt-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsTagModalOpen(false)}
                        className="flex-1 text-xs uppercase"
                      >
                        Cancel
                      </Button>
                      <tagForm.Subscribe
                        selector={(state: any) => [
                          state.canSubmit,
                          state.isSubmitting,
                        ]}
                        children={([canSubmit, isSubmitting]: any) => (
                          <Button
                            type="submit"
                            disabled={!canSubmit || isSubmitting || isCreatingTag}
                            className="flex-1 text-xs uppercase"
                          >
                            {isCreatingTag ? (
                              <Spinner className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              "Create"
                            )}
                          </Button>
                        )}
                      />
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            }
          >
            <div className="flex flex-wrap gap-1 px-2 pt-1">
              {tags.length === 0 ? (
                <span className="font-mono text-[10px] text-brand-muted italic">
                  No tags yet
                </span>
              ) : (
                tags.map((tag: any) => {
                  const isSelected = selectedTag === tag.name
                  return (
                    <div
                      key={tag.id}
                      className={cn(
                        "group inline-flex items-center rounded-none border font-mono text-[10px] transition-colors",
                        isSelected
                          ? "border-brand-charcoal bg-brand-charcoal text-white"
                          : "border-brand-border bg-white text-brand-muted hover:border-brand-charcoal/40 hover:text-brand-charcoal"
                      )}
                    >
                      <button
                        onClick={() => {
                          const newTag = isSelected ? undefined : tag.name
                          onSelectTag(newTag)
                          onSelectFolder(undefined)
                          onSelectFavorite(undefined)
                          onSelectArchived(undefined)
                          onSelectBroken(undefined)
                          onSelectDuplicates(undefined)
                          onSelectTrash?.(undefined)
                          onItemSelect?.()
                        }}
                        className="flex items-center gap-1 px-2 py-1"
                      >
                        <TagIcon className="size-2.5 opacity-60" />
                        <span>{tag.name}</span>
                      </button>
                      <button
                        onClick={async (e) => {
                          e.stopPropagation()
                          const isConfirmed = await confirm({
                            title: "Delete Tag",
                            description: `Are you sure you want to delete tag "${tag.name}"? This will untag all associated bookmarks.`,
                            actionLabel: "Delete",
                            variant: "destructive",
                          })
                          if (isConfirmed) {
                            onDeleteTag(tag.id)
                          }
                        }}
                        className={cn(
                          "flex h-full items-center justify-center border-l px-1.5 transition-colors",
                          isSelected
                            ? "border-white/20 hover:bg-white/10 hover:text-white"
                            : "border-brand-border hover:bg-red-50 hover:text-red-600"
                        )}
                        title="Delete tag"
                      >
                        <X className="size-2.5" />
                      </button>
                    </div>
                  )
                })
              )}
            </div>
          </WorkspaceSidebarGroup>
        </>
      )}

      {/* Sync Group */}
      {viewSection !== "folders" && (
        <WorkspaceSidebarGroup title="Sync">
          <div className="flex flex-col gap-2 px-2 pt-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex h-8 w-full items-center justify-center gap-1.5 font-mono text-[10px] uppercase"
                >
                  <DownloadSimple className="size-3.5" />
                  Export Bookmarks
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                className="min-w-none w-[var(--radix-dropdown-menu-trigger-width)]"
              >
                <DropdownMenuItem onClick={() => onExport("html")}>
                  Export as HTML (.html)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onExport("csv")}>
                  Export as CSV (.csv)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onExport("txt")}>
                  Export as TXT (.txt)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onExport("zip")}>
                  Export as ZIP Archive (.zip)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <label className="w-full">
              <span className="flex h-8 cursor-pointer items-center justify-center gap-1.5 rounded-none border border-brand-border bg-white px-3 font-mono text-xs text-[10px] font-semibold text-brand-charcoal uppercase shadow-none transition-colors hover:bg-brand-canvas">
                <UploadSimple className="size-3.5" />
                Import HTML
              </span>
              <input
                type="file"
                accept=".html"
                onChange={onImport}
                className="hidden"
              />
            </label>
          </div>
        </WorkspaceSidebarGroup>
      )}
    </WorkspaceSidebar>
  )
}
