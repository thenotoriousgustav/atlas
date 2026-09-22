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

  // Prioritized list: Meta/WhatsApp social crawlers first (whitelisted by e-commerce, Reddit & SPA sites), desktop fallback
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
      // 1. Fetch oEmbed metadata in parallel with HTML scraping
      const oembedPromise = this.fetchOEmbed(url)

      // 2. Fetch HTML using Facebook/WhatsApp crawler UA for rich OpenGraph tags
      const html = await this.fetchHtml(url)
      const oembed = await oembedPromise

      if (!html && !oembed) {
        return { title: this.getDomain(url) }
      }

      // Title determination priority:
      // If oEmbed provides a specific title, prefer it over localized/generic og:titles (e.g. Reddit "Dari komunitas ...", 404s)
      const ogTitle = html
        ? this.getMetaContent(html, "property", "og:title") ||
          this.getMetaContent(html, "name", "og:title") ||
          this.getMetaContent(html, "name", "twitter:title") ||
          this.getMetaContent(html, "property", "twitter:title")
        : undefined

      const titleTag = html?.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]

      let chosenTitle = oembed?.title || ogTitle || titleTag || this.getDomain(url)
      if (
        chosenTitle &&
        (chosenTitle.includes("komunitas") ||
          chosenTitle.includes("community on Reddit") ||
          chosenTitle.includes("404 Error"))
      ) {
        chosenTitle = oembed?.title || titleTag || this.getDomain(url)
      }

      const title = decodeHtmlEntities(chosenTitle?.trim() || this.getDomain(url))

      // Description determination:
      const rawDescription = html
        ? this.getMetaContent(html, "property", "og:description") ||
          this.getMetaContent(html, "name", "og:description") ||
          this.getMetaContent(html, "name", "twitter:description") ||
          this.getMetaContent(html, "property", "twitter:description") ||
          this.getMetaContent(html, "name", "description")
        : undefined

      const isReddit = url.includes("reddit.com") || url.includes("redd.it")
      let description: string | undefined = undefined

      if (isReddit && oembed?.author_name) {
        description = `Posted by u/${oembed.author_name}`
      } else if (rawDescription && !rawDescription.includes("Explore this post") && !rawDescription.includes("Jelajahi postingan ini")) {
        description = rawDescription
      } else if (oembed?.author_name) {
        description = `By ${oembed.author_name}`
      }

      if (description) {
        description = decodeHtmlEntities(description.trim())
      }

      // Image: og:image -> twitter:image -> oembed.thumbnail_url
      const rawImage = html
        ? this.getMetaContent(html, "property", "og:image") ||
          this.getMetaContent(html, "property", "og:image:url") ||
          this.getMetaContent(html, "property", "og:image:secure_url") ||
          this.getMetaContent(html, "name", "og:image") ||
          this.getMetaContent(html, "name", "twitter:image") ||
          this.getMetaContent(html, "property", "twitter:image") ||
          this.getMetaContent(html, "name", "twitter:image:src") ||
          this.getMetaContent(html, "itemprop", "image") ||
          html.match(/<link[^>]+rel=["']image_src["'][^>]+href=["']([^"']+)["']/i)?.[1] ||
          html.match(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["']image_src["']/i)?.[1]
        : undefined

      let imageUrl = rawImage || oembed?.thumbnail_url
      if (imageUrl) {
        imageUrl = decodeHtmlEntities(imageUrl.trim())
        try {
          imageUrl = new URL(imageUrl, url).href
        } catch {
          // Ignore invalid URL resolution
        }
      }

      // Site name: og:site_name -> name=application-name -> apple-mobile-web-app-title -> oembed.provider_name
      const rawSiteName = html
        ? this.getMetaContent(html, "property", "og:site_name") ||
          this.getMetaContent(html, "name", "og:site_name") ||
          this.getMetaContent(html, "name", "application-name") ||
          this.getMetaContent(html, "name", "apple-mobile-web-app-title")
        : undefined

      const siteName =
        (rawSiteName ? decodeHtmlEntities(rawSiteName.trim()) : undefined) ||
        oembed?.provider_name ||
        undefined

      // Favicon URL: link[rel=icon] -> link[rel="shortcut icon"] -> link[rel=apple-touch-icon]
      const rawFavicon = html
        ? html.match(/<link[^>]+rel=["'](?:shortcut )?icon["'][^>]+href=["']([^"']+)["']/i)?.[1] ||
          html.match(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["'](?:shortcut )?icon["']/i)?.[1] ||
          html.match(/<link[^>]+rel=["']apple-touch-icon(?:-precomposed)?["'][^>]+href=["']([^"']+)["']/i)?.[1] ||
          html.match(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["']apple-touch-icon(?:-precomposed)?["']/i)?.[1]
        : undefined

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
        embedHtml: oembed?.html || undefined,
      }
    } catch (error) {
      this.logger.warn(
        `Failed to extract generic metadata for ${url}: ${(error as any).message}`
      )
      return { title: this.getDomain(url) }
    }
  }

  private async fetchOEmbed(url: string): Promise<any | null> {
    try {
      const urlObj = new URL(url)
      const host = urlObj.hostname.toLowerCase()

      let oembedEndpoint: string | null = null

      if (host.includes("reddit.com") || host.includes("redd.it")) {
        oembedEndpoint = `https://www.reddit.com/oembed?url=${encodeURIComponent(url)}`
      } else if (host.includes("twitter.com") || host.includes("x.com")) {
        oembedEndpoint = `https://publish.twitter.com/oembed?url=${encodeURIComponent(url)}`
      } else if (host.includes("youtube.com") || host.includes("youtu.be")) {
        oembedEndpoint = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`
      } else if (host.includes("tiktok.com")) {
        oembedEndpoint = `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`
      } else if (host.includes("vimeo.com")) {
        oembedEndpoint = `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(url)}`
      }

      if (!oembedEndpoint) {
        return null
      }

      const res = await fetch(oembedEndpoint, {
        headers: {
          "User-Agent": CRAWLER_USER_AGENTS.WHATSAPP,
          Accept: "application/json",
        },
        signal: AbortSignal.timeout(4000),
      })

      if (res.ok) {
        return await res.json()
      }
      return null
    } catch {
      return null
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
          if (
            html.includes("og:") ||
            html.includes("<title") ||
            html.includes("twitter:")
          ) {
            return html
          }
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
