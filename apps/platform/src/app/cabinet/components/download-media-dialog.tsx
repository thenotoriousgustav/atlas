"use client"

import React, { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import {
  cabinetMediaApi,
  MediaInfo,
  MediaFormat,
} from "@atlas/api-client"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@atlas/ui/components/dialog"
import { Button } from "@atlas/ui/components/button"
import { Badge } from "@atlas/ui/components/badge"
import { Spinner } from "@atlas/ui/components/spinner"
import { toast } from "@atlas/ui/components/sonner"
import {
  DownloadSimple,
  Video,
  MusicNotes,
  X,
  Clock,
  User,
  ArrowSquareOut,
} from "@phosphor-icons/react"
import { cn } from "@atlas/ui/lib/utils"

interface DownloadMediaDialogProps {
  bookmark: any | null
  isOpen: boolean
  onClose: () => void
}

export function DownloadMediaDialog({
  bookmark,
  isOpen,
  onClose,
}: DownloadMediaDialogProps) {
  const [mediaType, setMediaType] = useState<"VIDEO" | "AUDIO">("VIDEO")
  const [selectedFormatId, setSelectedFormatId] = useState<string>("")
  const [isDownloading, setIsDownloading] = useState(false)

  const url = bookmark?.url || ""

  const {
    data: mediaInfo,
    isLoading,
    isError,
    error,
  } = useQuery<MediaInfo>({
    queryKey: ["cabinet-media-extract", url],
    queryFn: () => cabinetMediaApi.extract(url),
    enabled: isOpen && !!url,
    staleTime: 1000 * 60 * 30, // 30 mins
  })

  // Format size helper
  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return ""
    const mb = bytes / (1024 * 1024)
    if (mb < 1) return `${(bytes / 1024).toFixed(0)} KB`
    return `${mb.toFixed(1)} MB`
  }

  // Filter video vs audio formats
  const videoFormats = React.useMemo(() => {
    if (!mediaInfo?.formats) return []
    // Group unique resolutions
    const seen = new Set<string>()
    return mediaInfo.formats
      .filter((f) => f.hasVideo)
      .filter((f) => {
        const key = f.resolution
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })
  }, [mediaInfo])

  const audioFormats = React.useMemo(() => {
    if (!mediaInfo?.formats) return []
    return mediaInfo.formats.filter((f) => f.hasAudio && !f.hasVideo)
  }, [mediaInfo])

  const activeFormats = mediaType === "VIDEO" ? videoFormats : audioFormats

  // Set default format once loaded
  React.useEffect(() => {
    if (activeFormats.length > 0 && !selectedFormatId && activeFormats[0]) {
      setSelectedFormatId(activeFormats[0].formatId)
    }
  }, [activeFormats, selectedFormatId])

  const handleDownload = async () => {
    if (!bookmark?.url) return
    setIsDownloading(true)
    const toastId = toast.loading(
      `Preparing ${mediaType.toLowerCase()} download with yt-dlp...`
    )

    try {
      await cabinetMediaApi.download({
        url: bookmark.url,
        formatId: selectedFormatId || undefined,
        mediaType,
        title: mediaInfo?.title || bookmark.title || "video",
      })
      toast.success("Download started!", { id: toastId })
      onClose()
    } catch (err: any) {
      toast.error(err?.message || "Failed to download media", { id: toastId })
    } finally {
      setIsDownloading(false)
    }
  }

  if (!bookmark) return null

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-full max-w-lg rounded-none border border-brand-border bg-white p-0 shadow-lg dark:bg-card">
        {/* Header */}
        <DialogHeader className="flex flex-row items-center justify-between border-b border-brand-border px-5 py-3.5 text-left">
          <div className="flex items-center gap-2">
            <DownloadSimple className="size-4 text-brand-charcoal" />
            <DialogTitle className="font-serif text-base font-semibold text-brand-charcoal">
              Download Media
            </DialogTitle>
          </div>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={onClose}
            className="size-7 rounded-none"
          >
            <X className="size-3.5" />
          </Button>
        </DialogHeader>

        {/* Content */}
        <div className="space-y-4 p-5">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-10 space-y-3">
              <Spinner className="size-6 text-brand-charcoal" />
              <p className="font-mono text-xs text-brand-muted">
                Inspecting stream formats with yt-dlp...
              </p>
            </div>
          ) : isError ? (
            <div className="space-y-3 border border-red-200 bg-red-50 p-4 text-center dark:border-red-900/40 dark:bg-red-950/20">
              <p className="text-xs font-medium text-red-800 dark:text-red-200">
                Failed to inspect media: {(error as any)?.message || "Unknown error"}
              </p>
              <div className="flex justify-center">
                <a
                  href={bookmark.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 border border-brand-border px-3 py-1 text-xs hover:bg-black/5"
                >
                  <ArrowSquareOut className="size-3.5" />
                  Open in browser
                </a>
              </div>
            </div>
          ) : (
            <>
              {/* Media Preview Banner */}
              <div className="flex gap-3.5 rounded-none border border-brand-border bg-brand-charcoal/5 p-3">
                {mediaInfo?.thumbnail && (
                  <img
                    src={mediaInfo.thumbnail}
                    alt=""
                    className="h-20 w-32 shrink-0 rounded-none object-cover border border-brand-border/60"
                  />
                )}
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-1.5">
                    <Badge
                      variant="outline"
                      className="rounded-none border-brand-border bg-white px-1.5 py-0 font-mono text-[9px] uppercase dark:bg-zinc-800"
                    >
                      {mediaInfo?.platform || "Video"}
                    </Badge>
                    {mediaInfo?.duration && (
                      <span className="flex items-center gap-0.5 text-[10px] text-brand-muted font-mono">
                        <Clock className="size-3" />
                        {Math.floor(mediaInfo.duration / 60)}:
                        {String(mediaInfo.duration % 60).padStart(2, "0")}
                      </span>
                    )}
                  </div>
                  <h4 className="line-clamp-2 text-xs font-semibold leading-snug text-brand-charcoal">
                    {mediaInfo?.title || bookmark.title}
                  </h4>
                  {mediaInfo?.author && (
                    <p className="flex items-center gap-1 text-[11px] text-brand-muted">
                      <User className="size-3" />
                      {mediaInfo.author}
                    </p>
                  )}
                </div>
              </div>

              {/* Type Switcher: Video vs Audio */}
              <div className="space-y-1.5">
                <label className="font-mono text-[10px] tracking-wider text-brand-muted uppercase">
                  Format Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setMediaType("VIDEO")
                      setSelectedFormatId(videoFormats[0]?.formatId || "")
                    }}
                    className={cn(
                      "flex items-center justify-center gap-2 border py-2 text-xs font-medium transition-all",
                      mediaType === "VIDEO"
                        ? "border-brand-charcoal bg-brand-charcoal text-white dark:bg-white dark:text-zinc-950"
                        : "border-brand-border hover:bg-brand-charcoal/5"
                    )}
                  >
                    <Video className="size-3.5" />
                    <span>Video (MP4)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMediaType("AUDIO")
                      setSelectedFormatId(audioFormats[0]?.formatId || "")
                    }}
                    className={cn(
                      "flex items-center justify-center gap-2 border py-2 text-xs font-medium transition-all",
                      mediaType === "AUDIO"
                        ? "border-brand-charcoal bg-brand-charcoal text-white dark:bg-white dark:text-zinc-950"
                        : "border-brand-border hover:bg-brand-charcoal/5"
                    )}
                  >
                    <MusicNotes className="size-3.5" />
                    <span>Audio Only (MP3)</span>
                  </button>
                </div>
              </div>

              {/* Resolution / Quality Selection */}
              {activeFormats.length > 0 ? (
                <div className="space-y-1.5">
                  <label className="font-mono text-[10px] tracking-wider text-brand-muted uppercase">
                    Select Quality
                  </label>
                  <div className="max-h-48 overflow-y-auto space-y-1 border border-brand-border p-1">
                    {activeFormats.map((f) => (
                      <div
                        key={f.formatId}
                        onClick={() => setSelectedFormatId(f.formatId)}
                        className={cn(
                          "flex cursor-pointer items-center justify-between px-3 py-1.5 text-xs transition-colors",
                          selectedFormatId === f.formatId
                            ? "bg-brand-charcoal/10 font-semibold text-brand-charcoal dark:bg-white/10 dark:text-white"
                            : "hover:bg-brand-charcoal/5"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-mono">{f.resolution}</span>
                          {f.note && (
                            <span className="text-[10px] text-brand-muted">
                              ({f.note})
                            </span>
                          )}
                        </div>
                        {f.filesize && (
                          <span className="font-mono text-[10px] text-brand-muted">
                            {formatFileSize(f.filesize)}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-brand-muted">
                  Default quality will be downloaded automatically.
                </p>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-brand-border">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onClose}
                  className="rounded-none text-xs"
                >
                  Cancel
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  disabled={isDownloading}
                  onClick={handleDownload}
                  className="gap-1.5 rounded-none text-xs font-semibold"
                >
                  {isDownloading ? (
                    <>
                      <Spinner className="size-3.5" />
                      Downloading...
                    </>
                  ) : (
                    <>
                      <DownloadSimple className="size-3.5" />
                      Download {mediaType === "AUDIO" ? "MP3" : "MP4"}
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
