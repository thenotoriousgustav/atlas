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
import { useAuthStore } from '../store/useAuthStore';
import {
  Button,
  Card,
  Badge,
  Input,
  Label,
} from '@atlas/ui';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import {
  SignOut,
  BookmarkSimple,
  Clock,
  ArrowSquareOut,
  FolderSimple,
  Plus,
  Star,
  Archive,
  Trash,
  PencilSimple,
  FolderPlus,
  MagnifyingGlass,
  UploadSimple,
  DownloadSimple,
  Tag as TagIcon,
} from '@phosphor-icons/react';

export const dynamic = 'force-dynamic';

export default function DashboardPage() {
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

  const resetBookmarkForm = () => {
    setBookmarkToEdit(null);
    bookmarkForm.reset();
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

  // Helper to render folder hierarchy
  const renderFolderTree = (parentId: string | null = null, depth = 0) => {
    const list = folders.filter((f: any) => f.parentId === parentId);
    if (list.length === 0) return null;

    return (
      <div className="space-y-1">
        {list.map((folder: any) => {
          const isSelected = selectedFolderId === folder.id;
          return (
            <div key={folder.id} className="space-y-1">
              <div
                style={{ paddingLeft: `${depth * 12 + 8}px` }}
                className={`group flex items-center justify-between rounded-none py-1.5 pr-2 text-xs transition-colors cursor-pointer ${
                  isSelected ? 'bg-[#111111]/5 text-[#111111] font-semibold' : 'text-[#787774] hover:bg-[#111111]/5 hover:text-[#111111]'
                }`}
                onClick={() => {
                  setSelectedFolderId(folder.id);
                  setSelectedTag(undefined);
                  setFilterFavorite(undefined);
                }}
              >
                <span className="flex items-center gap-2 truncate">
                  <FolderSimple className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{folder.name}</span>
                </span>
                <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditFolder(folder);
                    }}
                    className="p-0.5 hover:bg-[#111111]/10 rounded-none"
                    title="Edit folder"
                  >
                    <PencilSimple className="w-3 h-3 text-[#787774]" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteFolder(folder.id);
                    }}
                    className="p-0.5 hover:bg-brand-red-bg hover:text-brand-red-text rounded-none"
                    title="Delete folder"
                  >
                    <Trash className="w-3 h-3" />
                  </button>
                </div>
              </div>
              {renderFolderTree(folder.id, depth + 1)}
            </div>
          );
        })}
      </div>
    );
  };

  // Rendering Loader
  if (!mounted || isLoading || !user) {
    return (
      <div className="min-h-[100dvh] bg-brand-canvas p-8 flex flex-col items-center justify-center font-mono text-xs text-[#787774] space-y-4">
        <div className="w-12 h-1 bg-[#EAEAEA] animate-pulse rounded-none" />
        <div className="uppercase tracking-widest animate-pulse">Initializing session...</div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-brand-canvas py-8 px-4 md:px-12">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Workspace Nav Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between border-b border-brand-border pb-5 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 bg-[#111111] flex items-center justify-center rounded-none text-white font-serif italic text-sm font-semibold">
              C
            </div>
            <div>
              <h1 className="font-serif text-2xl font-medium tracking-tight text-[#111111]">Cabinet</h1>
              <p className="text-[10px] text-[#787774] font-mono tracking-tight uppercase">
                Gustam platform · Workspace
              </p>
            </div>
          </div>

          {/* User badge and actions */}
          <div className="flex items-center gap-4">
            <div className="text-right font-mono hidden sm:block">
              <p className="text-xs font-semibold text-[#111111]">{user.name}</p>
              <p className="text-[10px] text-[#787774]">{user.email}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="flex items-center gap-1.5 font-semibold text-[10px] tracking-tight uppercase"
            >
              <SignOut className="w-3.5 h-3.5" />
              Sign out
            </Button>
          </div>
        </header>

        {/* Dashboard Grid */}
        <main className="grid grid-cols-1 md:grid-cols-4 gap-8 items-start">
          
          {/* Left Sidebar (1 col) */}
          <aside className="md:col-span-1 space-y-6">
            
            {/* Quick Filters */}
            <div className="space-y-1">
              <h3 className="text-[10px] font-mono text-[#787774] uppercase tracking-wider px-2">Library</h3>
              <button
                onClick={() => {
                  setSelectedFolderId(undefined);
                  setSelectedTag(undefined);
                  setFilterFavorite(undefined);
                  setFilterArchived(false);
                }}
                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-none text-xs transition-colors text-left ${
                  selectedFolderId === undefined && filterFavorite === undefined && filterArchived === false && selectedTag === undefined
                    ? 'bg-[#111111]/5 text-[#111111] font-semibold'
                    : 'text-[#787774] hover:bg-[#111111]/5 hover:text-[#111111]'
                }`}
              >
                <BookmarkSimple className="w-3.5 h-3.5" />
                All Bookmarks
              </button>

              <button
                onClick={() => {
                  setSelectedFolderId(undefined);
                  setSelectedTag(undefined);
                  setFilterFavorite(true);
                  setFilterArchived(false);
                }}
                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-none text-xs transition-colors text-left ${
                  filterFavorite === true
                    ? 'bg-[#111111]/5 text-[#111111] font-semibold'
                    : 'text-[#787774] hover:bg-[#111111]/5 hover:text-[#111111]'
                }`}
              >
                <Star className="w-3.5 h-3.5 text-[#956400]" />
                Favorites
              </button>

              <button
                onClick={() => {
                  setSelectedFolderId(undefined);
                  setSelectedTag(undefined);
                  setFilterFavorite(undefined);
                  setFilterArchived(true);
                }}
                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-none text-xs transition-colors text-left ${
                  filterArchived === true
                    ? 'bg-[#111111]/5 text-[#111111] font-semibold'
                    : 'text-[#787774] hover:bg-[#111111]/5 hover:text-[#111111]'
                }`}
              >
                <Archive className="w-3.5 h-3.5" />
                Archive
              </button>
            </div>

            {/* Folders */}
            <div className="space-y-2">
              <div className="flex items-center justify-between px-2">
                <h3 className="text-[10px] font-mono text-[#787774] uppercase tracking-wider">Folders</h3>
                
                {/* Folder creation wrapped in Dialog Trigger */}
                <Dialog open={isFolderModalOpen} onOpenChange={setIsFolderModalOpen}>
                  <DialogTrigger asChild>
                    <button
                      onClick={() => {
                        resetFolderForm();
                        setIsFolderModalOpen(true);
                      }}
                      className="p-1 hover:bg-[#111111]/5 rounded-none text-[#787774] hover:text-[#111111]"
                      title="Create folder"
                    >
                      <FolderPlus className="w-3.5 h-3.5" />
                    </button>
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
                      <folderForm.Field
                        name="name"
                        children={(field) => (
                          <div className="space-y-1.5">
                            <Label htmlFor={field.name}>Folder Name</Label>
                            <Input
                              id={field.name}
                              name={field.name}
                              value={field.state.value}
                              onBlur={field.handleBlur}
                              onChange={(e) => field.handleChange(e.target.value)}
                              placeholder="e.g. Design Inspiration"
                              required
                            />
                          </div>
                        )}
                      />

                      <folderForm.Field
                        name="description"
                        children={(field) => (
                          <div className="space-y-1.5">
                            <Label htmlFor={field.name}>Description</Label>
                            <Input
                              id={field.name}
                              name={field.name}
                              value={field.state.value}
                              onBlur={field.handleBlur}
                              onChange={(e) => field.handleChange(e.target.value)}
                              placeholder="Describe folder contents..."
                            />
                          </div>
                        )}
                      />

                      <folderForm.Field
                        name="parentId"
                        children={(field) => (
                          <div className="space-y-1.5">
                            <Label htmlFor={field.name}>Parent Folder (Optional)</Label>
                            <select
                              id={field.name}
                              name={field.name}
                              value={field.state.value}
                              onChange={(e) => field.handleChange(e.target.value)}
                              className="w-full h-10 px-3 rounded-none border border-brand-border bg-white text-[#111111] text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#111111]/30 font-medium"
                            >
                              <option value="">None (Root)</option>
                              {folders
                                .filter((f: any) => f.id !== folderToEdit?.id)
                                .map((f: any) => (
                                  <option key={f.id} value={f.id}>
                                    {f.name}
                                  </option>
                                ))}
                            </select>
                          </div>
                        )}
                      />

                      <div className="flex gap-2.5 pt-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsFolderModalOpen(false)}
                          className="flex-1 text-xs uppercase"
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          className="flex-1 text-xs uppercase bg-[#111111] hover:bg-[#111111]/90"
                        >
                          Save Folder
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="max-h-[220px] overflow-y-auto pr-1">
                {folders.length === 0 ? (
                  <p className="text-[11px] text-[#787774] italic px-2">No folders created</p>
                ) : (
                  renderFolderTree(null)
                )}
              </div>
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <h3 className="text-[10px] font-mono text-[#787774] uppercase tracking-wider px-2">Tags</h3>
              <div className="flex flex-wrap gap-1.5 px-2">
                {tags.length === 0 ? (
                  <p className="text-[11px] text-[#787774] italic">No active tags</p>
                ) : (
                  tags.map((tag: any) => {
                    const isSelected = selectedTag === tag.name;
                    return (
                      <button
                        key={tag.id}
                        onClick={() => {
                          setSelectedTag(isSelected ? undefined : tag.name);
                          setSelectedFolderId(undefined);
                          setFilterFavorite(undefined);
                        }}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-none text-[10px] font-mono transition-colors border ${
                          isSelected
                            ? 'bg-[#111111] text-white border-[#111111]'
                            : 'bg-white text-[#787774] border-brand-border hover:border-[#111111]/30 hover:text-[#111111]'
                        }`}
                      >
                        <TagIcon className="w-2.5 h-2.5" />
                        {tag.name}
                        <span className={`text-[8px] ${isSelected ? 'text-white/70' : 'text-[#787774]/70'}`}>
                          ({tag.bookmarkCount})
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Import & Export */}
            <div className="border-t border-brand-border pt-4 px-2 space-y-2">
              <h3 className="text-[10px] font-mono text-[#787774] uppercase tracking-wider">Sync</h3>
              <div className="flex flex-col gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExport}
                  className="w-full flex items-center gap-1.5 justify-center font-mono text-[10px] uppercase h-8"
                >
                  <DownloadSimple className="w-3.5 h-3.5" />
                  Export HTML
                </Button>
                <label className="w-full">
                  <span className="flex items-center gap-1.5 justify-center font-mono text-[10px] uppercase border border-brand-border bg-white text-[#111111] hover:bg-[#FBFBFA] rounded-none h-8 cursor-pointer transition-colors px-3 font-semibold text-xs border border-brand-border shadow-none">
                    <UploadSimple className="w-3.5 h-3.5" />
                    Import HTML
                  </span>
                  <input
                    type="file"
                    accept=".html"
                    onChange={handleImport}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

          </aside>

          {/* Main Bookmarks Content (3 cols) */}
          <section className="md:col-span-3 space-y-6">
            
            {/* Toolbar (Search & Add) */}
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white p-3.5 rounded-none border border-brand-border shadow-sm">
              <div className="relative w-full sm:max-w-xs">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <MagnifyingGlass className="w-4 h-4 text-[#787774]" />
                </span>
                <Input
                  type="text"
                  placeholder="Search titles, descriptions, URLs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 text-xs"
                />
              </div>

              {/* Bookmark creation wrapped in Dialog Trigger */}
              <Dialog open={isBookmarkModalOpen} onOpenChange={setIsBookmarkModalOpen}>
                <DialogTrigger asChild>
                  <Button
                    onClick={() => {
                      resetBookmarkForm();
                      setIsBookmarkModalOpen(true);
                    }}
                    className="w-full sm:w-auto h-9 flex items-center gap-1.5 text-xs font-semibold uppercase bg-[#111111] hover:bg-[#111111]/90"
                  >
                    <Plus className="w-4 h-4" />
                    Add Bookmark
                  </Button>
                </DialogTrigger>

                <DialogContent className="sm:max-w-lg">
                  <DialogHeader>
                    <DialogTitle>{bookmarkToEdit ? 'Edit Bookmark' : 'New Bookmark'}</DialogTitle>
                    <DialogDescription>Resource collection</DialogDescription>
                  </DialogHeader>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      bookmarkForm.handleSubmit();
                    }}
                    className="space-y-4"
                  >
                    <bookmarkForm.Field
                      name="url"
                      children={(field) => (
                        <div className="space-y-1.5">
                          <Label htmlFor={field.name}>URL</Label>
                          <Input
                            id={field.name}
                            name={field.name}
                            value={field.state.value}
                            onBlur={field.handleBlur}
                            onChange={(e) => field.handleChange(e.target.value)}
                            placeholder="https://example.com"
                            type="url"
                            required
                          />
                        </div>
                      )}
                    />

                    <bookmarkForm.Field
                      name="title"
                      children={(field) => (
                        <div className="space-y-1.5">
                          <Label htmlFor={field.name}>Title (Optional)</Label>
                          <Input
                            id={field.name}
                            name={field.name}
                            value={field.state.value}
                            onBlur={field.handleBlur}
                            onChange={(e) => field.handleChange(e.target.value)}
                            placeholder="Leave blank to fetch from URL metadata"
                          />
                        </div>
                      )}
                    />

                    <bookmarkForm.Field
                      name="description"
                      children={(field) => (
                        <div className="space-y-1.5">
                          <Label htmlFor={field.name}>Description (Optional)</Label>
                          <Input
                            id={field.name}
                            name={field.name}
                            value={field.state.value}
                            onBlur={field.handleBlur}
                            onChange={(e) => field.handleChange(e.target.value)}
                            placeholder="Optional notes or details"
                          />
                        </div>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <bookmarkForm.Field
                        name="folderId"
                        children={(field) => (
                          <div className="space-y-1.5">
                            <Label htmlFor={field.name}>Folder</Label>
                            <select
                              id={field.name}
                              name={field.name}
                              value={field.state.value}
                              onChange={(e) => field.handleChange(e.target.value)}
                              className="w-full h-10 px-3 rounded-none border border-brand-border bg-white text-[#111111] text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#111111]/30 font-medium"
                            >
                              <option value="">None (Root)</option>
                              {folders.map((f: any) => (
                                <option key={f.id} value={f.id}>
                                  {f.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                      />

                      <bookmarkForm.Field
                        name="tags"
                        children={(field) => (
                          <div className="space-y-1.5">
                            <Label htmlFor={field.name}>Tags (Comma-separated)</Label>
                            <Input
                              id={field.name}
                              name={field.name}
                              value={field.state.value}
                              onBlur={field.handleBlur}
                              onChange={(e) => field.handleChange(e.target.value)}
                              placeholder="react, tailwind, guide"
                            />
                          </div>
                        )}
                      />
                    </div>

                    <div className="flex gap-2.5 pt-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsBookmarkModalOpen(false)}
                        className="flex-1 text-xs uppercase"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        className="flex-1 text-xs uppercase bg-[#111111] hover:bg-[#111111]/90"
                      >
                        Save Bookmark
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>

            </div>

            {/* List Header */}
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-mono text-[#787774] uppercase tracking-wider flex items-center gap-2">
                <BookmarkSimple className="w-4 h-4 text-[#111111]" />
                {selectedFolderId
                  ? `Folder: ${folders.find((f: any) => f.id === selectedFolderId)?.name}`
                  : selectedTag
                    ? `Tag: ${selectedTag}`
                    : filterFavorite
                      ? 'Favorite Bookmarks'
                      : filterArchived
                        ? 'Archived Bookmarks'
                        : 'All Bookmarks'}
              </h2>
              <Badge variant="outline" className="font-mono text-[9px] px-2 py-0.5">
                {bookmarks.length} Items
              </Badge>
            </div>

            {/* Bookmarks Grid / List */}
            {isBookmarksLoading ? (
              <div className="space-y-4">
                <div className="h-24 bg-white border border-brand-border animate-pulse rounded-none" />
                <div className="h-24 bg-white border border-brand-border animate-pulse rounded-none" />
              </div>
            ) : bookmarks.length === 0 ? (
              <div className="bg-white border border-brand-border rounded-none p-10 text-center">
                <p className="text-xs text-[#787774] italic">No bookmarks found matching the filters.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {bookmarks.map((bookmark: any) => (
                  <Card
                    key={bookmark.id}
                    className="border-brand-border bg-white rounded-none p-5 transition-all hover:border-[#111111]/30 flex flex-col sm:flex-row gap-4 justify-between items-start"
                  >
                    <div className="space-y-2.5 flex-1 min-w-0">
                      
                      {/* URL / Title / Category */}
                      <div className="space-y-1">
                        <div className="flex items-start gap-2.5 flex-wrap">
                          <a
                            href={bookmark.url}
                            target="_blank"
                            rel="noreferrer"
                            className="group flex items-center gap-1 text-sm font-semibold text-[#111111] hover:underline break-all"
                          >
                            {bookmark.title || bookmark.url}
                            <ArrowSquareOut className="w-3.5 h-3.5 text-[#787774] opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                          </a>
                          {bookmark.folder && (
                            <Badge variant="outline" className="text-[9px] bg-brand-green-bg text-brand-green-text border-none shrink-0 font-mono py-0.5 px-1.5 uppercase">
                              {bookmark.folder.name}
                            </Badge>
                          )}
                        </div>
                        <p className="text-[10px] text-[#787774]/70 font-mono truncate">{bookmark.url}</p>
                      </div>

                      {/* Description */}
                      {bookmark.description && (
                        <p className="text-xs text-[#787774] leading-relaxed max-w-[65ch]">
                          {bookmark.description}
                        </p>
                      )}

                      {/* Tags */}
                      {bookmark.tags && bookmark.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {bookmark.tags.map((tag: any) => (
                            <span
                              key={tag.id}
                              onClick={() => setSelectedTag(tag.name)}
                              className="px-1.5 py-0.5 bg-brand-blue-bg text-brand-blue-text rounded-none text-[9px] font-mono border-none cursor-pointer hover:opacity-80 transition-opacity"
                            >
                              #{tag.name}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Footer Info */}
                      <div className="flex items-center gap-3 pt-1 text-[9px] text-[#787774]/80 font-mono">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(bookmark.createdAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                      </div>

                    </div>

                    {/* Bookmark actions */}
                    <div className="flex sm:flex-col items-center gap-1.5 shrink-0 self-end sm:self-start w-full sm:w-auto justify-end">
                      <button
                        onClick={() => toggleFavorite(bookmark)}
                        className={`p-1.5 rounded-none border border-brand-border transition-colors ${
                          bookmark.isFavorite ? 'bg-brand-yellow-bg text-brand-yellow-text border-[#956400]/20' : 'bg-white hover:bg-[#111111]/5'
                        }`}
                        title="Mark as favorite"
                      >
                        <Star className="w-4 h-4" weight={bookmark.isFavorite ? 'fill' : 'regular'} />
                      </button>

                      <button
                        onClick={() => toggleArchive(bookmark)}
                        className={`p-1.5 rounded-none border border-brand-border transition-colors ${
                          bookmark.isArchived ? 'bg-brand-blue-bg text-brand-blue-text border-brand-blue-text/20' : 'bg-white hover:bg-[#111111]/5'
                        }`}
                        title="Archive bookmark"
                      >
                        <Archive className="w-4 h-4" weight={bookmark.isArchived ? 'fill' : 'regular'} />
                      </button>

                      <button
                        onClick={() => handleEditBookmark(bookmark)}
                        className="p-1.5 rounded-none border border-brand-border bg-white hover:bg-[#111111]/5 transition-colors"
                        title="Edit bookmark"
                      >
                        <PencilSimple className="w-4 h-4 text-[#787774]" />
                      </button>

                      <button
                        onClick={() => handleDeleteBookmark(bookmark.id)}
                        className="p-1.5 rounded-none border border-brand-border bg-white hover:bg-brand-red-bg hover:text-brand-red-text hover:border-brand-red-text/20 transition-colors"
                        title="Delete bookmark"
                      >
                        <Trash className="w-4 h-4" />
                      </button>
                    </div>

                  </Card>
                ))}
              </div>
            )}

          </section>

        </main>
      </div>

    </div>
  );
}
