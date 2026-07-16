'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useForm } from '@tanstack/react-form';
import {
  useAuthControllerMe,
  useAuthControllerLogout,
  useFoldersControllerFindAll,
  useFoldersControllerCreate,
  useFoldersControllerUpdate,
  useFoldersControllerRemove,
  useBookmarksControllerFindAll,
  useBookmarksControllerCreate,
  useBookmarksControllerUpdate,
  useBookmarksControllerRemove,
  useTagsControllerFindAll,
  useBookmarksControllerImport,
  AXIOS_INSTANCE,
} from '@atlas/api-client';
import { useAuthStore } from '../../store/useAuthStore';
import { WorkspaceHeader } from './components/workspace-header';
import { SidebarFilters } from './components/sidebar-filters';
import { Toolbar } from './components/toolbar';
import { BookmarkList } from './components/bookmark-list';
import { Archive, Trash } from '@phosphor-icons/react';
import { Button } from '@atlas/ui/components/button';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@atlas/ui/components/select';
import {
  ActionBar,
  ActionBarSelection,
  ActionBarGroup,
  ActionBarItem,
  ActionBarSeparator,
} from '@atlas/ui/components/action-bar';

export const dynamic = 'force-dynamic';

export function CabinetDashboard() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, setUser, logout } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Filters & State
  const [selectedFolderId, setSelectedFolderId] = useState<string | undefined>(undefined);
  const [filterFavorite, setFilterFavorite] = useState<boolean | undefined>(undefined);
  const [filterArchived, setFilterArchived] = useState<boolean | undefined>(false); // default active only
  const [selectedTag, setSelectedTag] = useState<string | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchDebounced, setSearchDebounced] = useState<string>('');
  const [viewMode, setViewMode] = useState<'card' | 'list' | 'moodboard'>('card');
  const [selectedBookmarkIds, setSelectedBookmarkIds] = useState<string[]>([]);

  // Load viewMode from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('cabinet_view_mode');
    if (saved === 'card' || saved === 'list' || saved === 'moodboard') {
      setViewMode(saved as any);
    }
  }, []);

  const handleViewModeChange = (mode: 'card' | 'list' | 'moodboard') => {
    setViewMode(mode);
    localStorage.setItem('cabinet_view_mode', mode);
  };

  // Modals state
  const [isBookmarkModalOpen, setIsBookmarkModalOpen] = useState(false);
  const [bookmarkToEdit, setBookmarkToEdit] = useState<any | null>(null);

  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [folderToEdit, setFolderToEdit] = useState<any | null>(null);

  // TanStack Forms
  const folderForm = useForm({
    defaultValues: {
      name: '',
      description: '',
      parentId: '',
    },
    onSubmit: async ({ value }) => {
      try {
        if (folderToEdit) {
          await updateFolderMutation.mutateAsync({
            id: folderToEdit.id,
            data: {
              name: value.name,
              description: value.description || undefined,
              parentId: value.parentId || undefined,
            },
          });
        } else {
          await createFolderMutation.mutateAsync({
            data: {
              name: value.name,
              description: value.description || undefined,
              parentId: value.parentId || undefined,
            },
          });
        }
        queryClient.invalidateQueries({ queryKey: ['/v1/folders'] });
        setIsFolderModalOpen(false);
        resetFolderForm();
      } catch {
        alert('Failed to save folder');
      }
    },
  });

  const bookmarkForm = useForm({
    defaultValues: {
      url: '',
      title: '',
      description: '',
      folderId: '',
      tags: '',
    },
    onSubmit: async ({ value }) => {
      const tagsArray = value.tags
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      try {
        if (bookmarkToEdit) {
          await updateBookmarkMutation.mutateAsync({
            id: bookmarkToEdit.id,
            data: {
              url: value.url,
              title: value.title || undefined,
              description: value.description || undefined,
              folderId: value.folderId || undefined,
              tags: tagsArray,
            },
          });
        } else {
          await createBookmarkMutation.mutateAsync({
            data: {
              url: value.url,
              title: value.title || undefined,
              description: value.description || undefined,
              folderId: value.folderId || undefined,
              tags: tagsArray,
            },
          });
        }
        queryClient.invalidateQueries({ queryKey: ['/v1/bookmarks'] });
        queryClient.invalidateQueries({ queryKey: ['/v1/tags'] });
        setIsBookmarkModalOpen(false);
        resetBookmarkForm();
      } catch {
        alert('Failed to save bookmark');
      }
    },
  });

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setSearchDebounced(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const { data: meData, isLoading: isMeLoading } = useAuthControllerMe({
    query: {
      retry: false,
      enabled: true,
    },
  });

  // Fetch Folders, Bookmarks, Tags
  const { data: foldersData } = useFoldersControllerFindAll();
  const folders = (foldersData as any)?.data || [];

  const { data: tagsData } = useTagsControllerFindAll();
  const tags = (tagsData as any)?.data || [];

  const {
    data: bookmarksData,
    isLoading: isBookmarksLoading,
  } = useBookmarksControllerFindAll(
    {
      folderId: selectedFolderId,
      isFavorite: filterFavorite ? 'true' : undefined,
      isArchived:
        filterArchived === undefined
          ? undefined
          : filterArchived
            ? 'true'
            : 'false',
      tag: selectedTag,
      search: searchDebounced || undefined,
    } as any
  );
  const bookmarks = (bookmarksData as any)?.data || [];

  // Mutations
  const createFolderMutation = useFoldersControllerCreate();
  const updateFolderMutation = useFoldersControllerUpdate();
  const removeFolderMutation = useFoldersControllerRemove();

  const createBookmarkMutation = useBookmarksControllerCreate();
  const updateBookmarkMutation = useBookmarksControllerUpdate();
  const removeBookmarkMutation = useBookmarksControllerRemove();
  const importBookmarksMutation = useBookmarksControllerImport();

  // Sync mount status
  useEffect(() => {
    setMounted(true);
  }, []);

  // Sync backend session into Zustand store
  useEffect(() => {
    if (!isMeLoading) {
      if ((meData as any)?.success && (meData as any)?.data) {
        setUser((meData as any).data);
      } else {
        setUser(null);
        router.push('/login');
      }
      setIsLoading(false);
    }
  }, [meData, isMeLoading, setUser, router]);

  // Handle logout mutation
  const logoutMutation = useAuthControllerLogout();

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
      logout();
      router.push('/login');
    } catch {
      logout();
      router.push('/login');
    }
  };

  const handleEditFolder = (folder: any) => {
    setFolderToEdit(folder);
    folderForm.setFieldValue('name', folder.name);
    folderForm.setFieldValue('description', folder.description || '');
    folderForm.setFieldValue('parentId', folder.parentId || '');
    setIsFolderModalOpen(true);
  };

  const handleDeleteFolder = async (id: string) => {
    if (confirm('Are you sure you want to delete this folder? All subfolders and bookmarks inside it will be soft-deleted.')) {
      try {
        await removeFolderMutation.mutateAsync({ id });
        queryClient.invalidateQueries({ queryKey: ['/v1/folders'] });
        queryClient.invalidateQueries({ queryKey: ['/v1/bookmarks'] });
        queryClient.invalidateQueries({ queryKey: ['/v1/tags'] });
        if (selectedFolderId === id) {
          setSelectedFolderId(undefined);
        }
      } catch {
        alert('Failed to delete folder');
      }
    }
  };

  const resetFolderForm = () => {
    setFolderToEdit(null);
    folderForm.reset();
  };

  const handleEditBookmark = (bookmark: any) => {
    setBookmarkToEdit(bookmark);
    bookmarkForm.setFieldValue('url', bookmark.url);
    bookmarkForm.setFieldValue('title', bookmark.title || '');
    bookmarkForm.setFieldValue('description', bookmark.description || '');
    bookmarkForm.setFieldValue('folderId', bookmark.folderId || '');
    bookmarkForm.setFieldValue('tags', bookmark.tags?.map((t: any) => t.name).join(', ') || '');
    setIsBookmarkModalOpen(true);
  };

  const handleDeleteBookmark = async (id: string) => {
    if (confirm('Are you sure you want to delete this bookmark?')) {
      try {
        await removeBookmarkMutation.mutateAsync({ id });
        queryClient.invalidateQueries({ queryKey: ['/v1/bookmarks'] });
        queryClient.invalidateQueries({ queryKey: ['/v1/tags'] });
      } catch {
        alert('Failed to delete bookmark');
      }
    }
  };

  const toggleFavorite = async (bookmark: any) => {
    try {
      await updateBookmarkMutation.mutateAsync({
        id: bookmark.id,
        data: {
          isFavorite: !bookmark.isFavorite,
        },
      });
      queryClient.invalidateQueries({ queryKey: ['/v1/bookmarks'] });
    } catch {
      alert('Failed to update favorite status');
    }
  };

  const toggleArchive = async (bookmark: any) => {
    try {
      await updateBookmarkMutation.mutateAsync({
        id: bookmark.id,
        data: {
          isArchived: !bookmark.isArchived,
        },
      });
      queryClient.invalidateQueries({ queryKey: ['/v1/bookmarks'] });
      queryClient.invalidateQueries({ queryKey: ['/v1/tags'] });
    } catch {
      alert('Failed to update archive status');
    }
  };

  const handleDuplicateBookmark = async (bookmark: any) => {
    try {
      await createBookmarkMutation.mutateAsync({
        data: {
          url: bookmark.url,
          title: bookmark.title ? `${bookmark.title} (Copy)` : undefined,
          description: bookmark.description || undefined,
          folderId: bookmark.folderId || undefined,
          tags: bookmark.tags?.map((t: any) => t.name) || [],
        },
      });
      queryClient.invalidateQueries({ queryKey: ['/v1/bookmarks'] });
      queryClient.invalidateQueries({ queryKey: ['/v1/tags'] });
    } catch {
      alert('Failed to duplicate bookmark');
    }
  };

  const resetBookmarkForm = () => {
    setBookmarkToEdit(null);
    bookmarkForm.reset();
  };

  const handleToggleSelectBookmark = (id: string) => {
    setSelectedBookmarkIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleClearSelection = () => {
    setSelectedBookmarkIds([]);
  };

  const handleBulkDelete = async () => {
    if (
      !confirm(
        `Are you sure you want to delete ${selectedBookmarkIds.length} selected bookmarks?`
      )
    )
      return;
    try {
      await Promise.all(
        selectedBookmarkIds.map((id) => removeBookmarkMutation.mutateAsync({ id }))
      );
      queryClient.invalidateQueries({ queryKey: ['/v1/bookmarks'] });
      queryClient.invalidateQueries({ queryKey: ['/v1/tags'] });
      setSelectedBookmarkIds([]);
    } catch {
      alert('Failed to delete some bookmarks');
    }
  };

  const handleBulkArchive = async () => {
    try {
      await Promise.all(
        selectedBookmarkIds.map((id) =>
          updateBookmarkMutation.mutateAsync({
            id,
            data: { isArchived: true },
          })
        )
      );
      queryClient.invalidateQueries({ queryKey: ['/v1/bookmarks'] });
      queryClient.invalidateQueries({ queryKey: ['/v1/tags'] });
      setSelectedBookmarkIds([]);
    } catch {
      alert('Failed to archive some bookmarks');
    }
  };

  const handleBulkMove = async (folderId: string | null) => {
    try {
      await Promise.all(
        selectedBookmarkIds.map((id) =>
          updateBookmarkMutation.mutateAsync({
            id,
            data: { folderId: folderId || undefined },
          })
        )
      );
      queryClient.invalidateQueries({ queryKey: ['/v1/bookmarks'] });
      setSelectedBookmarkIds([]);
    } catch {
      alert('Failed to move some bookmarks');
    }
  };

  // Import / Export handlers
  const handleExport = async () => {
    try {
      const res = await AXIOS_INSTANCE.get('/v1/bookmarks/export', { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'text/html' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'cabinet_bookmarks.html';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      alert('Failed to export bookmarks');
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const content = evt.target?.result as string;
      try {
        await importBookmarksMutation.mutateAsync({
          data: { htmlContent: content },
        });
        queryClient.invalidateQueries({ queryKey: ['/v1/bookmarks'] });
        queryClient.invalidateQueries({ queryKey: ['/v1/folders'] });
        queryClient.invalidateQueries({ queryKey: ['/v1/tags'] });
        alert('Bookmarks imported successfully!');
      } catch {
        alert('Failed to import bookmarks. Ensure it is a valid Netscape Bookmark HTML file.');
      }
    };
    reader.readAsText(file);
  };

  // Rendering Loader
  if (!mounted || isLoading || !user) {
    return (
      <div className="min-h-[100dvh] bg-brand-canvas p-8 flex flex-col items-center justify-center font-mono text-xs text-brand-muted space-y-4">
        <div className="w-12 h-1 bg-[#EAEAEA] animate-pulse rounded-none" />
        <div className="uppercase tracking-widest animate-pulse">Initializing session...</div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-brand-canvas py-8 px-4 md:px-12">
      <div className="max-w-8xl mx-auto space-y-8">
        
        {/* Workspace Nav Header */}
        <WorkspaceHeader user={user} onLogout={handleLogout} />

        {/* Dashboard Grid */}
        <main className="grid grid-cols-1 md:grid-cols-4 gap-8 items-start">
          
          {/* Left Sidebar (1 col) */}
          <SidebarFilters
            selectedFolderId={selectedFolderId}
            onSelectFolder={setSelectedFolderId}
            selectedTag={selectedTag}
            onSelectTag={setSelectedTag}
            filterFavorite={filterFavorite}
            onSelectFavorite={setFilterFavorite}
            filterArchived={filterArchived}
            onSelectArchived={setFilterArchived}
            folders={folders}
            tags={tags}
            isFolderModalOpen={isFolderModalOpen}
            setIsFolderModalOpen={setIsFolderModalOpen}
            folderToEdit={folderToEdit}
            folderForm={folderForm}
            onEditFolder={handleEditFolder}
            onDeleteFolder={handleDeleteFolder}
            onExport={handleExport}
            onImport={handleImport}
            resetFolderForm={resetFolderForm}
          />

          {/* Main Bookmarks Content (3 cols) */}
          <section className="md:col-span-3 space-y-6">
            
            {/* Toolbar (Search & Add) */}
            <Toolbar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              isBookmarkModalOpen={isBookmarkModalOpen}
              setIsBookmarkModalOpen={setIsBookmarkModalOpen}
              bookmarkToEdit={bookmarkToEdit}
              bookmarkForm={bookmarkForm}
              folders={folders}
              resetBookmarkForm={resetBookmarkForm}
              viewMode={viewMode}
              onViewModeChange={handleViewModeChange}
            />

            {/* Bookmarks Grid / List */}
            <BookmarkList
              bookmarks={bookmarks}
              isBookmarksLoading={isBookmarksLoading}
              selectedFolderId={selectedFolderId}
              selectedTag={selectedTag}
              filterFavorite={filterFavorite}
              filterArchived={filterArchived}
              folders={folders}
              viewMode={viewMode}
              selectedBookmarkIds={selectedBookmarkIds}
              onToggleSelect={handleToggleSelectBookmark}
              onSelectTag={(tag) => {
                setSelectedTag(tag);
                setSelectedFolderId(undefined);
                setFilterFavorite(undefined);
              }}
              onToggleFavorite={toggleFavorite}
              onToggleArchive={toggleArchive}
              onEditBookmark={handleEditBookmark}
              onDeleteBookmark={handleDeleteBookmark}
              onDuplicateBookmark={handleDuplicateBookmark}
            />

          </section>

        </main>
      </div>

      <ActionBar
        open={selectedBookmarkIds.length > 0}
        align="center"
        className="rounded-none border border-brand-border bg-white shadow-md p-1.5 gap-1.5"
      >
        <ActionBarSelection className="border-none text-[10px] font-mono text-brand-muted uppercase tracking-wider px-2 py-0 bg-transparent">
          {selectedBookmarkIds.length} Selected
        </ActionBarSelection>
        <ActionBarSeparator />
        <ActionBarGroup className="gap-1.5">
          <Select
            value=""
            onValueChange={(val) => handleBulkMove(val || null)}
          >
            <SelectTrigger className="h-8 border-brand-border bg-white text-[10px] tracking-wider uppercase font-bold text-brand-charcoal focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-charcoal/30 rounded-none w-40 px-2.5">
              <SelectValue placeholder="MOVE TO..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">None (Root)</SelectItem>
              {folders.map((f: any) => (
                <SelectItem key={f.id} value={f.id}>
                  {f.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <ActionBarItem
            onClick={handleBulkArchive}
            className="h-8 text-[10px] tracking-wider uppercase font-bold bg-white text-brand-charcoal border border-brand-border hover:bg-brand-canvas px-3 rounded-none"
          >
            <Archive className="w-3.5 h-3.5 mr-1" />
            Archive
          </ActionBarItem>

          <ActionBarItem
            onClick={handleBulkDelete}
            className="h-8 text-[10px] tracking-wider uppercase font-bold bg-brand-red-bg text-brand-red-text border border-brand-red-text/20 hover:bg-[#fff0f2] px-3 rounded-none"
          >
            <Trash className="w-3.5 h-3.5 mr-1" />
            Delete
          </ActionBarItem>

          <ActionBarSeparator />
          
          <Button
            variant="ghost"
            size="xs"
            onClick={handleClearSelection}
            className="h-8 font-mono text-[10px] uppercase font-bold text-brand-muted hover:text-brand-charcoal px-2.5 rounded-none"
          >
            Cancel
          </Button>
        </ActionBarGroup>
      </ActionBar>
    </div>
  );
}
