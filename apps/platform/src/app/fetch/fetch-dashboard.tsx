'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useForm } from '@tanstack/react-form';
import {
  useAuthControllerMe,
  useAuthControllerLogout,
  useFetchControllerExtract,
  useFetchControllerGetHistory,
  useFetchControllerUpdateHistory,
  useFetchControllerRemoveHistory,
  useFetchControllerGetCollections,
  useFetchControllerCreateCollection,
  useFetchControllerRemoveCollection,
} from '@atlas/api-client';
import { useAuthStore } from '@/store/useAuthStore';
import { WorkspaceHeader } from './components/workspace-header';
import { Badge } from '@atlas/ui/components/badge';
import { Card } from '@atlas/ui/components/card';
import { Button } from '@atlas/ui/components/button';
import { Tooltip, TooltipTrigger, TooltipContent } from '@atlas/ui/components/tooltip';
import { Input } from '@atlas/ui/components/input';
import { Checkbox } from '@atlas/ui/components/checkbox';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@atlas/ui/components/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@atlas/ui/components/dialog';
import {
  Download,
  Trash,
  Clock,
  Coins,
  FileText,
  CalendarBlank,
  Heart,
  Info,
  Note,
  User,
  PlusCircle,
  X,
  MagnifyingGlass,
  ArrowSquareOut,
  FolderSimplePlus,
  Bookmark,
  HourglassMedium,
  Check,
  Video,
  MusicNotes,
} from '@phosphor-icons/react';

export const dynamic = 'force-dynamic';

export function FetchDashboard() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, setUser, logout } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Search & Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('');
  const [selectedCollectionId, setSelectedCollectionId] = useState<string>('');
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);

  // Extracted media info
  const [extractedMedia, setExtractedMedia] = useState<any | null>(null);
  const [extractingUrl, setExtractingUrl] = useState('');
  const [selectedFormatId, setSelectedFormatId] = useState('');
  const [downloadType, setDownloadType] = useState<'VIDEO' | 'AUDIO'>('VIDEO');

  // Operation statuses
  const [isExtracting, setIsExtracting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgressMessage, setDownloadProgressMessage] = useState('');

  // Collection modal
  const [isCollectionModalOpen, setIsCollectionModalOpen] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');

  // Fallback force states
  const [extractionError, setExtractionError] = useState(false);
  const [fallbackTitle, setFallbackTitle] = useState('');

  // Sync mount status
  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch Current User Profile
  const { data: meData, isLoading: isMeLoading } = useAuthControllerMe({
    query: {
      retry: false,
      enabled: true,
    },
  });

  // Sync session
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

  // Fetch Download History
  const { data: historyData } = useFetchControllerGetHistory(
    {
      search: searchQuery || undefined,
      platform: selectedPlatform || undefined,
      isFavorite: showOnlyFavorites || undefined,
      collectionId: selectedCollectionId || undefined,
    },
    { query: { enabled: !!user } }
  );

  const historyItems = (historyData as any)?.data || [];

  // Fetch Collections
  const { data: collectionsData } = useFetchControllerGetCollections({
    query: { enabled: !!user },
  });

  const collections = (collectionsData as any)?.data || [];

  // Mutations
  const extractMutation = useFetchControllerExtract();
  const updateHistoryMutation = useFetchControllerUpdateHistory();
  const removeHistoryMutation = useFetchControllerRemoveHistory();
  const createCollectionMutation = useFetchControllerCreateCollection();
  const removeCollectionMutation = useFetchControllerRemoveCollection();
  const logoutMutation = useAuthControllerLogout();

  // Handle URL Extraction
  const handleExtract = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!extractingUrl) return;

    setIsExtracting(true);
    setExtractedMedia(null);
    setExtractionError(false);
    setFallbackTitle('');

    try {
      const res = await extractMutation.mutateAsync({
        data: { url: extractingUrl },
      });

      if ((res as any)?.success && (res as any)?.data) {
        const media = (res as any).data;
        setExtractedMedia(media);
        // Set default format to best video
        const bestVideo = media.formats.find((f: any) => f.hasVideo);
        setSelectedFormatId(bestVideo ? bestVideo.formatId : '');
      } else {
        setExtractionError(true);
      }
    } catch {
      setExtractionError(true);
    } finally {
      setIsExtracting(false);
    }
  };

  // Handle Video Download and Stream
  const handleDownload = async () => {
    if (!extractedMedia || !user) return;

    setIsDownloading(true);
    setDownloadProgressMessage('Preparing download on server (yt-dlp)...');

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/v1/fetch/download`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            url: extractingUrl,
            formatId: selectedFormatId || undefined,
            mediaType: downloadType,
            title: extractedMedia.title,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Server download processing failed');
      }

      setDownloadProgressMessage('Streaming file to browser...');

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;

      const ext = downloadType === 'AUDIO' ? 'mp3' : 'mp4';
      const cleanTitle = extractedMedia.title.replace(/[^\w\s-]/gi, '').trim() || 'download';
      a.download = `${cleanTitle}.${ext}`;

      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);

      // Invalidate queries to refresh history
      queryClient.invalidateQueries({ queryKey: ['/v1/fetch/history'] });
      setExtractedMedia(null);
      setExtractingUrl('');
    } catch (err: any) {
      alert(`Download failed: ${err.message}`);
    } finally {
      setIsDownloading(false);
      setDownloadProgressMessage('');
    }
  };

  // Handle Blind/Fallback Force Download
  const handleFallbackDownload = async () => {
    if (!extractingUrl || !fallbackTitle || !user) return;

    setIsDownloading(true);
    setDownloadProgressMessage('Preparing force download on server (yt-dlp)...');

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/v1/fetch/download`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            url: extractingUrl,
            formatId: undefined, // Let yt-dlp select the best automatically
            mediaType: downloadType,
            title: fallbackTitle,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Server download processing failed');
      }

      setDownloadProgressMessage('Streaming file to browser...');

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;

      const ext = downloadType === 'AUDIO' ? 'mp3' : 'mp4';
      const cleanTitle = fallbackTitle.replace(/[^\w\s-]/gi, '').trim() || 'download';
      a.download = `${cleanTitle}.${ext}`;

      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);

      // Invalidate queries to refresh history
      queryClient.invalidateQueries({ queryKey: ['/v1/fetch/history'] });
      setExtractionError(false);
      setFallbackTitle('');
      setExtractingUrl('');
    } catch (err: any) {
      alert(`Download failed: ${err.message}`);
    } finally {
      setIsDownloading(false);
      setDownloadProgressMessage('');
    }
  };

  // Handle Redownload from History
  const handleRedownload = (item: any) => {
    setExtractingUrl(item.url);
    setExtractedMedia({
      title: item.title,
      author: item.author,
      thumbnail: item.thumbnail,
      formats: [],
    });
    setDownloadType(item.mediaType);
    setSelectedFormatId(item.resolution ? 'best' : '');
    // Auto-scroll to top download panel
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle Favorite Toggle
  const handleToggleFavorite = async (item: any) => {
    try {
      await updateHistoryMutation.mutateAsync({
        id: item.id,
        data: { isFavorite: !item.isFavorite },
      });
      queryClient.invalidateQueries({ queryKey: ['/v1/fetch/history'] });
    } catch {
      alert('Failed to update favorite status');
    }
  };

  // Handle Collection Assignment
  const handleAssignCollection = async (itemId: string, collectionId: string | null) => {
    try {
      await updateHistoryMutation.mutateAsync({
        id: itemId,
        data: { collectionId: collectionId as any },
      });
      queryClient.invalidateQueries({ queryKey: ['/v1/fetch/history'] });
    } catch {
      alert('Failed to update collection');
    }
  };

  // Handle Remove History item
  const handleRemoveHistoryItem = async (id: string) => {
    if (confirm('Delete this download log record?')) {
      try {
        await removeHistoryMutation.mutateAsync({ id });
        queryClient.invalidateQueries({ queryKey: ['/v1/fetch/history'] });
      } catch {
        alert('Failed to delete history record');
      }
    }
  };

  // Handle Create Collection
  const handleCreateCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCollectionName.trim()) return;

    try {
      await createCollectionMutation.mutateAsync({
        data: { name: newCollectionName.trim() },
      });
      queryClient.invalidateQueries({ queryKey: ['/v1/fetch/collections'] });
      setNewCollectionName('');
      setIsCollectionModalOpen(false);
    } catch {
      alert('Failed to create collection');
    }
  };

  // Handle Remove Collection
  const handleRemoveCollection = async (id: string) => {
    if (confirm('Delete this collection? Videos in it will be un-categorized.')) {
      try {
        await removeCollectionMutation.mutateAsync({ id });
        queryClient.invalidateQueries({ queryKey: ['/v1/fetch/collections'] });
        queryClient.invalidateQueries({ queryKey: ['/v1/fetch/history'] });
        if (selectedCollectionId === id) setSelectedCollectionId('');
      } catch {
        alert('Failed to delete collection');
      }
    }
  };

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

  const formatBytes = (bytes: number | null) => {
    if (bytes === null || bytes === undefined) return '--';
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatDuration = (secs: number | null) => {
    if (!secs) return '--';
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case 'YouTube':
        return 'bg-[#fdeded] text-[#b3261e] border-[#b3261e]/20';
      case 'TikTok':
        return 'bg-brand-charcoal text-white border-none';
      case 'Instagram':
        return 'bg-[#fcedfc] text-[#c13584] border-[#c13584]/20';
      case 'Twitter':
        return 'bg-[#edf6fd] text-[#1da1f2] border-[#1da1f2]/20';
      case 'Reddit':
        return 'bg-[#fff2eb] text-[#ff4500] border-[#ff4500]/20';
      default:
        return 'bg-[#f1f1ef] text-brand-muted border-none';
    }
  };

  if (isLoading || isMeLoading || !user) {
    return (
      <div className="min-h-[60dvh] flex flex-col items-center justify-center font-mono text-xs text-brand-muted space-y-4 select-none">
        <Clock className="w-6 h-6 animate-spin text-brand-charcoal" />
        <span>Syncing Fetch session...</span>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-brand-canvas py-8 px-4 md:px-12 select-none font-mono text-xs">
      <div className="max-w-8xl mx-auto space-y-8">
        
        {/* Workspace Header */}
        <WorkspaceHeader user={user} onLogout={handleLogout} />

        {/* Input Bar Section */}
        <Card className="border-brand-border bg-white rounded-none p-6 shadow-none">
          <form onSubmit={handleExtract} className="space-y-4">
            <h2 className="text-[10px] font-bold text-brand-muted uppercase tracking-wider">
              Paste Media URL (YouTube, TikTok, Instagram, Threads, Facebook, X)
            </h2>
            <div className="flex flex-col sm:flex-row gap-3">
              <Input
                type="text"
                required
                placeholder="https://www.youtube.com/watch?v=... or https://vt.tiktok.com/..."
                value={extractingUrl}
                onChange={(e) => setExtractingUrl(e.target.value)}
                disabled={isExtracting || isDownloading}
                className="flex-1 h-10 border-brand-border bg-white text-brand-charcoal focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-charcoal/30 font-mono text-xs"
              />
              <Button
                type="submit"
                disabled={isExtracting || isDownloading}
                className="h-10 px-6 rounded-none bg-brand-charcoal text-white hover:bg-brand-charcoal/90 font-bold uppercase tracking-tight text-[10px]"
              >
                {isExtracting ? (
                  <>
                    <HourglassMedium className="w-4 h-4 mr-1.5 animate-spin" />
                    Extracting...
                  </>
                ) : (
                  'Fetch Info'
                )}
              </Button>
            </div>
          </form>
        </Card>

        {/* Active download progress info */}
        {isDownloading && (
          <div className="p-4 border border-[#e2b93b]/30 bg-[#fbf9f4] text-[#8f6d15] flex items-center gap-3 animate-pulse">
            <HourglassMedium className="w-4 h-4 animate-spin text-[#e2b93b]" />
            <span>{downloadProgressMessage}</span>
          </div>
        )}

        {/* Extracted Card Box (if any) */}
        {extractedMedia && (
          <Card className="border-brand-border bg-white rounded-none p-6 shadow-none animate-fadeIn">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              
              {/* Thumbnail col (4 cols) */}
              <div className="md:col-span-4 flex items-center justify-center bg-[#F1F1EF] p-2 border border-brand-border min-h-36 relative overflow-hidden">
                {extractedMedia.thumbnail ? (
                  <img
                    src={extractedMedia.thumbnail}
                    alt="Media preview"
                    className="max-h-48 object-contain"
                  />
                ) : (
                  <Video className="w-12 h-12 text-brand-muted" />
                )}
              </div>

              {/* Specs & Download col (8 cols) */}
              <div className="md:col-span-8 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={`${getPlatformColor(extractedMedia.platform)} text-[8px] uppercase tracking-wider font-mono py-0`}>
                      {extractedMedia.platform}
                    </Badge>
                    {extractedMedia.duration && (
                      <span className="text-[10px] text-brand-muted flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {formatDuration(extractedMedia.duration)}
                      </span>
                    )}
                  </div>
                  <h3 className="font-serif text-lg font-semibold tracking-tight text-brand-charcoal leading-tight">
                    {extractedMedia.title}
                  </h3>
                  {extractedMedia.author && (
                    <p className="text-[10px] text-brand-muted font-medium flex items-center gap-1">
                      <User className="w-3.5 h-3.5" /> {extractedMedia.author}
                    </p>
                  )}
                </div>

                <div className="space-y-3 pt-3 border-t border-brand-border">
                  <div className="grid grid-cols-2 gap-4">
                    
                    {/* Media Type option */}
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase text-brand-muted font-bold">Download Type</label>
                      <Select
                        value={downloadType}
                        onValueChange={(val) => setDownloadType(val as any)}
                      >
                        <SelectTrigger className="w-full h-9 border-brand-border bg-white text-brand-charcoal focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-charcoal/30 rounded-none font-semibold">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="VIDEO">Video (MP4)</SelectItem>
                          <SelectItem value="AUDIO">Audio Only (MP3)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Resolution option */}
                    {downloadType === 'VIDEO' && extractedMedia.formats.length > 0 && (
                      <div className="space-y-1">
                        <label className="text-[9px] uppercase text-brand-muted font-bold">Quality / Format</label>
                        <Select
                          value={selectedFormatId}
                          onValueChange={(val) => setSelectedFormatId(val || '')}
                        >
                          <SelectTrigger className="w-full h-9 border-brand-border bg-white text-brand-charcoal focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-charcoal/30 rounded-none">
                            <SelectValue placeholder="Best Merged Quality (Default)" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">Best Merged Quality (Default)</SelectItem>
                            {extractedMedia.formats
                              .filter((f: any) => f.hasVideo)
                              .map((f: any) => (
                                <SelectItem key={f.formatId} value={f.formatId}>
                                  {f.resolution} ({f.ext.toUpperCase()}) - {formatBytes(f.filesize)}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <Button
                      onClick={handleDownload}
                      disabled={isDownloading}
                      className="h-10 px-6 rounded-none bg-brand-charcoal text-white hover:bg-brand-charcoal/90 font-bold uppercase tracking-tight text-[10px] flex items-center justify-center gap-1.5"
                    >
                      <Download className="w-4 h-4" /> Download File
                    </Button>
                    <Button
                      onClick={() => setExtractedMedia(null)}
                      variant="outline"
                      className="h-10 px-4 rounded-none border-brand-border hover:border-brand-charcoal/30 font-bold uppercase tracking-tight text-[10px]"
                    >
                      Clear
                    </Button>
                  </div>
                </div>

              </div>

            </div>
          </Card>
        )}

        {/* Fallback Manual Force Download Form */}
        {extractionError && (
          <Card className="border-brand-border bg-white rounded-none p-6 shadow-none animate-fadeIn space-y-4">
            <div className="flex items-start gap-3 text-[#b3261e]">
              <Info className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-xs uppercase tracking-wide">Platform Rate Limit Detected</p>
                <p className="text-[10px] text-brand-muted mt-1 leading-relaxed font-mono">
                  The social platform is blocking metadata extraction (too many requests or login required). 
                  You can still attempt to force-download the media blindly by entering a filename below.
                </p>
              </div>
            </div>

            <div className="space-y-4 pt-2 border-t border-brand-border">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] uppercase text-brand-muted font-bold">Custom Title / Filename</label>
                  <Input
                    type="text"
                    required
                    placeholder="e.g. TikTok Dance Video, Podcast Episode"
                    value={fallbackTitle}
                    onChange={(e) => setFallbackTitle(e.target.value)}
                    className="w-full h-9 border-brand-border bg-white text-brand-charcoal focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-charcoal/30 font-mono text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] uppercase text-brand-muted font-bold">Download Type</label>
                  <Select
                    value={downloadType}
                    onValueChange={(val) => setDownloadType(val as any)}
                  >
                    <SelectTrigger className="w-full h-9 border-brand-border bg-white text-brand-charcoal focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-charcoal/30 rounded-none font-semibold font-mono">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="VIDEO">Video (MP4)</SelectItem>
                      <SelectItem value="AUDIO">Audio Only (MP3)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <Button
                  onClick={handleFallbackDownload}
                  disabled={!fallbackTitle || isDownloading}
                  className="h-10 px-6 rounded-none bg-brand-charcoal text-white hover:bg-brand-charcoal/90 font-bold uppercase tracking-tight text-[10px] flex items-center justify-center gap-1.5"
                >
                  <Download className="w-4 h-4" /> Force Download Best Quality
                </Button>
                <Button
                  onClick={() => {
                    setExtractionError(false);
                    setExtractingUrl('');
                    setFallbackTitle('');
                  }}
                  variant="outline"
                  className="h-10 px-4 rounded-none border-brand-border hover:border-brand-charcoal/30 font-bold uppercase tracking-tight text-[10px]"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* History Split Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Sidebar Collections (3 cols) */}
          <div className="lg:col-span-3 space-y-6">
            <Card className="border-brand-border bg-white rounded-none p-5 shadow-none space-y-4">
              <div className="flex items-center justify-between border-b border-brand-border pb-2">
                <span className="text-[10px] font-bold text-brand-muted uppercase tracking-wider">
                  Collections
                </span>
                <Button
                  onClick={() => setIsCollectionModalOpen(true)}
                  variant="ghost"
                  size="xs"
                  className="text-[9px] font-bold text-brand-charcoal hover:underline uppercase"
                >
                  + New
                </Button>
              </div>

              <div className="space-y-1.5 font-mono text-[11px] text-brand-muted">
                <div
                  onClick={() => setSelectedCollectionId('')}
                  className={`px-2.5 py-1.5 cursor-pointer flex items-center gap-2 ${
                    !selectedCollectionId
                      ? 'bg-brand-charcoal text-white font-semibold'
                      : 'hover:bg-brand-charcoal/5 text-brand-charcoal'
                  }`}
                >
                  <Bookmark className="w-3.5 h-3.5" /> All Downloads
                </div>

                {collections.map((col: any) => (
                  <div
                    key={col.id}
                    className={`px-2.5 py-1.5 cursor-pointer flex items-center justify-between group transition-colors ${
                      selectedCollectionId === col.id
                        ? 'bg-brand-charcoal text-white font-semibold'
                        : 'hover:bg-brand-charcoal/5 text-brand-charcoal'
                    }`}
                  >
                    <span
                      onClick={() => setSelectedCollectionId(col.id)}
                      className="flex-1 truncate flex items-center gap-2"
                    >
                      <Bookmark className="w-3.5 h-3.5" /> {col.name}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveCollection(col.id);
                      }}
                      className={`opacity-0 group-hover:opacity-100 hover:text-brand-red-text shrink-0 ml-2 ${
                        selectedCollectionId === col.id ? 'text-white/60' : 'text-brand-muted'
                      }`}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}

                <div
                  onClick={() => setSelectedCollectionId('none')}
                  className={`px-2.5 py-1.5 cursor-pointer flex items-center gap-2 ${
                    selectedCollectionId === 'none'
                      ? 'bg-brand-charcoal text-white font-semibold'
                      : 'hover:bg-brand-charcoal/5 text-brand-charcoal'
                  }`}
                >
                  <Bookmark className="w-3.5 h-3.5" /> Uncategorized
                </div>
              </div>
            </Card>

            {/* Quick Filters */}
            <Card className="border-brand-border bg-white rounded-none p-5 shadow-none space-y-4">
              <span className="text-[10px] font-bold text-brand-muted uppercase tracking-wider block border-b border-brand-border pb-2">
                Platform Filters
              </span>
              <div className="space-y-2">
                <Select
                  value={selectedPlatform}
                  onValueChange={(val) => setSelectedPlatform(val || '')}
                >
                  <SelectTrigger className="w-full h-8 border-brand-border bg-white text-brand-charcoal focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-charcoal/30 rounded-none">
                    <SelectValue placeholder="All Platforms" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Platforms</SelectItem>
                    <SelectItem value="YouTube">YouTube</SelectItem>
                    <SelectItem value="TikTok">TikTok</SelectItem>
                    <SelectItem value="Instagram">Instagram</SelectItem>
                    <SelectItem value="Threads">Threads</SelectItem>
                    <SelectItem value="Facebook">Facebook</SelectItem>
                    <SelectItem value="Twitter">Twitter / X</SelectItem>
                    <SelectItem value="Reddit">Reddit</SelectItem>
                  </SelectContent>
                </Select>

                <div className="flex items-center gap-2 py-1 font-semibold text-[10px] uppercase text-brand-charcoal">
                  <Checkbox
                    id="showOnlyFavorites"
                    checked={showOnlyFavorites}
                    onCheckedChange={(checked) => setShowOnlyFavorites(checked === true)}
                  />
                  <label htmlFor="showOnlyFavorites" className="cursor-pointer select-none">
                    Show Favorites
                  </label>
                </div>
              </div>
            </Card>
          </div>

          {/* Main download history list (9 cols) */}
          <div className="lg:col-span-9 space-y-4">
            
            {/* Search filter row */}
            <div className="flex items-center border border-brand-border bg-white p-2">
              <MagnifyingGlass className="w-4 h-4 text-brand-muted ml-2" />
              <Input
                type="text"
                placeholder="Search download history..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-8 border-none bg-transparent text-xs text-brand-charcoal focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-none font-mono"
              />
            </div>

            {/* History Items list */}
            {historyItems.length === 0 ? (
              <div className="py-20 text-center border border-dashed border-brand-border text-brand-muted font-mono bg-white">
                No download records match the current filters
              </div>
            ) : (
              <div className="border border-brand-border divide-y divide-brand-border bg-white">
                {historyItems.map((item: any) => (
                  <div
                    key={item.id}
                    className="p-4 hover:bg-brand-charcoal/2 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center flex-wrap gap-2">
                        <Badge variant="outline" className={`${getPlatformColor(item.platform)} text-[8px] uppercase font-mono py-0`}>
                          {item.platform}
                        </Badge>
                        <Badge variant="outline" className="text-[8px] font-mono py-0 flex items-center gap-0.5 border-brand-border bg-brand-canvas">
                          {item.mediaType === 'AUDIO' ? <MusicNotes className="w-2.5 h-2.5" /> : <Video className="w-2.5 h-2.5" />}
                          {item.mediaType}
                        </Badge>
                        {item.resolution && (
                          <span className="text-[9px] font-mono text-brand-muted px-1 border border-brand-border">
                            {item.resolution}
                          </span>
                        )}
                        {item.fileSize && (
                          <span className="text-[9px] font-mono text-brand-muted">
                            {formatBytes(item.fileSize)}
                          </span>
                        )}
                      </div>

                      <h4 className="font-serif text-sm font-semibold text-brand-charcoal truncate max-w-xl">
                        {item.title}
                      </h4>

                      <div className="flex items-center flex-wrap gap-3 text-[10px] text-brand-muted">
                        {item.author && <span>by {item.author}</span>}
                        <span>·</span>
                        <span className="flex items-center gap-0.5">
                          <CalendarBlank className="w-3.5 h-3.5" />
                          {new Date(item.createdAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                        {item.collection && (
                          <>
                            <span>·</span>
                            <span className="text-brand-charcoal font-semibold bg-[#F1F1EF] px-1.5 py-0.5 uppercase text-[8px]">
                              {item.collection.name}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      
                      {/* Collection Selector */}
                      <Select
                        value={item.collectionId || ''}
                        onValueChange={(val) => handleAssignCollection(item.id, val || null)}
                      >
                        <SelectTrigger className="h-8 border-brand-border bg-white text-[9px] font-bold uppercase focus-visible:outline-none rounded-none w-24">
                          <SelectValue placeholder="Move to..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Move to...</SelectItem>
                          {collections.map((col: any) => (
                            <SelectItem key={col.id} value={col.id}>
                              {col.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Tooltip>
                        <TooltipTrigger asChild>
  <Button
                            onClick={() => handleToggleFavorite(item)}
                            variant="ghost"
                            size="icon-xs"
                            className={`size-8 hover:bg-[#fff0f2] ${
                              item.isFavorite ? 'text-[#b3261e]' : 'text-brand-muted'
                            }`}
                          >
                            <Heart className="w-4 h-4" weight={item.isFavorite ? 'fill' : 'regular'} />
                          </Button>
</TooltipTrigger>
                        <TooltipContent>Favorite</TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
  <Button
                            onClick={() => handleRedownload(item)}
                            variant="ghost"
                            size="icon-xs"
                            className="size-8 hover:bg-[#edf7ed] text-[#1e4620]"
                          >
                            <Download className="w-4 h-4" />
                          </Button>
</TooltipTrigger>
                        <TooltipContent>Re-fetch</TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
  <Button
                            onClick={() => handleRemoveHistoryItem(item.id)}
                            variant="ghost"
                            size="icon-xs"
                            className="size-8 hover:bg-brand-red-bg hover:text-brand-red-text"
                          >
                            <Trash className="w-4 h-4" />
                          </Button>
</TooltipTrigger>
                        <TooltipContent>Delete record</TooltipContent>
                      </Tooltip>
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* New Collection Modal Dialog */}
      <Dialog open={isCollectionModalOpen} onOpenChange={setIsCollectionModalOpen}>
        <DialogContent className="sm:max-w-md bg-white border border-brand-border rounded-none p-6 font-mono text-xs">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg font-medium text-brand-charcoal">
              New Collection
            </DialogTitle>
            <DialogDescription className="text-xs font-mono text-brand-muted mt-1">
              Create a group to organize downloaded links and media.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateCollection} className="space-y-4 pt-4">
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase text-brand-muted">Collection Name</label>
              <Input
                type="text"
                required
                placeholder="e.g. Comedy Reels, Code Lectures"
                value={newCollectionName}
                onChange={(e) => setNewCollectionName(e.target.value)}
                className="w-full h-9 border-brand-border bg-white text-brand-charcoal focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-charcoal/30 font-mono"
              />
            </div>

            <DialogFooter className="pt-4 border-t border-brand-border gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCollectionModalOpen(false)}
                className="h-9 px-4 rounded-none font-semibold text-[10px] uppercase tracking-tight"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="h-9 px-4 rounded-none bg-brand-charcoal text-white hover:bg-brand-charcoal/90 font-semibold text-[10px] uppercase tracking-tight"
              >
                Create Group
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
