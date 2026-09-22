"use client"

import React, { useState, useEffect, useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { Spinner } from "@atlas/ui/components/spinner"
import { ArrowSquareOut } from "@phosphor-icons/react"
import { cn } from "@atlas/ui/lib/utils"

interface RedditPreviewBoxProps {
  bookmark: any
  hostname?: string
}

export function RedditPreviewBox({ bookmark }: RedditPreviewBoxProps) {
  const [frameHeight, setFrameHeight] = useState<number>(340)
  const [isFrameLoading, setIsFrameLoading] = useState<boolean>(true)

  // 1. Extract subreddit
  const subreddit = useMemo(() => {
    try {
      const match = bookmark.url?.match(/\/r\/([^/]+)/i)
      return match?.[1] ? `r/${match[1]}` : "r/reddit"
    } catch {
      return "r/reddit"
    }
  }, [bookmark.url])

  // 2. Stored oEmbed HTML from backend
  const storedEmbedHtml = bookmark.metadata?.embedHtml

  // 3. Fallback on-the-fly fetch of Reddit oEmbed if not already cached in DB
  const { data: oembedData, isLoading: isOEmbedFetching } = useQuery({
    queryKey: ["reddit-oembed-html", bookmark?.url],
    queryFn: async () => {
      try {
        const oembedUrl = `https://www.reddit.com/oembed?url=${encodeURIComponent(
          bookmark.url
        )}`
        const res = await fetch(oembedUrl, { signal: AbortSignal.timeout(6000) })
        if (res.ok) {
          return await res.json()
        }
      } catch {}
      return null
    },
    enabled: !storedEmbedHtml && !!bookmark?.url,
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
  })

  const rawHtml = storedEmbedHtml || oembedData?.html

  // 4. Listen for dynamic resize messages from Reddit embed script
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      try {
        const data = typeof e.data === "string" ? JSON.parse(e.data) : e.data
        if (
          data?.type === "atlas-reddit-resize" &&
          data?.id === bookmark.id &&
          typeof data.height === "number" &&
          data.height > 60
        ) {
          setFrameHeight(data.height + 12)
          setIsFrameLoading(false)
        }
      } catch {}
    }

    window.addEventListener("message", handleMessage)
    return () => window.removeEventListener("message", handleMessage)
  }, [bookmark.id])

  // 5. Build self-contained HTML document for the iframe srcDoc
  const srcDoc = useMemo(() => {
    if (!rawHtml) return ""

    // Ensure the Reddit widgets.js or comment-embed.js script is included
    let htmlWithScript = rawHtml
    if (!htmlWithScript.includes("embed.reddit.com/widgets.js") && !htmlWithScript.includes("comment-embed.js")) {
      htmlWithScript += '<script async src="https://embed.reddit.com/widgets.js" charset="UTF-8"></script>'
    }

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    * { box-sizing: border-box; }
    html, body {
      margin: 0;
      padding: 0;
      background: #ffffff;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      overflow: hidden;
    }
    blockquote.reddit-embed-bq, .reddit-embed, .reddit-card {
      margin: 0 auto !important;
      max-width: 100% !important;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 12px 16px;
      background: #ffffff;
      color: #1a1a1b;
    }
    blockquote.reddit-embed-bq a, .reddit-embed a {
      color: #ff4500;
      text-decoration: none;
      font-weight: 600;
    }
    blockquote.reddit-embed-bq a:hover, .reddit-embed a:hover {
      text-decoration: underline;
    }
    iframe {
      width: 100% !important;
      max-width: 100% !important;
      margin: 0 auto !important;
      display: block !important;
    }
  </style>
</head>
<body>
  ${htmlWithScript}
  <script>
    window.addEventListener("message", function(e) {
      try {
        var d = typeof e.data === "string" ? JSON.parse(e.data) : e.data;
        if (d && d.type === "resize.embed" && d.data) {
          window.parent.postMessage({ type: "atlas-reddit-resize", id: "${bookmark.id}", height: d.data }, "*");
        }
      } catch(err) {}
    });
  </script>
</body>
</html>`
  }, [rawHtml, bookmark.id])

  if (rawHtml) {
    return (
      <div className="relative w-full overflow-hidden bg-white dark:bg-zinc-900 border-b border-brand-border">
        {isFrameLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/90 backdrop-blur-xs dark:bg-zinc-900/90">
            <div className="flex items-center gap-2 font-mono text-xs text-brand-muted">
              <Spinner className="size-4" />
              <span>Loading Reddit oEmbed...</span>
            </div>
          </div>
        )}
        <iframe
          srcDoc={srcDoc}
          title={bookmark.title || "Reddit oEmbed"}
          sandbox="allow-scripts allow-same-origin allow-popups"
          loading="lazy"
          onLoad={() => {
            setTimeout(() => setIsFrameLoading(false), 800)
          }}
          className="w-full border-none transition-all duration-300"
          style={{ height: `${frameHeight}px`, minHeight: "220px", display: "block" }}
        />
      </div>
    )
  }

  // Loading state while on-the-fly oEmbed is fetching
  if (isOEmbedFetching) {
    return (
      <div className="flex min-h-[220px] w-full flex-col items-center justify-center gap-2 border-b border-brand-border bg-white p-6 font-mono text-xs text-brand-muted dark:bg-zinc-900">
        <Spinner className="size-5" />
        <span>Fetching Reddit oEmbed...</span>
      </div>
    )
  }

  // Fallback card if Reddit oEmbed returns 404 or fails
  return (
    <div className="flex min-h-[160px] w-full flex-col justify-between border-b border-brand-border bg-white p-5 text-left dark:bg-zinc-900">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="flex size-5.5 shrink-0 items-center justify-center rounded-full bg-[#FF4500] text-white font-bold text-[10px]">
            r/
          </div>
          <span className="font-semibold text-xs text-brand-charcoal">{subreddit}</span>
        </div>
        <h3 className="text-sm font-bold leading-snug text-brand-charcoal line-clamp-3">
          {bookmark.title || "Reddit Post"}
        </h3>
        {bookmark.description && (
          <p className="text-xs text-brand-muted line-clamp-2">{bookmark.description}</p>
        )}
      </div>

      <div className="pt-3">
        <a
          href={bookmark.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 font-mono text-[10px] text-brand-muted hover:text-brand-charcoal"
        >
          <span>View on reddit.com</span>
          <ArrowSquareOut className="size-3" />
        </a>
      </div>
    </div>
  )
}
