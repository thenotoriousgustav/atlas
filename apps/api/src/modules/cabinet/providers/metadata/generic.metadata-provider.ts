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
      if (!html) return { title: this.getDomain(url) }

      const rawTitle =
        this.getMetaContent(html, "property", "og:title") ||
        this.getMetaContent(html, "name", "og:title") ||
        html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1] ||
        this.getDomain(url)

      const rawDescription =
        this.getMetaContent(html, "property", "og:description") ||
        this.getMetaContent(html, "name", "og:description") ||
        this.getMetaContent(html, "name", "description")

      const rawImage =
        this.getMetaContent(html, "property", "og:image") ||
        this.getMetaContent(html, "property", "og:image:url") ||
        this.getMetaContent(html, "property", "og:image:secure_url") ||
        this.getMetaContent(html, "name", "og:image") ||
        this.getMetaContent(html, "itemprop", "image") ||
        html.match(
          /<link[^>]+rel=["']image_src["'][^>]+href=["']([^"']+)["']/i
        )?.[1] ||
        html.match(
          /<link[^>]+href=["']([^"']+)["'][^>]+rel=["']image_src["']/i
        )?.[1]
      const rawSiteName =
        this.getMetaContent(html, "property", "og:site_name") ||
        this.getMetaContent(html, "name", "og:site_name") ||
        this.getMetaContent(html, "name", "application-name") ||
        this.getMetaContent(html, "name", "apple-mobile-web-app-title")
      const rawFavicon =
        html.match(
          /<link[^>]+rel=["'](?:shortcut )?icon["'][^>]+href=["']([^"']+)["']/i
        )?.[1] ||
        html.match(
          /<link[^>]+href=["']([^"']+)["'][^>]+rel=["'](?:shortcut )?icon["']/i
        )?.[1] ||
        html.match(
          /<link[^>]+rel=["']apple-touch-icon(?:-precomposed)?["'][^>]+href=["']([^"']+)["']/i
        )?.[1] ||
        html.match(
          /<link[^>]+href=["']([^"']+)["'][^>]+rel=["']apple-touch-icon(?:-precomposed)?["']/i
        )?.[1]

      return {
        title: decodeHtmlEntities(rawTitle.trim() || this.getDomain(url)),
        description: rawDescription
          ? decodeHtmlEntities(rawDescription.trim())
          : undefined,
        imageUrl: this.resolveUrl(rawImage, url),
        faviconUrl: this.resolveUrl(rawFavicon, url),
        siteName: rawSiteName
          ? decodeHtmlEntities(rawSiteName.trim())
          : undefined,
      }
    } catch (error) {
      this.logger.warn(
        `Failed to extract generic metadata for ${url}: ${(error as Error).message}`
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
        if (!response.ok) continue

        const html = await response.text()
        if (
          html &&
          (/<(?:meta|title)\b/i.test(html) ||
            userAgent === this.userAgents[this.userAgents.length - 1])
        ) {
          return html
        }
      } catch {
        // Retry the same URL with the next user agent.
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

  private resolveUrl(
    value: string | undefined,
    baseUrl: string
  ): string | undefined {
    if (!value) return undefined
    try {
      return new URL(decodeHtmlEntities(value.trim()), baseUrl).href
    } catch {
      return undefined
    }
  }

  private getDomain(url: string): string {
    try {
      return new URL(url).hostname.replace(/^www\./, "")
    } catch {
      return url
    }
  }
}
