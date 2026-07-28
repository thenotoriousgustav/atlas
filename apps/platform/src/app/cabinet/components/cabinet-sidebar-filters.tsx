import React from 'react';
import { Spinner } from '@atlas/ui/components/spinner';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@atlas/ui/components/dialog';
import { Button } from '@atlas/ui/components/button';
import { Input } from '@atlas/ui/components/input';
import {
  Field,
  FieldGroup,
  FieldLabel,
} from '@atlas/ui/components/field';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@atlas/ui/components/select';
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
} from '@phosphor-icons/react';
import { FolderTree } from './folder-tree';
import { useConfirm } from '@atlas/ui/hooks/use-confirm';
import {
  WorkspaceSidebar,
  WorkspaceSidebarGroup,
  WorkspaceSidebarItem,
} from '@/components/workspace-sidebar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@atlas/ui/components/dropdown-menu';

interface SidebarFiltersProps {
  selectedFolderId?: string;
  onSelectFolder: (id: string | undefined) => void;
  selectedTag?: string;
  onSelectTag: (tag: string | undefined) => void;
  filterFavorite?: boolean;
  onSelectFavorite: (fav: boolean | undefined) => void;
  filterArchived?: boolean;
  onSelectArchived: (arch: boolean | undefined) => void;
  folders: any[];
  tags: any[];
  onDeleteTag: (id: string) => void;
  isFolderModalOpen: boolean;
  setIsFolderModalOpen: (open: boolean) => void;
  folderToEdit: any;
  folderForm: any;
  onEditFolder: (folder: any) => void;
  onDeleteFolder: (id: string) => void;
  onCreateSubfolder?: (parentId: string) => void;
  filterBroken?: boolean;
  onSelectBroken: (broken: boolean | undefined) => void;
  filterDuplicates?: boolean;
  onSelectDuplicates: (dup: boolean | undefined) => void;
  healthSummary?: any;
  onScan: () => void;
  onExport: (format: 'html' | 'csv' | 'txt' | 'zip') => void;
  onImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
  resetFolderForm: () => void;
}

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
  healthSummary,
  onScan,
  onExport,
  onImport,
  resetFolderForm,
}: SidebarFiltersProps) {
  const confirm = useConfirm();

  return (
    <WorkspaceSidebar>
      {/* Quick Filters / Library Group */}
      <WorkspaceSidebarGroup title="Library">
        <WorkspaceSidebarItem
          icon={<BookmarkSimple className="w-3.5 h-3.5" />}
          label="All Bookmarks"
          badge={healthSummary?.total}
          isActive={
            selectedFolderId === undefined &&
            filterFavorite === undefined &&
            filterArchived === false &&
            selectedTag === undefined
          }
          onClick={() => {
            onSelectFolder(undefined);
            onSelectTag(undefined);
            onSelectFavorite(undefined);
            onSelectArchived(false);
            onSelectBroken(undefined);
            onSelectDuplicates(undefined);
          }}
        />

        <WorkspaceSidebarItem
          icon={<Star className="w-3.5 h-3.5 text-[#956400]" />}
          label="Favorites"
          badge={healthSummary?.favorites}
          isActive={filterFavorite === true}
          onClick={() => {
            onSelectFolder(undefined);
            onSelectTag(undefined);
            onSelectFavorite(true);
            onSelectArchived(false);
            onSelectBroken(undefined);
            onSelectDuplicates(undefined);
          }}
        />

        <WorkspaceSidebarItem
          icon={<Archive className="w-3.5 h-3.5" />}
          label="Archive"
          badge={healthSummary?.archived}
          isActive={filterArchived === true}
          onClick={() => {
            onSelectFolder(undefined);
            onSelectTag(undefined);
            onSelectFavorite(undefined);
            onSelectArchived(true);
            onSelectBroken(undefined);
            onSelectDuplicates(undefined);
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
            className="text-brand-muted hover:text-brand-charcoal hover:bg-brand-charcoal/5 p-1 rounded-none transition-colors"
          >
            <ArrowClockwise className="w-3 h-3" />
          </button>
        }
      >
        <WorkspaceSidebarItem
          icon={<Warning className="w-3.5 h-3.5 text-red-500" />}
          label="Broken Links"
          badge={healthSummary?.broken}
          isActive={filterBroken === true}
          onClick={() => {
            onSelectFolder(undefined);
            onSelectTag(undefined);
            onSelectFavorite(undefined);
            onSelectArchived(undefined);
            onSelectBroken(true);
            onSelectDuplicates(undefined);
          }}
        />

        <WorkspaceSidebarItem
          icon={<Copy className="w-3.5 h-3.5" />}
          label="Duplicates"
          badge={healthSummary?.duplicates}
          isActive={filterDuplicates === true}
          onClick={() => {
            onSelectFolder(undefined);
            onSelectTag(undefined);
            onSelectFavorite(undefined);
            onSelectArchived(undefined);
            onSelectBroken(undefined);
            onSelectDuplicates(true);
          }}
        />
      </WorkspaceSidebarGroup>

      {/* Folders Group */}
      <WorkspaceSidebarGroup
        title="Folders"
        action={
          <Dialog open={isFolderModalOpen} onOpenChange={setIsFolderModalOpen}>
            <DialogTrigger
              onClick={() => {
                resetFolderForm();
                setIsFolderModalOpen(true);
              }}
              className="p-1 hover:bg-brand-charcoal/5 rounded-none text-brand-muted hover:text-brand-charcoal"
              title="Create folder"
            >
              <FolderPlus className="w-3.5 h-3.5" />
            </DialogTrigger>

            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>{folderToEdit ? 'Edit Folder' : 'New Folder'}</DialogTitle>
                <DialogDescription>Cabinet collection management</DialogDescription>
              </DialogHeader>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  folderForm.handleSubmit();
                }}
                className="space-y-4"
              >
                <FieldGroup>
                  <folderForm.Field
                    name="name"
                    children={(field: any) => (
                      <Field>
                        <FieldLabel htmlFor={field.name}>Folder Name</FieldLabel>
                        <Input
                          id={field.name}
                          name={field.name}
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          placeholder="e.g. Design Inspiration"
                          required
                        />
                      </Field>
                    )}
                  />

                  <folderForm.Field
                    name="description"
                    children={(field: any) => (
                      <Field>
                        <FieldLabel htmlFor={field.name}>Description</FieldLabel>
                        <Input
                          id={field.name}
                          name={field.name}
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          placeholder="Describe folder contents..."
                        />
                      </Field>
                    )}
                  />

                  <folderForm.Field
                    name="parentId"
                    children={(field: any) => (
                      <Field>
                        <FieldLabel htmlFor={field.name}>Parent Folder (Optional)</FieldLabel>
                        <Select
                          value={field.state.value}
                          onValueChange={(val) => field.handleChange(val)}
                        >
                          <SelectTrigger className="w-full h-10 px-3 rounded-none border border-brand-border bg-white text-brand-charcoal text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-charcoal/30 font-medium">
                            <SelectValue placeholder="None (Root)" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">None (Root)</SelectItem>
                            {folders
                              .filter((f: any) => f.id !== folderToEdit?.id)
                              .map((f: any) => (
                                <SelectItem key={f.id} value={f.id}>
                                  {f.name}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </Field>
                    )}
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
                    selector={(state: any) => [state.isSubmitting]}
                    children={([isSubmitting]: [boolean]) => (
                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex-1 text-xs uppercase bg-brand-charcoal hover:bg-brand-charcoal/90 gap-1.5 flex items-center justify-center"
                      >
                        {isSubmitting && <Spinner className="w-3.5 h-3.5" />}
                        Save Folder
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
            onSelectFolder(id);
            onSelectTag(undefined);
            onSelectFavorite(undefined);
            onSelectArchived(undefined);
            onSelectBroken(undefined);
            onSelectDuplicates(undefined);
          }}
          onEditFolder={onEditFolder}
          onDeleteFolder={onDeleteFolder}
          onCreateSubfolder={onCreateSubfolder}
        />
      </WorkspaceSidebarGroup>

      {/* Tags Group */}
      <WorkspaceSidebarGroup title="Tags">
        <div className="flex flex-wrap gap-1 pt-1 px-2">
          {tags.length === 0 ? (
            <p className="text-[10px] font-mono text-brand-muted italic">No tags created</p>
          ) : (
            tags.map((tag: any) => {
              const isSelected = selectedTag === tag.name;
              return (
                <div
                  key={tag.id}
                  className={`inline-flex items-center h-6 rounded-none font-mono text-[10px] transition-colors ${
                    isSelected
                      ? 'bg-brand-charcoal text-white font-semibold'
                      : 'bg-brand-canvas text-brand-muted hover:bg-brand-charcoal/10 hover:text-brand-charcoal border border-brand-border'
                  }`}
                >
                  <button
                    onClick={() => {
                      onSelectTag(isSelected ? undefined : tag.name);
                      onSelectFolder(undefined);
                      onSelectFavorite(undefined);
                      onSelectArchived(undefined);
                      onSelectBroken(undefined);
                      onSelectDuplicates(undefined);
                    }}
                    className="px-2 py-0.5 flex items-center gap-1.5 h-full"
                  >
                    <TagIcon className="size-3" />
                    <span>{tag.name}</span>
                    <span className={`text-[9px] ${isSelected ? 'text-white/70' : 'text-brand-muted'}`}>
                      ({tag.bookmarkCount})
                    </span>
                  </button>
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      const isConfirmed = await confirm({
                        title: 'Delete Tag',
                        description: `Are you sure you want to delete tag "${tag.name}"? This will untag all associated bookmarks.`,
                        actionLabel: 'Delete',
                        variant: 'destructive',
                      });
                      if (isConfirmed) {
                        onDeleteTag(tag.id);
                      }
                    }}
                    className={`h-full px-1.5 border-l flex items-center justify-center transition-colors ${
                      isSelected
                        ? 'border-white/20 hover:bg-white/10 hover:text-white'
                        : 'border-brand-border hover:bg-red-50 hover:text-red-600'
                    }`}
                    title="Delete tag"
                  >
                    <X className="size-2.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </WorkspaceSidebarGroup>

      {/* Sync Group */}
      <WorkspaceSidebarGroup title="Sync">
        <div className="flex flex-col gap-2 pt-1 px-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="w-full flex items-center gap-1.5 justify-center font-mono text-[10px] uppercase h-8"
              >
                <DownloadSimple className="size-3.5" />
                Export Bookmarks
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-[var(--radix-dropdown-menu-trigger-width)] min-w-none">
              <DropdownMenuItem onClick={() => onExport('html')}>
                Export as HTML (.html)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onExport('csv')}>
                Export as CSV (.csv)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onExport('txt')}>
                Export as TXT (.txt)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onExport('zip')}>
                Export as ZIP Archive (.zip)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <label className="w-full">
            <span className="flex items-center gap-1.5 justify-center font-mono text-[10px] uppercase border border-brand-border bg-white text-brand-charcoal hover:bg-brand-canvas rounded-none h-8 cursor-pointer transition-colors px-3 font-semibold text-xs border border-brand-border shadow-none">
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
    </WorkspaceSidebar>
  );
}
