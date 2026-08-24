import { Injectable, Logger } from "@nestjs/common"
import {
  ExtractedMetadata,
  MetadataProvider,
  decodeHtmlEntities,
} from "./metadata-provider.interface"

@Injectable()
export class GenericMetadataProvider implements MetadataProvider {
  private readonly logger = new Logger(GenericMetadataProvider.name)

  supports(_url: URL): boolean {
    // ponytail: fallback generic provider supports all URLs
    return true
  }

  async extract(url: string, _urlObj?: URL): Promise<ExtractedMetadata | null> {
    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 (compatible; Googlebot/2.1)",
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9,id;q=0.8",
        },
        signal: AbortSignal.timeout(7000),
        redirect: "follow",
      })

      const html = await response.text()
      if (typeof html !== "string" || !html) {
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

      return {
        title,
        description,
        imageUrl,
      }
    } catch (error) {
      this.logger.warn(
        `Failed to extract generic metadata for ${url}: ${(error as any).message}`
      )
      return { title: this.getDomain(url) }
    }
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
