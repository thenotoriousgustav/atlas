import { Injectable, Logger } from "@nestjs/common"
import {
  ExtractedMetadata,
  MetadataProvider,
  CRAWLER_USER_AGENTS,
  decodeHtmlEntities,
} from "./metadata-provider.interface"

@Injectable()
export class GenericMetadataProvider implements MetadataProvider {
  private readonly logger = new Logger(GenericMetadataProvider.name)

  // Prioritized list: Meta/WhatsApp social crawlers first (whitelisted by e-commerce & SPA sites), desktop fallback
  private readonly userAgents = [
    CRAWLER_USER_AGENTS.FACEBOOK_EXTERNAL_HIT,
    CRAWLER_USER_AGENTS.WHATSAPP,
    CRAWLER_USER_AGENTS.CHROME_DESKTOP,
  ]

  supports(_url: URL): boolean {
    return true
  }

  async extract(url: string, _urlObj?: URL): Promise<ExtractedMetadata | null> {
    try {
      const html = await this.fetchHtml(url)
      if (!html) {
        return { title: this.getDomain(url) }
      }

      // Title: og:title -> twitter:title -> <title>
      const ogTitle =
        this.getMetaContent(html, "property", "og:title") ||
        this.getMetaContent(html, "name", "og:title") ||
        this.getMetaContent(html, "name", "twitter:title") ||
        this.getMetaContent(html, "property", "twitter:title")
      const titleTag = html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]
      const rawTitle = ogTitle || titleTag || this.getDomain(url)
      const title = decodeHtmlEntities(rawTitle.trim())

      // Description: og:description -> twitter:description -> description
      const rawDescription =
        this.getMetaContent(html, "property", "og:description") ||
        this.getMetaContent(html, "name", "og:description") ||
        this.getMetaContent(html, "name", "twitter:description") ||
        this.getMetaContent(html, "property", "twitter:description") ||
        this.getMetaContent(html, "name", "description")
      const description = rawDescription
        ? decodeHtmlEntities(rawDescription.trim())
        : undefined

      // Image: og:image -> twitter:image -> link[rel=image_src] -> itemprop[image]
      const rawImage =
        this.getMetaContent(html, "property", "og:image") ||
        this.getMetaContent(html, "property", "og:image:url") ||
        this.getMetaContent(html, "property", "og:image:secure_url") ||
        this.getMetaContent(html, "name", "og:image") ||
        this.getMetaContent(html, "name", "twitter:image") ||
        this.getMetaContent(html, "property", "twitter:image") ||
        this.getMetaContent(html, "name", "twitter:image:src") ||
        this.getMetaContent(html, "itemprop", "image") ||
        html.match(/<link[^>]+rel=["']image_src["'][^>]+href=["']([^"']+)["']/i)?.[1] ||
        html.match(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["']image_src["']/i)?.[1]

      let imageUrl = rawImage ? decodeHtmlEntities(rawImage.trim()) : undefined

      // Resolve relative image URLs to absolute URLs
      if (imageUrl) {
        try {
          imageUrl = new URL(imageUrl, url).href
        } catch {
          // Ignore invalid URL resolution
        }
      }

      // Site name: og:site_name -> name=application-name -> apple-mobile-web-app-title
      const rawSiteName =
        this.getMetaContent(html, "property", "og:site_name") ||
        this.getMetaContent(html, "name", "og:site_name") ||
        this.getMetaContent(html, "name", "application-name") ||
        this.getMetaContent(html, "name", "apple-mobile-web-app-title")
      const siteName = rawSiteName ? decodeHtmlEntities(rawSiteName.trim()) : undefined

      // Favicon URL: link[rel=icon] -> link[rel="shortcut icon"] -> link[rel=apple-touch-icon]
      const rawFavicon =
        html.match(/<link[^>]+rel=["'](?:shortcut )?icon["'][^>]+href=["']([^"']+)["']/i)?.[1] ||
        html.match(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["'](?:shortcut )?icon["']/i)?.[1] ||
        html.match(/<link[^>]+rel=["']apple-touch-icon(?:-precomposed)?["'][^>]+href=["']([^"']+)["']/i)?.[1] ||
        html.match(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["']apple-touch-icon(?:-precomposed)?["']/i)?.[1]

      let faviconUrl = rawFavicon ? decodeHtmlEntities(rawFavicon.trim()) : undefined
      if (faviconUrl) {
        try {
          faviconUrl = new URL(faviconUrl, url).href
        } catch {
          // Ignore invalid URL resolution
        }
      }

      return {
        title,
        description,
        imageUrl,
        siteName,
        faviconUrl,
      }
    } catch (error) {
      this.logger.warn(
        `Failed to extract generic metadata for ${url}: ${(error as any).message}`
      )
      return { title: this.getDomain(url) }
    }
  }

  private async fetchHtml(url: string): Promise<string | null> {
    for (const userAgent of this.userAgents) {
      try {
        const response = await fetch(url, {
          headers: {
            "User-Agent": userAgent,
            Accept:
              "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
            "Accept-Language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
          },
          signal: AbortSignal.timeout(6000),
          redirect: "follow",
        })

        if (!response.ok) {
          continue
        }

        const html = await response.text()
        if (typeof html === "string" && html.length > 0) {
          // If the page returns actual meta/title tags, use it
          if (
            html.includes("og:") ||
            html.includes("<title") ||
            html.includes("twitter:")
          ) {
            return html
          }
          // If this was the last fallback, return whatever HTML we have
          if (userAgent === this.userAgents[this.userAgents.length - 1]) {
            return html
          }
        }
      } catch {
        // try next user agent
      }
    }

    return null
  }

  private getMetaContent(
    html: string,
    attr: "name" | "property" | "itemprop",
    value: string
  ): string | undefined {
    const pattern1 = new RegExp(
      `<meta\\s+[^>]*${attr}=["']${value}["'][^>]*content=["']([^"']+)["']`,
      "i"
    )
    const pattern2 = new RegExp(
      `<meta\\s+[^>]*content=["']([^"']+)["'][^>]*${attr}=["']${value}["']`,
      "i"
    )
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
