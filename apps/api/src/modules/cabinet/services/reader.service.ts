import { Injectable, Logger } from "@nestjs/common"

export interface ExtractedArticleContent {
  author?: string
  publishedAt?: Date
  readingTimeMinutes: number
  wordCount: number
  contentHtml: string
  contentMarkdown: string
  waybackUrl?: string
}

@Injectable()
export class ReaderService {
  private readonly logger = new Logger(ReaderService.name)

  async extractArticle(url: string): Promise<ExtractedArticleContent | null> {
    try {
      // Use dynamic imports to maintain clean CommonJS Jest compatibility
      const { extract } = await Function('return import("@extractus/article-extractor")')()
      const DOMPurifyModule = await Function('return import("isomorphic-dompurify")')()
      const TurndownModule = await Function('return import("turndown")')()

      const DOMPurify = DOMPurifyModule.default || DOMPurifyModule
      const TurndownService = TurndownModule.default || TurndownModule

      const turndown = new TurndownService({
        headingStyle: "atx",
        codeBlockStyle: "fenced",
        bulletListMarker: "-",
      })

      const data = await extract(url)
      if (!data || !data.content || data.content.trim().length < 50) {
        return null
      }

      // 1. Sanitize HTML content
      const contentHtml = DOMPurify.sanitize(data.content, {
        ALLOWED_TAGS: [
          "h1", "h2", "h3", "h4", "h5", "h6",
          "p", "a", "b", "i", "strong", "em", "code", "pre",
          "ul", "ol", "li", "blockquote", "img", "figure", "figcaption",
          "hr", "table", "thead", "tbody", "tr", "th", "td", "span", "br",
        ],
        ALLOWED_ATTR: ["href", "src", "alt", "title", "class", "target", "rel"],
      })

      // 2. Convert to clean Markdown
      const contentMarkdown = turndown.turndown(contentHtml)

      // 3. Compute word count and reading time (avg 200 words per minute)
      const plainText = contentHtml
        .replace(/<[^>]*>/g, " ")
        .replace(/\s+/g, " ")
        .trim()
      const wordCount = plainText ? plainText.split(" ").length : 0
      const readingTimeMinutes = Math.max(1, Math.ceil(wordCount / 200))

      // 4. Generate Wayback Machine URL & fire async backup trigger
      const waybackUrl = `https://web.archive.org/web/${url}`
      this.triggerWaybackBackup(url).catch(() => {})

      return {
        author: data.author || undefined,
        publishedAt: data.published ? new Date(data.published) : undefined,
        readingTimeMinutes,
        wordCount,
        contentHtml,
        contentMarkdown,
        waybackUrl,
      }
    } catch (error: any) {
      this.logger.debug(
        `Reader extraction skipped for ${url}: ${error?.message || error}`
      )
      return null
    }
  }

  private async triggerWaybackBackup(url: string): Promise<void> {
    try {
      // Fire-and-forget save request to Wayback Machine
      await fetch(`https://web.archive.org/save/${encodeURIComponent(url)}`, {
        method: "GET",
        signal: AbortSignal.timeout(4000),
      })
    } catch {
      // Ignore background save errors
    }
  }
}
