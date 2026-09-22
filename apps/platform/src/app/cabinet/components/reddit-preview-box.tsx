"use client"

import React, { useEffect, useRef, useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { cn } from "@atlas/ui/lib/utils"

interface RedditPreviewBoxProps {
  bookmark: any
  hostname?: string
}

export function RedditPreviewBox({ bookmark }: RedditPreviewBoxProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  // 1. Check if embedHtml is already stored in bookmark.metadata
  const storedEmbedHtml = bookmark.metadata?.embedHtml

  // 2. Fallback: fetch oEmbed on-the-fly if not yet cached in DB
  const { data: oembedData } = useQuery({
    queryKey: ["reddit-oembed", bookmark?.url],
    queryFn: async () => {
      try {
        const oembedUrl = `https://www.reddit.com/oembed?url=${encodeURIComponent(
          bookmark.url
        )}`
        const res = await fetch(oembedUrl, { signal: AbortSignal.timeout(5000) })
        if (res.ok) {
          return await res.json()
        }
      } catch {}
      return null
    },
    enabled: !storedEmbedHtml && !!bookmark?.url,
    staleTime: 1000 * 60 * 60, // 1 hour
  })

  const rawHtml = storedEmbedHtml || oembedData?.html

  // 3. Extract subreddit & title
  const subreddit = useMemo(() => {
    try {
      const match = bookmark.url?.match(/\/r\/([^/]+)/i)
      return match?.[1] ? `r/${match[1]}` : "r/reddit"
    } catch {
      return "r/reddit"
    }
  }, [bookmark.url])

  const cleanTitle = useMemo(() => {
    return (
      oembedData?.title ||
      bookmark.title ||
      "Reddit Post"
    )
      .replace(/\s*:\s*r\/[a-zA-Z0-9_-]+$/i, "")
      .replace(/^From the .* community on Reddit:?\s*/i, "")
      .replace(/^Dari komunitas .* di Reddit:?\s*/i, "")
      .trim()
  }, [oembedData?.title, bookmark.title])

  const authorName = oembedData?.author_name || bookmark.metadata?.reddit?.author?.username

  // 4. Strip <script> tag from HTML for safe React innerHTML injection
  const sanitizedHtml = useMemo(() => {
    if (!rawHtml) return ""
    return rawHtml.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
  }, [rawHtml])

  // 5. Load official Reddit widgets.js and trigger embed initialization
  useEffect(() => {
    if (!sanitizedHtml) return

    const scriptId = "reddit-embed-script"
    let script = document.getElementById(scriptId) as HTMLScriptElement

    const triggerInit = () => {
      if ((window as any).rembeddit?.init) {
        try {
          ;(window as any).rembeddit.init()
        } catch {}
      }
    }

    if (!script) {
      script = document.createElement("script")
      script.id = scriptId
      script.src = "https://embed.reddit.com/widgets.js"
      script.async = true
      script.charset = "UTF-8"
      script.onload = () => {
        triggerInit()
      }
      document.body.appendChild(script)
    } else {
      // Re-trigger scan for new blockquotes in DOM
      triggerInit()
    }
  }, [sanitizedHtml, bookmark.id])

  if (sanitizedHtml) {
    return (
      <div className="reddit-embed-container w-full overflow-hidden bg-white p-2 sm:p-3 dark:bg-zinc-900">
        <style dangerouslySetInnerHTML={{ __html: `
          .reddit-embed-container blockquote.reddit-embed-bq {
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 14px 16px;
            margin: 0;
            background: #ffffff;
            font-family: inherit;
            color: #111b21;
          }
          .reddit-embed-container blockquote.reddit-embed-bq a {
            color: #ff4500;
            font-weight: 600;
            text-decoration: none;
          }
          .reddit-embed-container blockquote.reddit-embed-bq a:hover {
            text-decoration: underline;
          }
          .reddit-embed-container iframe {
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 auto !important;
          }
        `}} />
        <div
          ref={containerRef}
          dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
          className="w-full"
        />
      </div>
    )
  }

  // Fallback card while oEmbed loads
  return (
    <div className="w-full overflow-hidden border border-brand-border bg-white p-4 text-left select-none dark:bg-zinc-900">
      <div className="flex items-center gap-2 text-xs font-semibold text-brand-charcoal">
        <div className="flex size-5 shrink-0 items-center justify-center rounded-full bg-[#FF4500] text-white">
          <span className="text-[9px] font-bold">r/</span>
        </div>
        <span className="font-mono text-[11px] text-[#ff4500]">{subreddit}</span>
        {authorName && (
          <span className="text-[10px] text-brand-muted font-normal">• u/{authorName}</span>
        )}
      </div>
      <h3 className="mt-2 text-sm font-bold leading-snug text-brand-charcoal line-clamp-3">
        {cleanTitle}
      </h3>
    </div>
  )
}
