import { Injectable, Logger } from "@nestjs/common"

function decodeHtmlEntities(str: string): string {
  if (!str) return ""
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, "/")
    .replace(/&nbsp;/g, " ")
}

@Injectable()
export class MetadataService {
  private readonly logger = new Logger(MetadataService.name)

  async extract(
    url: string
  ): Promise<{ title: string; description?: string; imageUrl?: string }> {
    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
        signal: AbortSignal.timeout(6000),
        redirect: "follow",
      })

      const html = await response.text()
      if (typeof html !== "string" || !html) {
        return { title: this.getDomain(url) }
      }

      // Title (og:title -> <title>)
      const ogTitle =
        this.getMetaContent(html, "property", "og:title") ||
        this.getMetaContent(html, "name", "og:title")
      const titleTag = html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]
      const rawTitle = ogTitle || titleTag || this.getDomain(url)
      const title = decodeHtmlEntities(rawTitle.trim())

      // Description (og:description -> description)
      const rawDescription =
        this.getMetaContent(html, "property", "og:description") ||
        this.getMetaContent(html, "name", "description")
      const description = rawDescription
        ? decodeHtmlEntities(rawDescription.trim())
        : undefined

      // Image (og:image)
      const rawImage = this.getMetaContent(html, "property", "og:image")
      let imageUrl = rawImage ? decodeHtmlEntities(rawImage.trim()) : undefined

      // Handle relative image URL
      if (imageUrl && imageUrl.startsWith("/")) {
        const urlObj = new URL(url)
        imageUrl = `${urlObj.origin}${imageUrl}`
      }

      return {
        title,
        description,
        imageUrl,
      }
    } catch (error) {
      this.logger.warn(
        `Failed to extract metadata for ${url}: ${(error as any).message}`
      )
      return { title: this.getDomain(url) }
    }
  }

  private getMetaContent(html: string, attr: "name" | "property", value: string): string | undefined {
    const pattern1 = new RegExp(`<meta\\s+${attr}=["']${value}["']\\s+content=["']([^"']+)["']`, "i")
    const pattern2 = new RegExp(`<meta\\s+content=["']([^"']+)["']\\s+${attr}=["']${value}["']`, "i")
    return html.match(pattern1)?.[1] || html.match(pattern2)?.[1]
  }

  private getDomain(url: string): string {
    try {
      const domain = new URL(url).hostname
      return domain.startsWith("www.") ? domain.slice(4) : domain
    } catch {
      return url
    }
  }
}
