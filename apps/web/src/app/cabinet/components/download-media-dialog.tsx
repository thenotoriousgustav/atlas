"use client"

import React, { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { cabinetMediaApi, type MediaInfo } from "@/lib/api-client"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { toast } from "@/components/ui/sonner"
import { DownloadSimple, Video, MusicNotes, X, Clock, User, ArrowSquareOut } from "@phosphor-icons/react"
import { cn } from "@/lib/utils"

interface DownloadMediaDialogProps {
  bookmark: any | null
  isOpen: boolean
  onClose: () => void
}

export function DownloadMediaDialog({ bookmark, isOpen, onClose }: DownloadMediaDialogProps) {
  const [mediaType, setMediaType] = useState<"VIDEO" | "AUDIO">("VIDEO")
  const [selectedFormatId, setSelectedFormatId] = useState("")
  const [isDownloading, setIsDownloading] = useState(false)
  const qualityId = React.useId()
  const url = bookmark?.url || ""
  const { data: mediaInfo, isLoading, isError, error } = useQuery<MediaInfo>({
    queryKey: ["cabinet-media-extract", url],
    queryFn: () => cabinetMediaApi.extract(url),
    enabled: isOpen && !!url,
    staleTime: 1000 * 60 * 30,
  })

  const videoFormats = React.useMemo(() => {
    const seen = new Set<string>()
    return (mediaInfo?.formats || []).filter((format) => {
      if (!format.hasVideo || seen.has(format.resolution)) return false
      seen.add(format.resolution)
      return true
    })
  }, [mediaInfo])
  const audioFormats = React.useMemo(() => (mediaInfo?.formats || []).filter((format) => format.hasAudio && !format.hasVideo), [mediaInfo])
  const activeFormats = mediaType === "VIDEO" ? videoFormats : audioFormats

  React.useEffect(() => {
    if (!activeFormats.some((format) => format.formatId === selectedFormatId)) setSelectedFormatId(activeFormats[0]?.formatId || "")
  }, [activeFormats, selectedFormatId])

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return ""
    return bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(0)} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }
  const handleDownload = async () => {
    if (!bookmark?.url || isDownloading) return
    setIsDownloading(true)
    const toastId = toast.loading(`Preparing ${mediaType.toLowerCase()} download…`)
    try {
      await cabinetMediaApi.download({ url: bookmark.url, formatId: selectedFormatId || undefined, mediaType, title: mediaInfo?.title || bookmark.title || "video" })
      toast.success("Download started!", { id: toastId })
      onClose()
    } catch (failure: any) {
      toast.error(failure?.message || "Failed to download media", { id: toastId })
    } finally { setIsDownloading(false) }
  }

  if (!bookmark) return null
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent showCloseButton={false} className="w-[calc(100%-2rem)] max-w-lg overflow-hidden p-0">
        <DialogHeader className="flex flex-row items-center justify-between gap-3 border-b border-border px-5 py-4 text-left">
          <div className="flex flex-col gap-1"><DialogTitle>Download Media</DialogTitle><DialogDescription>Choose a format and quality for this saved link.</DialogDescription></div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close media download"><X /></Button>
        </DialogHeader>
        <div className="flex max-h-[calc(85dvh-6rem)] flex-col gap-5 overflow-y-auto p-5">
          {isLoading ? <div role="status" className="flex min-h-36 flex-col items-center justify-center gap-3 text-sm text-muted-foreground"><Spinner /><p>Inspecting available formats…</p></div> : isError ? <Alert variant="destructive">
            <AlertTitle>Could not inspect this media</AlertTitle><AlertDescription>{(error as any)?.message || "Try opening the original website."}</AlertDescription>
            <Button asChild variant="outline" className="mt-3"><a href={bookmark.url} target="_blank" rel="noopener noreferrer"><ArrowSquareOut data-icon="inline-start" />Open in browser</a></Button>
          </Alert> : <>
            <div className="flex gap-3 rounded-lg border border-border bg-muted/30 p-3">
              {mediaInfo?.thumbnail && <img src={mediaInfo.thumbnail} alt="" className="h-20 w-28 shrink-0 rounded-sm object-cover" />}
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <div className="flex flex-wrap items-center gap-2"><Badge variant="secondary">{mediaInfo?.platform || "Video"}</Badge>
                  {mediaInfo?.duration != null && <span className="flex items-center gap-1 text-xs tabular-nums text-muted-foreground"><Clock className="size-3" />{Math.floor(mediaInfo.duration / 60)}:{String(mediaInfo.duration % 60).padStart(2, "0")}</span>}
                </div>
                <p className="line-clamp-2 text-sm font-medium">{mediaInfo?.title || bookmark.title}</p>
                {mediaInfo?.author && <p className="flex items-center gap-1 text-xs text-muted-foreground"><User className="size-3" />{mediaInfo.author}</p>}
              </div>
            </div>
            <div className="flex flex-col gap-2"><p className="text-sm font-medium">Format type</p>
              <ToggleGroup type="single" variant="outline" value={mediaType} aria-label="Format type" onValueChange={(value) => { if (value === "VIDEO" || value === "AUDIO") setMediaType(value) }}>
                <ToggleGroupItem value="VIDEO" className="min-h-11 gap-2"><Video />Video (MP4)</ToggleGroupItem><ToggleGroupItem value="AUDIO" className="min-h-11 gap-2"><MusicNotes />Audio Only (MP3)</ToggleGroupItem>
              </ToggleGroup>
            </div>
            {activeFormats.length > 0 ? <fieldset className="flex min-w-0 flex-col gap-1"><legend className="mb-2 text-sm font-medium">Select quality</legend>
              <div className="flex max-h-48 flex-col gap-1 overflow-y-auto rounded-lg border border-border p-1">
                {activeFormats.map((format) => <label key={format.formatId} className={cn("flex min-h-11 cursor-pointer items-center justify-between gap-3 rounded-md px-3 py-2 text-sm has-focus-visible:outline-2 has-focus-visible:outline-ring", selectedFormatId === format.formatId ? "bg-secondary" : "hover:bg-muted")}>
                  <span className="flex min-w-0 items-center gap-2"><input type="radio" name={qualityId} value={format.formatId} checked={selectedFormatId === format.formatId} onChange={() => setSelectedFormatId(format.formatId)} className="accent-primary" /><span>{format.resolution}</span>{format.note && <span className="truncate text-xs text-muted-foreground">({format.note})</span>}</span>
                  {format.filesize != null && <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{formatFileSize(format.filesize)}</span>}
                </label>)}
              </div>
            </fieldset> : <p className="text-sm text-muted-foreground">Default quality will be downloaded automatically.</p>}
            <div className="flex items-center justify-end gap-2 border-t border-border pt-4"><Button variant="outline" onClick={onClose}>Cancel</Button><Button disabled={isDownloading} onClick={handleDownload}>{isDownloading ? <Spinner /> : <DownloadSimple data-icon="inline-start" />}{isDownloading ? "Downloading…" : `Download ${mediaType === "AUDIO" ? "MP3" : "MP4"}`}</Button></div>
          </>}
        </div>
      </DialogContent>
    </Dialog>
  )
}
