import React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"
import { authClient } from "@/lib/auth-client"
import type { DisplayPreferences } from "./display-preferences"
import { Button } from "@/components/ui/button"
import { useForm } from "@tanstack/react-form"
import { useQueryClient } from "@tanstack/react-query"
import * as z from "zod"
import { FolderDialog } from "./folder-dialog"
import { TagDialog } from "./tag-dialog"
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
  FileText,
  LinkSimple,
  VideoCamera,
  Gear,
  CaretUpDown,
  Sun,
  Moon,
  Desktop,
  SignOut,
  Sliders,
} from "@phosphor-icons/react"
import { AXIOS_INSTANCE } from "@/lib/api-client"
import { toast } from "@/components/ui/sonner"
import { FolderTree } from "./folder-tree"
import { useConfirm } from "@/hooks/use-confirm"
import {
  WorkspaceSidebar,
  WorkspaceSidebarGroup,
  WorkspaceSidebarItem,
} from "@/components/workspace-sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"

interface SidebarFiltersProps {
  user?: any
  onLogout?: () => void
  displayPreferences?: DisplayPreferences
  onDisplayPreferencesChange?: (prefs: DisplayPreferences) => void
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
  filterType?: "BOOKMARK" | "NOTE" | undefined
  onSelectType?: (type: "BOOKMARK" | "NOTE" | undefined) => void
  filterContentType?: string | undefined
  onSelectContentType?: (type: string | undefined) => void
  healthSummary?: any
  onScan: () => void
  onImport: (e: React.ChangeEvent<HTMLInputElement>) => void
  resetFolderForm: () => void
  onItemSelect?: () => void
  viewSection?: "all" | "folders" | "library"
  onDropBookmarkToFolder?: (folderId: string, bookmarkIds: string[]) => void
}

const tagSchema = z.object({
  name: z
    .string()
    .min(1, "Tag name is required")
    .max(30, "Tag name must be at most 30 characters"),
})

export function CabinetSidebarFilters({
  user: userProp,
  onLogout: onLogoutProp,
  displayPreferences,
  onDisplayPreferencesChange,
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
  filterType,
  onSelectType,
  filterContentType,
  onSelectContentType,
  healthSummary,
  onScan,
  onImport,
  resetFolderForm,
  onItemSelect,
  viewSection = "all",
  onDropBookmarkToFolder,
}: SidebarFiltersProps) {
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const { data: session } = authClient.useSession()
  const currentUser = userProp !== undefined ? userProp : session?.user

  const handleLogout = async () => {
    if (onLogoutProp) {
      onLogoutProp()
      return
    }
    try {
      const { error } = await authClient.signOut()
      if (error) throw new Error(error.message || "Sign-out failed")
      queryClient.clear()
      toast.success("Logged out successfully")
      router.replace("/login")
    } catch {
      toast.error("Sign-out failed. Try again.")
    }
  }

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
    <WorkspaceSidebar data-bookmark-sidebar className="h-full">
      <div className="flex-1 overflow-y-auto space-y-6 pr-1 pb-4">
      {/* Quick Filters / Library Group */}
      {viewSection !== "folders" && (
        <>
          <WorkspaceSidebarGroup title="Library">
            <WorkspaceSidebarItem
              icon={<BookmarkSimple className="h-3.5 w-3.5" />}
              label="All Items"
              badge={healthSummary?.total}
              isActive={
                selectedFolderId === undefined &&
                filterFavorite === undefined &&
                filterArchived === false &&
                selectedTag === undefined &&
                filterBroken === undefined &&
                filterDuplicates === undefined &&
                filterTrash === undefined &&
                filterType === undefined &&
                filterContentType === undefined
              }
              onClick={() => {
                onSelectFolder(undefined)
                onSelectTag(undefined)
                onSelectFavorite(undefined)
                onSelectArchived(false)
                onSelectBroken(undefined)
                onSelectDuplicates(undefined)
                onSelectTrash?.(undefined)
                onSelectType?.(undefined)
                onSelectContentType?.(undefined)
                onItemSelect?.()
              }}
            />

            <WorkspaceSidebarItem
              icon={<LinkSimple className="h-3.5 w-3.5" />}
              label="Bookmarks"
              isActive={filterType === "BOOKMARK"}
              onClick={() => {
                onSelectFolder(undefined)
                onSelectTag(undefined)
                onSelectFavorite(undefined)
                onSelectArchived(false)
                onSelectBroken(undefined)
                onSelectDuplicates(undefined)
                onSelectTrash?.(undefined)
                onSelectType?.("BOOKMARK")
                onSelectContentType?.(undefined)
                onItemSelect?.()
              }}
            />

            <WorkspaceSidebarItem
              icon={<FileText className="h-3.5 w-3.5 text-amber-600" />}
              label="Notes"
              isActive={filterType === "NOTE"}
              onClick={() => {
                onSelectFolder(undefined)
                onSelectTag(undefined)
                onSelectFavorite(undefined)
                onSelectArchived(false)
                onSelectBroken(undefined)
                onSelectDuplicates(undefined)
                onSelectTrash?.(undefined)
                onSelectType?.("NOTE")
                onSelectContentType?.(undefined)
                onItemSelect?.()
              }}
            />

            <WorkspaceSidebarItem
              icon={<VideoCamera className="h-3.5 w-3.5 text-purple-600" />}
              label="Media & Videos"
              isActive={filterContentType === "VIDEO"}
              onClick={() => {
                onSelectFolder(undefined)
                onSelectTag(undefined)
                onSelectFavorite(undefined)
                onSelectArchived(false)
                onSelectBroken(undefined)
                onSelectDuplicates(undefined)
                onSelectTrash?.(undefined)
                onSelectType?.(undefined)
                onSelectContentType?.("VIDEO")
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
                onSelectType?.(undefined)
                onSelectContentType?.(undefined)
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
                onSelectType?.(undefined)
                onSelectContentType?.(undefined)
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
                onSelectType?.(undefined)
                onSelectContentType?.(undefined)
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
              <button
                type="button"
                onClick={() => {
                  resetFolderForm()
                  setIsFolderModalOpen(true)
                }}
                className="rounded-none p-1 text-brand-muted hover:bg-brand-charcoal/5 hover:text-brand-charcoal"
                title="Create folder"
              >
                <FolderPlus className="h-3.5 w-3.5" />
              </button>
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
              onDropBookmarkToFolder={onDropBookmarkToFolder}
            />
          </WorkspaceSidebarGroup>

          {/* Folder Form Dialog */}
          <FolderDialog
            isOpen={isFolderModalOpen}
            onOpenChange={setIsFolderModalOpen}
            folderToEdit={folderToEdit}
            folderForm={folderForm}
            folders={folders}
            onClose={() => setIsFolderModalOpen(false)}
          />

          {/* Tags Group */}
          <WorkspaceSidebarGroup
            title="Tags"
            action={
              <button
                type="button"
                onClick={() => {
                  tagForm.reset()
                  setIsTagModalOpen(true)
                }}
                className="rounded-none p-1 text-brand-muted hover:bg-brand-charcoal/5 hover:text-brand-charcoal"
                title="Create tag"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
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
                            : "border-brand-border hover:bg-destructive/10 hover:text-destructive"
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

          {/* Tag Form Dialog */}
          <TagDialog
            isOpen={isTagModalOpen}
            onOpenChange={setIsTagModalOpen}
            tagForm={tagForm}
            isCreatingTag={isCreatingTag}
            onClose={() => setIsTagModalOpen(false)}
          />
        </>
      )}

      {/* Sync Group */}
      {viewSection !== "folders" && (
        <WorkspaceSidebarGroup title="Sync">
          <div className="flex flex-col gap-2 px-2 pt-1">
            <label className="w-full">
              <span className="flex h-8 cursor-pointer items-center justify-center gap-1.5 rounded-none border border-brand-border bg-white px-3 font-mono text-[10px] font-semibold text-brand-charcoal uppercase shadow-none transition-colors hover:bg-brand-canvas">
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
      </div>

      {/* User Account & Settings Footer */}
      <div className="shrink-0 border-t border-brand-border pt-2 pb-1">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="group/user flex w-full items-center justify-between gap-2.5 rounded-none p-1.5 text-left transition-colors hover:bg-brand-charcoal/5 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              aria-label="User account and settings"
            >
              <div className="flex min-w-0 flex-1 items-center gap-2.5">
                <div className="flex size-7 shrink-0 items-center justify-center rounded-none border border-brand-border bg-brand-charcoal/10 font-serif text-xs font-semibold text-brand-charcoal uppercase">
                  {currentUser?.name?.[0]?.toUpperCase() ||
                    currentUser?.email?.[0]?.toUpperCase() ||
                    "U"}
                </div>
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-xs font-semibold leading-tight text-brand-charcoal">
                    {currentUser?.name || "Cabinet User"}
                  </span>
                  <span className="truncate font-mono text-[10px] text-brand-muted">
                    {currentUser?.email || "Signed in"}
                  </span>
                </div>
              </div>
              <CaretUpDown className="size-3.5 shrink-0 text-brand-muted group-hover/user:text-brand-charcoal" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side="top"
            align="start"
            sideOffset={8}
            className="w-56 rounded-none"
          >
            <DropdownMenuGroup>
              <div className="border-b border-border px-3 py-2">
                <p className="truncate text-xs font-semibold text-foreground">
                  {currentUser?.name || "Cabinet User"}
                </p>
                <p className="truncate font-mono text-[10px] text-muted-foreground">
                  {currentUser?.email}
                </p>
              </div>

              <DropdownMenuItem asChild>
                <Link
                  href="/cabinet/settings"
                  className="flex cursor-pointer items-center gap-2 text-xs"
                >
                  <Gear className="size-3.5" />
                  <span>Settings</span>
                </Link>
              </DropdownMenuItem>

              <DropdownMenuSub>
                <DropdownMenuSubTrigger className="flex cursor-pointer items-center gap-2 text-xs">
                  {theme === "dark" ? (
                    <Moon className="size-3.5" />
                  ) : theme === "light" ? (
                    <Sun className="size-3.5" />
                  ) : (
                    <Desktop className="size-3.5" />
                  )}
                  <span>Theme</span>
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="w-36 rounded-none">
                  <DropdownMenuRadioGroup
                    value={theme}
                    onValueChange={setTheme}
                  >
                    <DropdownMenuRadioItem value="light" className="text-xs">
                      <Sun className="mr-2 size-3.5" /> Light
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="dark" className="text-xs">
                      <Moon className="mr-2 size-3.5" /> Dark
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="system" className="text-xs">
                      <Desktop className="mr-2 size-3.5" /> System
                    </DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuSubContent>
              </DropdownMenuSub>

              {displayPreferences && onDisplayPreferencesChange && (
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className="flex cursor-pointer items-center gap-2 text-xs">
                    <Sliders className="size-3.5" />
                    <span>Display details</span>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="w-44 rounded-none">
                    {(
                      [
                        ["showTitle", "Title"],
                        ["showDescription", "Description"],
                        ["showImage", "Image"],
                        ["showWebsite", "Website URL"],
                        ["showFolder", "Folder"],
                        ["showDate", "Date added"],
                      ] as const
                    ).map(([key, label]) => (
                      <DropdownMenuCheckboxItem
                        key={key}
                        className="text-xs"
                        checked={displayPreferences?.[key] ?? true}
                        onCheckedChange={(checked) => {
                          onDisplayPreferencesChange({
                            ...displayPreferences,
                            [key]: checked,
                          })
                        }}
                        onSelect={(e) => e.preventDefault()}
                      >
                        {label}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              )}

              <DropdownMenuSeparator />

              <DropdownMenuItem
                variant="destructive"
                onSelect={handleLogout}
                className="flex cursor-pointer items-center gap-2 text-xs"
              >
                <SignOut className="size-3.5" />
                <span>Log Out</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </WorkspaceSidebar>
  )
}
