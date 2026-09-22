"use client"

import React, { useState, useMemo } from "react"
import { Clock, LinkSimple } from "@phosphor-icons/react"
import { cn } from "@atlas/ui/lib/utils"

interface RedditPreviewBoxProps {
  bookmark: any
  hostname?: string
}

function getProxiedImageUrl(imageUrl?: string | null): string {
  if (!imageUrl) return ""
  if (
    imageUrl.startsWith("/") ||
    imageUrl.startsWith("blob:") ||
    imageUrl.startsWith("data:")
  ) {
    return imageUrl
  }
  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"
  return `${apiBase}/v1/bookmarks/proxy-image?url=${encodeURIComponent(imageUrl)}`
}

export function RedditPreviewBox({ bookmark }: RedditPreviewBoxProps) {
  const [imageStatus, setImageStatus] = useState<"loading" | "loaded" | "error">("loading")

  // 1. Extract Post ID & Subreddit
  const postId = useMemo(() => {
    try {
      const match =
        bookmark.url?.match(/\/comments\/([a-zA-Z0-9]+)/i) ||
        bookmark.url?.match(/redd\.it\/([a-zA-Z0-9]+)/i)
      return match?.[1] || null
    } catch {
      return null
    }
  }, [bookmark.url])

  const subreddit = useMemo(() => {
    try {
      const match = bookmark.url?.match(/\/r\/([^/]+)/i)
      return match?.[1] || "reddit"
    } catch {
      return "reddit"
    }
  }, [bookmark.url])

  // 2. Candidate dynamic card image (share.redd.it/preview/post/:id or bookmark.imageUrl)
  const rawImageUrl = useMemo(() => {
    if (bookmark.imageUrl) return bookmark.imageUrl
    if (postId) return `https://share.redd.it/preview/post/${postId}`
    return null
  }, [bookmark.imageUrl, postId])

  const proxiedImageUrl = useMemo(
    () => getProxiedImageUrl(rawImageUrl),
    [rawImageUrl]
  )

  const cleanTitle = useMemo(() => {
    return (bookmark.title || "Reddit Post")
      .replace(/\s*:\s*r\/[a-zA-Z0-9_-]+$/i, "")
      .replace(/^From the .* community on Reddit:?\s*/i, "")
      .replace(/^Dari komunitas .* di Reddit:?\s*/i, "")
      .trim() || "Reddit Post"
  }, [bookmark.title])

  return (
    <div className="w-full overflow-hidden bg-[#025144] select-none text-left">
      {/* 1. The Reddit Dynamic Card Image (Just like WhatsApp) */}
      <div className="relative w-full bg-[#111b21] overflow-hidden flex items-center justify-center min-h-[160px]">
        {imageStatus === "loading" && (
          <div className="absolute inset-0 flex items-center justify-center bg-zinc-900 animate-pulse z-10">
            <div className="flex items-center gap-2 font-mono text-xs text-zinc-400">
              <Clock className="size-4 animate-spin text-[#FF4500]" />
              <span>Loading preview...</span>
            </div>
          </div>
        )}

        {proxiedImageUrl && imageStatus !== "error" ? (
          <img
            src={proxiedImageUrl}
            alt={cleanTitle}
            onLoad={() => setImageStatus("loaded")}
            onError={() => setImageStatus("error")}
            className={cn(
              "w-full h-auto max-h-[380px] object-cover transition-opacity duration-300",
              imageStatus === "loaded" ? "opacity-100" : "opacity-0"
            )}
          />
        ) : (
          /* Fallback visual banner if image fails */
          <div className="flex w-full min-h-[160px] flex-col justify-between p-5 bg-gradient-to-br from-[#1a1a1b] to-[#0e0e0f] text-white">
            <div className="flex items-center gap-2">
              <div className="flex size-6 items-center justify-center rounded-full bg-[#FF4500]">
                <span className="font-bold text-[10px] text-white">r/</span>
              </div>
              <span className="font-semibold text-xs text-white/90">r/{subreddit}</span>
            </div>
            <h3 className="line-clamp-2 text-sm font-bold text-white leading-snug">{cleanTitle}</h3>
            <span className="text-[10px] font-mono text-zinc-400">reddit.com</span>
          </div>
        )}
      </div>

      {/* 2. WhatsApp Dark-Green Link Preview Strip */}
      <div className="p-3 text-white bg-[#025144]">
        <h4 className="line-clamp-1 text-xs font-bold leading-snug text-white">
          From the {subreddit} community on Reddit
        </h4>
        <p className="mt-0.5 line-clamp-1 text-[11px] text-emerald-100/80">
          Explore this post and more from the {subreddit} community
        </p>

        <div className="mt-2.5 flex items-center justify-between border-t border-emerald-800/60 pt-2">
          <div className="flex items-center gap-1.5 font-mono text-[10px] text-emerald-200/90">
            <LinkSimple className="size-3" />
            <span>reddit.com</span>
          </div>

          <div className="flex size-4 items-center justify-center rounded-full bg-[#FF4500]">
            <svg
              className="size-2.5 fill-white"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.196-.491.956 0 1.733.777 1.733 1.733 0 .658-.363 1.226-.897 1.52.01.144.017.29.017.435 0 3.057-3.55 5.534-7.931 5.534-4.382 0-7.932-2.477-7.932-5.534 0-.14.006-.28.016-.423C3.655 14.85 3.3 14.288 3.3 13.636c0-.956.777-1.733 1.733-1.733.468 0 .89.183 1.198.494 1.192-.857 2.846-1.418 4.668-1.489l.915-4.29 3.197.674a1.25 1.25 0 0 1 1.25-.993zm-8.878 7.37a1.25 1.25 0 1 0 0 2.5 1.25 1.25 0 0 0 0-2.5zm6.368 0a1.25 1.25 0 1 0 0 2.5 1.25 1.25 0 0 0 0-2.5zm-5.067 3.99a.53.53 0 0 0-.084.743A5.452 5.452 0 0 0 12 17.8c1.558 0 2.91-.703 3.653-1.953a.53.53 0 0 0-.898-.564c-.58.972-1.637 1.517-2.755 1.517-1.118 0-2.175-.545-2.755-1.517a.53.53 0 0 0-.743-.083z" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  )
}
