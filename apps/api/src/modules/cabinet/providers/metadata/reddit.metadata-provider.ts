import { Injectable, Logger } from "@nestjs/common"
import {
  ExtractedMetadata,
  MetadataProvider,
  CRAWLER_USER_AGENTS,
  decodeHtmlEntities,
} from "./metadata-provider.interface"
import { GenericMetadataProvider } from "./generic.metadata-provider"

@Injectable()
export class RedditMetadataProvider implements MetadataProvider {
  private readonly logger = new Logger(RedditMetadataProvider.name)

  constructor(private readonly genericProvider: GenericMetadataProvider) {}

  supports(url: URL): boolean {
    const host = url.hostname.toLowerCase()
    return (
      host === "reddit.com" ||
      host === "www.reddit.com" ||
      host === "old.reddit.com" ||
      host === "m.reddit.com" ||
      host === "redd.it" ||
      host === "share.redd.it"
    )
  }

  async extract(url: string, urlObj: URL): Promise<ExtractedMetadata | null> {
    try {
      // 1. Extract Post ID & Subreddit from URL path
      const postMatch = urlObj.pathname.match(
        /\/r\/([^/]+)\/comments\/([a-zA-Z0-9]+)/i
      )
      const shortMatch = urlObj.pathname.match(/^\/([a-zA-Z0-9]{5,8})$/i)

      const subreddit = postMatch ? postMatch[1] : undefined
      const postId = postMatch ? postMatch[2] : shortMatch ? shortMatch[1] : null

      // 2. Reddit's Dynamic Social Image Card Generator
      // Reddit renders a dynamic white card with subreddit icon, title, snippet, upvotes, and comments
      // at https://share.redd.it/preview/post/${postId}
      let dynamicCardUrl: string | undefined = undefined
      if (postId) {
        dynamicCardUrl = `https://share.redd.it/preview/post/${postId}`
      }

      // 3. Fetch title and author via Reddit oEmbed endpoint
      let title: string | undefined = undefined
      let description: string | undefined = undefined

      try {
        const oembedUrl = `https://www.reddit.com/oembed?url=${encodeURIComponent(url)}`
        const oembedRes = await fetch(oembedUrl, {
          headers: {
            "User-Agent": CRAWLER_USER_AGENTS.WHATSAPP,
            Accept: "application/json",
          },
          signal: AbortSignal.timeout(4000),
        })

        if (oembedRes.ok) {
          const oembedData = await oembedRes.json()
          if (oembedData.title) {
            title = decodeHtmlEntities(oembedData.title.trim())
          }
          if (oembedData.author_name) {
            description = `Posted by u/${oembedData.author_name}${
              subreddit ? ` in r/${subreddit}` : ""
            }`
          }
        }
      } catch (oembedErr: any) {
        this.logger.debug(`Reddit oEmbed error for ${url}: ${oembedErr.message}`)
      }

      // 4. Fallback title from URL slug if oembed was blocked
      if (!title) {
        const pathParts = urlObj.pathname.split("/").filter(Boolean)
        if (pathParts.length >= 4) {
          const slug = pathParts[3]
            .replace(/[_-]+/g, " ")
            .replace(/\b\w/g, (c) => c.toUpperCase())
          title = `${slug}${subreddit ? ` : r/${subreddit}` : ""}`
        } else if (subreddit) {
          title = `Reddit Post in r/${subreddit}`
        } else {
          title = "Reddit Post"
        }
      }

      return {
        title: title || "Reddit Post",
        description,
        imageUrl: dynamicCardUrl,
        siteName: "Reddit",
        faviconUrl:
          "https://www.redditstatic.com/shreddit/assets/favicon/192x192.png",
      }
    } catch (err: any) {
      this.logger.warn(`Reddit metadata extraction failed for ${url}: ${err.message}`)
      return this.genericProvider.extract(url, urlObj)
    }
  }
}
