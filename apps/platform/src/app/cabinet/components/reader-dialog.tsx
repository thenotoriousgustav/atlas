"use client"

import React, { useEffect, useRef, useState, useMemo } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { cabinetReaderApi, BookmarkArticle } from "@atlas/api-client"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@atlas/ui/components/dialog"
import { Button } from "@atlas/ui/components/button"
import { Badge } from "@atlas/ui/components/badge"
import { Skeleton } from "@atlas/ui/components/skeleton"
import { toast } from "@atlas/ui/components/sonner"
import {
  X,
  BookOpen,
  Clock,
  Archive,
  ArrowSquareOut,
  CheckCircle,
  Copy,
  TextAa,
  FileText,
  Eye,
  Check,
  Globe,
  ArrowClockwise,
  LockSimple,
} from "@phosphor-icons/react"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@atlas/ui/components/dropdown-menu"
import { cn } from "@atlas/ui/lib/utils"

interface ReaderDialogProps {
  bookmark: any | null
  isOpen: boolean
  initialTab?: "reader" | "webview"
  onClose: () => void
}

type ReaderTheme = "sepia" | "light" | "dark" | "oled"
type ReaderFont = "serif" | "sans" | "mono"
type ReadingWidth = "normal" | "comfortable" | "wide"

export function ReaderDialog({
  bookmark,
  isOpen,
  initialTab = "reader",
  onClose,
}: ReaderDialogProps) {
  const queryClient = useQueryClient()
  const scrollRef = useRef<HTMLDivElement>(null)

  // Typography & Appearance Preferences
  const [theme, setTheme] = useState<ReaderTheme>("sepia")
  const [font, setFont] = useState<ReaderFont>("serif")
  const [fontSize, setFontSize] = useState<number>(17)
  const [width, setWidth] = useState<ReadingWidth>("comfortable")
  const [activeTab, setActiveTab] = useState<"reader" | "webview">(initialTab)
  const [scrollPercent, setScrollPercent] = useState<number>(0)
  const [iframeKey, setIframeKey] = useState<number>(0)

  // Sync initialTab when modal opens with a specific preference
  useEffect(() => {
    if (isOpen && initialTab) {
      setActiveTab(initialTab)
    }
  }, [isOpen, initialTab, bookmark?.id])

  // Fetch article content
  const {
    data: articleData,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["cabinet-article", bookmark?.id],
    queryFn: () => cabinetReaderApi.getArticle(bookmark.id),
    enabled: isOpen && !!bookmark?.id,
    staleTime: 1000 * 60 * 10, // 10 mins
  })

  const article: BookmarkArticle | undefined = (articleData as any)?.data || articleData

  // Mutation to update progress
  const updateProgressMutation = useMutation({
    mutationFn: (payload: { scrollProgress?: number; isRead?: boolean }) =>
      cabinetReaderApi.updateProgress(bookmark.id, payload),
    onSuccess: (updated) => {
      queryClient.setQueryData(["cabinet-article", bookmark.id], updated)
      queryClient.invalidateQueries({ queryKey: ["bookmarks"] })
    },
  })

  // Handle scroll progress
  const handleScroll = () => {
    if (!scrollRef.current) return
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current
    const totalScroll = scrollHeight - clientHeight
    if (totalScroll <= 0) {
      setScrollPercent(100)
      return
    }
    const percent = Math.min(100, Math.max(0, Math.round((scrollTop / totalScroll) * 100)))
    setScrollPercent(percent)

    // Auto mark as read when reaching bottom (>= 90%)
    if (percent >= 90 && article && !article.isRead && !updateProgressMutation.isPending) {
      updateProgressMutation.mutate({ isRead: true, scrollProgress: percent })
    }
  }

  // Restore previous scroll position once article loads
  useEffect(() => {
    if (article && scrollRef.current && article.scrollProgress > 5 && article.scrollProgress < 95) {
      const { scrollHeight, clientHeight } = scrollRef.current
      const target = ((scrollHeight - clientHeight) * article.scrollProgress) / 100
      scrollRef.current.scrollTo({ top: target, behavior: "smooth" })
    }
  }, [article?.id])

  const handleToggleRead = () => {
    if (!article) return
    updateProgressMutation.mutate({
      isRead: !article.isRead,
      scrollProgress: scrollPercent,
    })
    toast.success(article.isRead ? "Marked as unread" : "Marked as read")
  }

  const handleCopyMarkdown = () => {
    if (!article?.contentMarkdown) return
    const text = `# ${bookmark?.title || "Article"}\n\nSource: ${bookmark?.url}\n\n${article.contentMarkdown}`
    navigator.clipboard?.writeText(text)
    toast.success("Markdown copied to clipboard")
  }

  // Theme styling configurations
  const themeStyles = useMemo(() => {
    switch (theme) {
      case "sepia":
        return {
          bg: "bg-[#fbf0d9] text-[#2c221e]",
          header: "bg-[#fbf0d9]/90 border-[#ebd8b7]",
          prose: "text-[#2c221e]",
          accent: "text-[#8a5d3b]",
          border: "border-[#e5d0ad]",
          subtext: "text-[#7a6a5f]",
          preBg: "bg-[#f4e4c3]",
        }
      case "dark":
        return {
          bg: "bg-[#18181b] text-[#f4f4f5]",
          header: "bg-[#18181b]/90 border-zinc-800",
          prose: "text-zinc-200",
          accent: "text-zinc-400",
          border: "border-zinc-800",
          subtext: "text-zinc-400",
          preBg: "bg-zinc-900",
        }
      case "oled":
        return {
          bg: "bg-black text-white",
          header: "bg-black/90 border-zinc-900",
          prose: "text-zinc-100",
          accent: "text-zinc-400",
          border: "border-zinc-900",
          subtext: "text-zinc-500",
          preBg: "bg-zinc-950",
        }
      case "light":
      default:
        return {
          bg: "bg-white text-zinc-900",
          header: "bg-white/90 border-zinc-200",
          prose: "text-zinc-800",
          accent: "text-zinc-600",
          border: "border-zinc-200",
          subtext: "text-zinc-500",
          preBg: "bg-zinc-100",
        }
    }
  }, [theme])

  const fontStyle = useMemo(() => {
    switch (font) {
      case "serif":
        return "font-serif font-normal"
      case "mono":
        return "font-mono"
      case "sans":
      default:
        return "font-sans"
    }
  }, [font])

  const widthStyle = useMemo(() => {
    switch (width) {
      case "normal":
        return "max-w-xl"
      case "wide":
        return "max-w-3xl"
      case "comfortable":
      default:
        return "max-w-2xl"
    }
  }, [width])

  if (!bookmark) return null

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton={false}
        className={cn(
          "fixed inset-0 top-0 left-0 z-50 flex h-screen max-h-screen w-screen max-w-none sm:max-w-none translate-x-0 translate-y-0 transform-none flex-col border-none p-0 gap-0 transition-colors duration-200 outline-none",
          themeStyles.bg
        )}
      >
        {/* Editorial Custom Styling for Reader Content */}
        <style dangerouslySetInnerHTML={{ __html: `
          .reader-prose p { margin-bottom: 1.25em; }
          .reader-prose h1, .reader-prose h2, .reader-prose h3 { margin-top: 1.5em; margin-bottom: 0.5em; font-weight: 700; }
          .reader-prose img { max-width: 100%; height: auto; margin: 1.5em auto; border-radius: 2px; }
          .reader-prose ul, .reader-prose ol { margin-left: 1.5em; margin-bottom: 1.25em; list-style-position: outside; }
          .reader-prose ul { list-style-type: disc; }
          .reader-prose ol { list-style-type: decimal; }
          .reader-prose blockquote { border-left: 3px solid currentColor; padding-left: 1em; opacity: 0.85; margin: 1.5em 0; font-style: italic; }
          .reader-prose pre { padding: 1em; overflow-x: auto; margin: 1.5em 0; font-size: 0.9em; }
          .reader-prose a { text-decoration: underline; text-underline-offset: 2px; }
        `}} />

        <DialogHeader className="sr-only">
          <DialogTitle>{bookmark.title || "Reader Mode"}</DialogTitle>
        </DialogHeader>

        {/* Top Reading Progress Line */}
        <div className="absolute top-0 left-0 z-50 h-1 w-full bg-black/5 dark:bg-white/5">
          <div
            className="h-full bg-brand-charcoal transition-all duration-150 dark:bg-white"
            style={{ width: `${scrollPercent}%` }}
          />
        </div>

        {/* Reader Top Controls Toolbar */}
        <header
          className={cn(
            "sticky top-0 z-40 flex items-center justify-between border-b px-4 py-2.5 backdrop-blur-md transition-colors sm:px-6",
            themeStyles.header
          )}
        >
          {/* Left info & Close */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 rounded-none p-0 hover:bg-black/5 dark:hover:bg-white/5"
            >
              <X className="h-4 w-4" />
            </Button>

            <div className="flex items-center gap-2 text-xs">
              <span className={cn("font-medium tracking-wide uppercase", themeStyles.accent)}>
                {bookmark.siteName || new URL(bookmark.url).hostname.replace(/^www\./, "")}
              </span>
              {article?.readingTimeMinutes && (
                <>
                  <span className={themeStyles.subtext}>•</span>
                  <span className={cn("flex items-center gap-1", themeStyles.subtext)}>
                    <Clock className="h-3.5 w-3.5" />
                    {article.readingTimeMinutes} min read
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Right Actions & Typography Settings */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* View Mode Toggle: Clean Reader vs Web View */}
            <div className="flex items-center border p-0.5" style={{ borderColor: "inherit" }}>
              <button
                type="button"
                onClick={() => setActiveTab("reader")}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1 text-xs transition-colors",
                  activeTab === "reader"
                    ? "bg-black/10 font-medium dark:bg-white/10"
                    : "opacity-60 hover:opacity-100"
                )}
                title="Distraction-free Reader Mode"
              >
                <BookOpen className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Reader</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("webview")}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1 text-xs transition-colors",
                  activeTab === "webview"
                    ? "bg-black/10 font-medium dark:bg-white/10"
                    : "opacity-60 hover:opacity-100"
                )}
                title="Live Embedded Webpage"
              >
                <Globe className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Web View</span>
              </button>
            </div>

            {/* Typography Controls Dropdown (visible in Reader mode) */}
            {activeTab === "reader" && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1 rounded-none border px-2.5 text-xs"
                  >
                    <TextAa className="h-4 w-4" />
                    <span className="hidden sm:inline">Appearance</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 rounded-none p-2">
                  <DropdownMenuLabel className="font-mono text-[10px] tracking-wider text-muted-foreground uppercase">
                    Theme
                  </DropdownMenuLabel>
                  <div className="grid grid-cols-4 gap-1.5 py-1">
                    {(["sepia", "light", "dark", "oled"] as ReaderTheme[]).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setTheme(t)}
                        className={cn(
                          "flex h-7 items-center justify-center border text-[10px] font-medium capitalize transition-all",
                          t === "sepia" && "bg-[#fbf0d9] text-[#2c221e] border-[#ebd8b7]",
                          t === "light" && "bg-white text-zinc-900 border-zinc-300",
                          t === "dark" && "bg-zinc-800 text-zinc-100 border-zinc-700",
                          t === "oled" && "bg-black text-white border-zinc-800",
                          theme === t && "ring-2 ring-brand-charcoal ring-offset-1"
                        )}
                      >
                        {t === "sepia" ? "Paper" : t}
                      </button>
                    ))}
                  </div>

                  <DropdownMenuSeparator />

                  <DropdownMenuLabel className="font-mono text-[10px] tracking-wider text-muted-foreground uppercase">
                    Font Family
                  </DropdownMenuLabel>
                  <div className="grid grid-cols-3 gap-1 py-1">
                    {(["serif", "sans", "mono"] as ReaderFont[]).map((f) => (
                      <button
                        key={f}
                        type="button"
                        onClick={() => setFont(f)}
                        className={cn(
                          "h-7 border text-xs capitalize transition-all",
                          f === "serif" && "font-serif",
                          f === "mono" && "font-mono",
                          f === "sans" && "font-sans",
                          font === f ? "bg-brand-charcoal text-white font-medium" : "hover:bg-muted/50"
                        )}
                      >
                        {f}
                      </button>
                    ))}
                  </div>

                  <DropdownMenuSeparator />

                  <DropdownMenuLabel className="font-mono text-[10px] tracking-wider text-muted-foreground uppercase">
                    Font Size ({fontSize}px)
                  </DropdownMenuLabel>
                  <div className="flex items-center justify-between gap-1 py-1">
                    <button
                      type="button"
                      onClick={() => setFontSize((s) => Math.max(14, s - 1))}
                      className="flex h-7 flex-1 items-center justify-center border text-xs font-semibold hover:bg-muted/50"
                    >
                      A-
                    </button>
                    <button
                      type="button"
                      onClick={() => setFontSize(17)}
                      className="flex h-7 flex-1 items-center justify-center border text-[10px] hover:bg-muted/50"
                    >
                      Reset
                    </button>
                    <button
                      type="button"
                      onClick={() => setFontSize((s) => Math.min(24, s + 1))}
                      className="flex h-7 flex-1 items-center justify-center border text-xs font-semibold hover:bg-muted/50"
                    >
                      A+
                    </button>
                  </div>

                  <DropdownMenuSeparator />

                  <DropdownMenuLabel className="font-mono text-[10px] tracking-wider text-muted-foreground uppercase">
                    Width
                  </DropdownMenuLabel>
                  <div className="grid grid-cols-3 gap-1 py-1">
                    {(["normal", "comfortable", "wide"] as ReadingWidth[]).map((w) => (
                      <button
                        key={w}
                        type="button"
                        onClick={() => setWidth(w)}
                        className={cn(
                          "h-7 border text-[11px] capitalize transition-all",
                          width === w ? "bg-brand-charcoal text-white font-medium" : "hover:bg-muted/50"
                        )}
                      >
                        {w}
                      </button>
                    ))}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Read / Unread Status Button (in Reader mode) */}
            {activeTab === "reader" && (
              <Button
                variant={article?.isRead ? "default" : "outline"}
                size="sm"
                onClick={handleToggleRead}
                className="h-8 gap-1 rounded-none px-2.5 text-xs"
              >
                <CheckCircle className="h-3.5 w-3.5" weight={article?.isRead ? "fill" : "regular"} />
                <span className="hidden sm:inline">{article?.isRead ? "Completed" : "Mark as Read"}</span>
              </Button>
            )}

            {/* Original Source Link */}
            <a
              href={bookmark.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-8 items-center gap-1 border px-2.5 text-xs transition-colors hover:bg-black/5 dark:hover:bg-white/5"
              style={{ borderColor: "inherit" }}
            >
              <ArrowSquareOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Source</span>
            </a>
          </div>
        </header>

        {/* Scrollable Reader / Markdown Content Area OR Live Web View */}
        {activeTab === "webview" ? (
          <div className="flex flex-1 flex-col h-full w-full bg-zinc-100 dark:bg-zinc-950 overflow-hidden">
            {/* Embedded Browser Navigation Bar */}
            <div
              className="flex items-center justify-between gap-2 border-b bg-white px-3 py-1.5 text-xs dark:bg-zinc-900 shrink-0"
              style={{ borderColor: "inherit" }}
            >
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => setIframeKey((k) => k + 1)}
                  className="size-7 rounded-none hover:bg-black/5 dark:hover:bg-white/5"
                  title="Reload webpage"
                >
                  <ArrowClockwise className="size-3.5 text-brand-muted" />
                </Button>
              </div>

              {/* URL Address Bar */}
              <div
                className="flex flex-1 max-w-2xl items-center gap-2 border bg-zinc-50 px-3 py-1 font-mono text-[11px] text-brand-muted dark:bg-zinc-800/60 dark:text-zinc-400"
                style={{ borderColor: "inherit" }}
              >
                <LockSimple className="size-3 text-emerald-600 dark:text-emerald-400 shrink-0" weight="fill" />
                <span className="truncate flex-1 select-all">{bookmark.url}</span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText(bookmark.url)
                    toast.success("URL copied to clipboard")
                  }}
                  className="shrink-0 text-brand-muted hover:text-brand-charcoal"
                  title="Copy URL"
                >
                  <Copy className="size-3" />
                </button>
              </div>

              {/* Right Direct Link Action */}
              <div className="flex items-center gap-1.5">
                <a
                  href={bookmark.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-7 items-center gap-1.5 border px-2.5 text-xs font-medium text-brand-charcoal hover:bg-black/5 dark:hover:bg-white/5 dark:text-white"
                  style={{ borderColor: "inherit" }}
                >
                  <ArrowSquareOut className="size-3.5" />
                  <span className="hidden sm:inline">Open in Tab</span>
                </a>
              </div>
            </div>

            {/* Live Interactive Iframe */}
            <div className="relative flex-1 w-full h-full bg-white">
              <iframe
                key={iframeKey}
                src={bookmark.url}
                className="h-full w-full border-none bg-white"
                sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-downloads"
                title={bookmark.title || "Web View"}
              />
            </div>
          </div>
        ) : (
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto px-4 py-8 sm:px-8 sm:py-12"
          >
            <div className={cn("mx-auto transition-all", widthStyle)}>
              {isLoading ? (
                <div className="space-y-6 pt-6">
                  <Skeleton className="h-10 w-3/4 rounded-none" />
                  <Skeleton className="h-4 w-1/3 rounded-none" />
                  <Skeleton className="h-64 w-full rounded-none" />
                  <div className="space-y-3 pt-4">
                    <Skeleton className="h-4 w-full rounded-none" />
                    <Skeleton className="h-4 w-full rounded-none" />
                    <Skeleton className="h-4 w-5/6 rounded-none" />
                    <Skeleton className="h-4 w-4/5 rounded-none" />
                  </div>
                </div>
              ) : isError || !article?.contentHtml ? (
                <div className="space-y-4 rounded-none border p-8 text-center" style={{ borderColor: "inherit" }}>
                  <BookOpen className="mx-auto h-10 w-10 opacity-40" />
                  <div className="space-y-1">
                    <h3 className="font-serif text-lg font-semibold">Reader View Not Available</h3>
                    <p className={cn("text-xs", themeStyles.subtext)}>
                      This webpage appears to be an application, video, or dynamic page without standard article text.
                    </p>
                  </div>
                  <div className="flex justify-center gap-3 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setActiveTab("webview")}
                      className="inline-flex items-center gap-1.5 rounded-none text-xs"
                    >
                      <Globe className="h-3.5 w-3.5" />
                      Open Live Web View
                    </Button>
                    <a
                      href={bookmark.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 border px-3 py-1.5 text-xs font-medium hover:bg-black/5 dark:hover:bg-white/5"
                    >
                      <ArrowSquareOut className="h-3.5 w-3.5" />
                      Open in Browser
                    </a>
                    {article?.waybackUrl && (
                      <a
                        href={article.waybackUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 border px-3 py-1.5 text-xs font-medium hover:bg-black/5 dark:hover:bg-white/5"
                      >
                        <Archive className="h-3.5 w-3.5" />
                        View Web Archive
                      </a>
                    )}
                  </div>
                </div>
              ) : (
                <article className="space-y-8">
                  {/* Article Header */}
                  <header className="space-y-4 border-b pb-6" style={{ borderColor: "inherit" }}>
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <Badge
                        variant="outline"
                        className="rounded-none border px-1.5 py-0.5 font-mono text-[10px] tracking-wider uppercase"
                        style={{ borderColor: "inherit" }}
                      >
                        {bookmark.siteName || new URL(bookmark.url).hostname.replace(/^www\./, "")}
                      </Badge>

                      {article.wordCount ? (
                        <span className={themeStyles.subtext}>
                          {article.wordCount.toLocaleString()} words
                        </span>
                      ) : null}

                      {article.publishedAt ? (
                        <>
                          <span className={themeStyles.subtext}>•</span>
                          <span className={themeStyles.subtext}>
                            {new Date(article.publishedAt).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        </>
                      ) : null}
                    </div>

                    <h1
                      className={cn("font-bold tracking-tight", fontStyle)}
                      style={{ fontSize: `${Math.round(fontSize * 1.8)}px`, lineHeight: 1.25 }}
                    >
                      {bookmark.title || "Untitled Article"}
                    </h1>

                    {article.author && (
                      <p className={cn("text-xs font-medium", themeStyles.accent)}>
                        By {article.author}
                      </p>
                    )}
                  </header>

                  {/* Main Content Render */}
                  <div
                    className={cn("reader-prose leading-relaxed", fontStyle, themeStyles.prose)}
                    style={{ fontSize: `${fontSize}px`, lineHeight: 1.7 }}
                    dangerouslySetInnerHTML={{ __html: article.contentHtml }}
                  />

                  {/* Article Footer & Digital Preservation Banner */}
                  <footer className="space-y-6 border-t pt-8" style={{ borderColor: "inherit" }}>
                    <div
                      className={cn(
                        "flex flex-col gap-4 rounded-none border p-5 sm:flex-row sm:items-center sm:justify-between",
                        themeStyles.preBg
                      )}
                      style={{ borderColor: "inherit" }}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Archive className="h-4 w-4" />
                          <span className="font-mono text-xs font-semibold tracking-wide uppercase">
                            Digital Preservation Active
                          </span>
                        </div>
                        <p className={cn("text-xs", themeStyles.subtext)}>
                          This clean reader snapshot is permanently archived in your personal Cabinet database.
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleCopyMarkdown}
                          className="h-8 gap-1.5 rounded-none text-xs"
                        >
                          <Copy className="h-3.5 w-3.5" />
                          Copy Markdown
                        </Button>

                        {article.waybackUrl && (
                          <a
                            href={article.waybackUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex h-8 items-center gap-1.5 border px-3 text-xs font-medium hover:bg-black/5 dark:hover:bg-white/5"
                            style={{ borderColor: "inherit" }}
                          >
                            <Archive className="h-3.5 w-3.5" />
                            Wayback Machine
                          </a>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs pb-12">
                      <span className={themeStyles.subtext}>
                        {article.isRead ? "✓ Read completed" : `${scrollPercent}% finished`}
                      </span>
                      <Button
                        variant={article.isRead ? "outline" : "default"}
                        size="sm"
                        onClick={handleToggleRead}
                        className="gap-1.5 rounded-none text-xs"
                      >
                        <CheckCircle className="h-4 w-4" weight={article.isRead ? "fill" : "regular"} />
                        {article.isRead ? "Mark as Unread" : "Mark as Finished"}
                      </Button>
                    </div>
                  </footer>
                </article>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
