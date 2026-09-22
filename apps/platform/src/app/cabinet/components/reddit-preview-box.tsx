"use client"

import React, { useMemo } from "react"
import { ArrowUp, ChatCircle, LinkSimple } from "@phosphor-icons/react"
import { cn } from "@atlas/ui/lib/utils"

interface RedditPreviewBoxProps {
  bookmark: any
  hostname?: string
}

export function RedditPreviewBox({ bookmark }: RedditPreviewBoxProps) {
  // 1. Extract subreddit
  const subredditClean = useMemo(() => {
    try {
      const match = bookmark.url?.match(/\/r\/([^/]+)/i)
      return match?.[1] || "reddit"
    } catch {
      return "reddit"
    }
  }, [bookmark.url])

  const displaySubreddit = `r/${subredditClean}`

  // 2. Clean title
  const cleanTitle = useMemo(() => {
    let t = bookmark.title || "Reddit Post"
    return t
      .replace(/\s*:\s*r\/[a-zA-Z0-9_-]+$/i, "")
      .replace(/^From the .* community on Reddit:?\s*/i, "")
      .replace(/^Dari komunitas .* di Reddit:?\s*/i, "")
      .trim() || "Reddit Post"
  }, [bookmark.title])

  // 3. Post body snippet (text content)
  const bodyText = useMemo(() => {
    const raw =
      bookmark.notes ||
      bookmark.description ||
      bookmark.metadata?.reddit?.post?.selftext ||
      bookmark.metadata?.selftext ||
      ""

    if (
      raw &&
      !raw.toLowerCase().includes("explore this post") &&
      !raw.toLowerCase().includes("jelajahi postingan ini") &&
      !raw.toLowerCase().includes("from the ")
    ) {
      return raw.replace(/^Posted by u\/[^\s]+(?:\s+in\s+r\/[^\s]+)?\s*•?\s*/i, "").trim()
    }
    return ""
  }, [bookmark.notes, bookmark.description, bookmark.metadata])

  // 4. Author & Subtitle stats
  const authorName = useMemo(() => {
    return (
      bookmark.metadata?.reddit?.author?.username ||
      bookmark.metadata?.author ||
      (bookmark.description?.match(/Posted by u\/([^\s•]+)/i)?.[1]) ||
      null
    )
  }, [bookmark.metadata, bookmark.description])

  // 5. Upvotes & Comments stats
  const score = useMemo(() => {
    const raw =
      bookmark.metadata?.reddit?.stats?.score ??
      bookmark.metadata?.score ??
      null
    if (raw !== null && raw !== undefined) return raw
    return 2 // aesthetic fallback matching Reddit card
  }, [bookmark.metadata])

  const commentCount = useMemo(() => {
    const raw =
      bookmark.metadata?.reddit?.stats?.commentCount ??
      bookmark.metadata?.num_comments ??
      bookmark.metadata?.comments ??
      null
    if (raw !== null && raw !== undefined) return raw
    return 24 // aesthetic fallback matching Reddit card
  }, [bookmark.metadata])

  // Avatar initial or flag
  const isIndonesia = subredditClean.toLowerCase() === "indonesia"

  return (
    <div className="w-full select-none overflow-hidden rounded-xl border border-[#025144]/40 bg-[#025144] p-2 sm:p-2.5 text-left font-sans shadow-md">
      {/* 1. The Inner White Card (Exact Reddit WhatsApp Visual Card) */}
      <div className="flex flex-col justify-between rounded-lg bg-white p-4 shadow-sm sm:p-5 text-neutral-900">
        <div>
          {/* Header Row: Subreddit Icon + Name + Visitors + Orange Reddit Logo */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              {/* Subreddit Icon */}
              {isIndonesia ? (
                <div className="flex size-9 shrink-0 items-center justify-center rounded-full border border-neutral-200 bg-[#fff5ea] text-base shadow-2xs">
                  🇮🇩
                </div>
              ) : (
                <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-[#FF4500] to-[#FF8700] font-mono text-xs font-bold text-white shadow-2xs">
                  r/
                </div>
              )}

              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="truncate font-sans text-base font-bold tracking-tight text-neutral-900">
                    {displaySubreddit}
                  </span>
                </div>
                <p className="truncate text-xs font-normal text-neutral-500">
                  {authorName ? `u/${authorName}` : "191K weekly visitors"}
                </p>
              </div>
            </div>

            {/* Top-Right Reddit Orange Snoo Logo */}
            <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#FF4500] shadow-xs">
              <svg
                className="size-4 fill-white"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.196-.491.956 0 1.733.777 1.733 1.733 0 .658-.363 1.226-.897 1.52.01.144.017.29.017.435 0 3.057-3.55 5.534-7.931 5.534-4.382 0-7.932-2.477-7.932-5.534 0-.14.006-.28.016-.423C3.655 14.85 3.3 14.288 3.3 13.636c0-.956.777-1.733 1.733-1.733.468 0 .89.183 1.198.494 1.192-.857 2.846-1.418 4.668-1.489l.915-4.29 3.197.674a1.25 1.25 0 0 1 1.25-.993zm-8.878 7.37a1.25 1.25 0 1 0 0 2.5 1.25 1.25 0 0 0 0-2.5zm6.368 0a1.25 1.25 0 1 0 0 2.5 1.25 1.25 0 0 0 0-2.5zm-5.067 3.99a.53.53 0 0 0-.084.743A5.452 5.452 0 0 0 12 17.8c1.558 0 2.91-.703 3.653-1.953a.53.53 0 0 0-.898-.564c-.58.972-1.637 1.517-2.755 1.517-1.118 0-2.175-.545-2.755-1.517a.53.53 0 0 0-.743-.083z" />
              </svg>
            </div>
          </div>

          {/* Post Title */}
          <h2 className="mt-4 line-clamp-3 text-lg font-extrabold leading-snug tracking-tight text-neutral-900 sm:text-xl">
            {cleanTitle}
          </h2>

          {/* Post Body Snippet */}
          {bodyText ? (
            <p className="mt-2.5 line-clamp-4 whitespace-pre-line text-xs leading-relaxed text-neutral-600 sm:text-sm">
              {bodyText}
            </p>
          ) : (
            <p className="mt-2 line-clamp-2 text-xs italic text-neutral-400">
              Explore discussion and comments from the community...
            </p>
          )}
        </div>

        {/* Upvotes & Comments Stats Bar */}
        <div className="mt-5 flex items-center gap-4 text-xs font-semibold text-neutral-700">
          <div className="flex items-center gap-1.5">
            <ArrowUp className="size-4 stroke-[2.5] text-neutral-800" />
            <span className="font-bold">{typeof score === "number" ? score.toLocaleString() : score}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <ChatCircle className="size-4 stroke-[2.5] text-neutral-800" />
            <span>
              {typeof commentCount === "number" ? commentCount.toLocaleString() : commentCount} comments
            </span>
          </div>
        </div>
      </div>

      {/* 2. WhatsApp Bottom Link Metadata Bar (The Dark Green Chat Strip) */}
      <div className="px-2 pt-2.5 pb-1 text-white">
        <h4 className="line-clamp-1 text-xs font-bold leading-snug text-white">
          From the {subredditClean} community on Reddit
        </h4>
        <p className="mt-0.5 line-clamp-1 text-[11px] text-emerald-100/80">
          Explore this post and more from the {subredditClean} community
        </p>

        <div className="mt-2 flex items-center justify-between border-t border-emerald-800/60 pt-1.5">
          <div className="flex items-center gap-1 font-mono text-[10px] text-emerald-200/90">
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
