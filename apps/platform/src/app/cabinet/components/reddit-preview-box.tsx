"use client"

import React, { useState, useMemo } from "react"
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
  const [imageError, setImageError] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)

  // 1. Extract Post ID & Subreddit from URL or metadata
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
      return match?.[1] ? `r/${match[1]}` : "r/reddit"
    } catch {
      return "r/reddit"
    }
  }, [bookmark.url])

  // 2. Candidate dynamic card image (Reddit generates dynamic cards at share.redd.it/preview/post/:id)
  const rawImageUrl =
    bookmark.imageUrl ||
    (postId ? `https://share.redd.it/preview/post/${postId}` : null)

  const proxiedImageUrl = useMemo(
    () => getProxiedImageUrl(rawImageUrl),
    [rawImageUrl]
  )

  // 3. Clean title (strip out generic Reddit wrappers)
  const cleanTitle = useMemo(() => {
    let t = bookmark.title || "Reddit Post"
    return t
      .replace(/\s*:\s*r\/[a-zA-Z0-9_-]+$/i, "")
      .replace(/^From the .* community on Reddit:?\s*/i, "")
      .replace(/^Dari komunitas .* di Reddit:?\s*/i, "")
      .trim() || "Reddit Post"
  }, [bookmark.title])

  // 4. Clean description / snippet
  const cleanDescription = useMemo(() => {
    if (
      bookmark.description &&
      !bookmark.description.includes("Explore this post") &&
      !bookmark.description.includes("Jelajahi postingan ini")
    ) {
      return bookmark.description
    }
    return `Explore discussions, comments, and media from the ${subreddit} community on Reddit.`
  }, [bookmark.description, subreddit])

  return (
    <div className="w-full overflow-hidden bg-white select-none dark:bg-zinc-900">
      {/* WhatsApp Style Top Dynamic Image Banner */}
      <div className="relative w-full aspect-[1.91/1] overflow-hidden bg-[#1a1a1b] flex items-center justify-center">
        {!imageError && proxiedImageUrl ? (
          <>
            {!imageLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-zinc-800 animate-pulse">
                <div className="flex items-center gap-2 text-xs text-zinc-400 font-mono">
                  <div className="size-3.5 rounded-full bg-[#FF4500] animate-bounce" />
                  <span>Loading Reddit Card...</span>
                </div>
              </div>
            )}
            <img
              src={proxiedImageUrl}
              alt={cleanTitle}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
              className={cn(
                "w-full h-full object-cover transition-opacity duration-300",
                imageLoaded ? "opacity-100" : "opacity-0"
              )}
            />
          </>
        ) : (
          /* Fallback visual if image fails to load */
          <div className="flex h-full w-full flex-col justify-between p-4 bg-gradient-to-br from-[#1a1a1b] via-[#242426] to-[#0e0e0f] text-white">
            <div className="flex items-center gap-2">
              <div className="flex size-5.5 shrink-0 items-center justify-center rounded-full bg-[#FF4500]">
                <svg
                  className="size-3.5 fill-white"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.196-.491.956 0 1.733.777 1.733 1.733 0 .658-.363 1.226-.897 1.52.01.144.017.29.017.435 0 3.057-3.55 5.534-7.931 5.534-4.382 0-7.932-2.477-7.932-5.534 0-.14.006-.28.016-.423C3.655 14.85 3.3 14.288 3.3 13.636c0-.956.777-1.733 1.733-1.733.468 0 .89.183 1.198.494 1.192-.857 2.846-1.418 4.668-1.489l.915-4.29 3.197.674a1.25 1.25 0 0 1 1.25-.993zm-8.878 7.37a1.25 1.25 0 1 0 0 2.5 1.25 1.25 0 0 0 0-2.5zm6.368 0a1.25 1.25 0 1 0 0 2.5 1.25 1.25 0 0 0 0-2.5zm-5.067 3.99a.53.53 0 0 0-.084.743A5.452 5.452 0 0 0 12 17.8c1.558 0 2.91-.703 3.653-1.953a.53.53 0 0 0-.898-.564c-.58.972-1.637 1.517-2.755 1.517-1.118 0-2.175-.545-2.755-1.517a.53.53 0 0 0-.743-.083z" />
                </svg>
              </div>
              <span className="font-semibold text-xs text-white/90">{subreddit}</span>
            </div>
            <h4 className="line-clamp-2 text-sm font-bold text-white leading-snug">
              {cleanTitle}
            </h4>
            <span className="text-[10px] text-zinc-400 font-mono">reddit.com</span>
          </div>
        )}
      </div>

      {/* WhatsApp Style Chat-Bubble Preview Metadata Box */}
      <div className="border-t border-brand-border bg-[#f0f2f5] p-3 text-left transition-colors dark:bg-[#1f2c34] dark:border-zinc-800">
        <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#54656f] dark:text-[#8696a0] uppercase tracking-wider">
          <div className="size-2 rounded-full bg-[#FF4500] shrink-0" />
          <span>reddit.com</span>
          <span>•</span>
          <span className="font-semibold lowercase text-[#00a884] dark:text-[#00a884]">{subreddit}</span>
        </div>

        <h3 className="mt-1 line-clamp-2 text-sm font-semibold leading-snug text-[#111b21] dark:text-[#e9edef]">
          {cleanTitle}
        </h3>

        {cleanDescription && (
          <p className="mt-0.5 line-clamp-2 text-[11px] leading-relaxed text-[#667781] dark:text-[#8696a0]">
            {cleanDescription}
          </p>
        )}
      </div>
    </div>
  )
}
