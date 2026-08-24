"use client"

import React from "react"

interface RedditPreviewBoxProps {
  bookmark: any
  hostname: string
}

export function RedditPreviewBox({ bookmark }: RedditPreviewBoxProps) {
  const metadata = bookmark.metadata?.reddit || {}

  function extractSubreddit(url: string): string {
    try {
      const match = new URL(url).pathname.match(/\/r\/([^/]+)/i)
      const sub = match?.[1]
      return sub || "reddit"
    } catch {
      return "reddit"
    }
  }

  const rawSubreddit = metadata.subreddit?.name || extractSubreddit(bookmark.url)
  const subredditClean = rawSubreddit.replace(/^r\//i, "")
  const displaySubreddit = `r/${subredditClean}`

  // Clean post title: remove suffix like " : r/indotech" or " : indotech" if present
  let rawTitle = metadata.post?.title || bookmark.title || "Reddit Post"
  const cleanTitle = rawTitle
    .replace(new RegExp(`\\s*:\\s*(r\\/)?${subredditClean}$`, "i"), "")
    .trim()

  const isGenericDescription = (desc?: string) => {
    if (!desc) return true
    const lower = desc.toLowerCase().trim()
    if (lower.startsWith("r/") && !lower.includes(" ")) return true
    if (
      lower.startsWith("posted by u/") &&
      lower.endsWith("reddit") &&
      lower.length < 50
    ) {
      return true
    }
    return false
  }

  // Clean description / selftext
  let rawSelftext =
    bookmark.description && !isGenericDescription(bookmark.description)
      ? bookmark.description
      : metadata.post?.selftext || ""

  return (
    <div className="relative flex min-h-[140px] w-full flex-col justify-between overflow-hidden border-b border-brand-border bg-white p-4 text-neutral-900 select-none sm:p-5">
      <div>
        {/* Header: Reddit Orange Logo + r/subreddit */}
        <div className="flex items-center gap-2">
          <div className="flex size-5.5 shrink-0 items-center justify-center rounded-full bg-[#FF4500] shadow-2xs">
            <svg
              className="size-3.5 fill-white"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.196-.491.956 0 1.733.777 1.733 1.733 0 .658-.363 1.226-.897 1.52.01.144.017.29.017.435 0 3.057-3.55 5.534-7.931 5.534-4.382 0-7.932-2.477-7.932-5.534 0-.14.006-.28.016-.423C3.655 14.85 3.3 14.288 3.3 13.636c0-.956.777-1.733 1.733-1.733.468 0 .89.183 1.198.494 1.192-.857 2.846-1.418 4.668-1.489l.915-4.29 3.197.674a1.25 1.25 0 0 1 1.25-.993zm-8.878 7.37a1.25 1.25 0 1 0 0 2.5 1.25 1.25 0 0 0 0-2.5zm6.368 0a1.25 1.25 0 1 0 0 2.5 1.25 1.25 0 0 0 0-2.5zm-5.067 3.99a.53.53 0 0 0-.084.743A5.452 5.452 0 0 0 12 17.8c1.558 0 2.91-.703 3.653-1.953a.53.53 0 0 0-.898-.564c-.58.972-1.637 1.517-2.755 1.517-1.118 0-2.175-.545-2.755-1.517a.53.53 0 0 0-.743-.083z" />
            </svg>
          </div>
          <span className="truncate text-[13px] font-semibold tracking-tight text-neutral-800">
            {displaySubreddit}
          </span>
        </div>

        {/* Post Title */}
        <h3 className="mt-3 line-clamp-3 text-[15px] leading-snug font-bold tracking-tight text-neutral-900 sm:text-base">
          {cleanTitle}
        </h3>

        {/* Post Body Snippet / Selftext with bottom fade */}
        {rawSelftext ? (
          <div className="relative mt-2 max-h-24 overflow-hidden">
            <p className="line-clamp-4 text-xs leading-relaxed font-normal text-neutral-600 sm:text-[13px]">
              {rawSelftext}
            </p>
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-white to-transparent" />
          </div>
        ) : null}
      </div>
    </div>
  )
}
