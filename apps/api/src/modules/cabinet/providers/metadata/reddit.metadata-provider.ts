import { Injectable, Logger } from "@nestjs/common"
import {
  ExtractedMetadata,
  MetadataProvider,
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
      // 1. Check for Reddit Post ID in URL
      const postIdMatch =
        urlObj.pathname.match(
          /(?:comments|post|preview\/post)\/([a-zA-Z0-9]+)/i
        ) || urlObj.pathname.match(/^\/([a-zA-Z0-9]{5,8})$/i)

      const postId = postIdMatch ? postIdMatch[1] : null

      // If we have a post ID, use Reddit's official dynamic social preview card
      let dynamicCardUrl: string | undefined = undefined
      if (postId) {
        dynamicCardUrl = `https://share.redd.it/preview/post/${postId}`
      }

      // 2. Try Reddit RSS Atom Feed (.rss) to extract full post selftext description & title
      try {
        const cleanPath = urlObj.pathname.replace(/\/+$/, "")
        const rssUrl = `https://www.reddit.com${cleanPath}/.rss`
        const rssRes = await fetch(rssUrl, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            Accept: "application/atom+xml,text/xml,application/xml,*/*",
          },
          signal: AbortSignal.timeout(4000),
        })

        if (rssRes.ok) {
          const xml = await rssRes.text()
          const entryMatch = xml.match(/<entry>([\s\S]*?)<\/entry>/i)
          if (entryMatch) {
            const entry = entryMatch[1]
            const rawPostTitle = entry.match(/<title>([^<]+)<\/title>/i)?.[1]
            const author = entry.match(/<author>\s*<name>([^<]+)<\/name>/i)?.[1]
            const rawContent = entry.match(
              /<content[^>]*>([\s\S]*?)<\/content>/i
            )?.[1]

            if (rawPostTitle) {
              const title = decodeHtmlEntities(rawPostTitle.trim())
              let description: string | undefined = undefined

              if (rawContent) {
                const decodedContent = decodeHtmlEntities(rawContent)
                const mdMatch =
                  decodedContent.match(
                    /<!-- SC_OFF -->([\s\S]*?)<!-- SC_ON -->/i
                  ) ||
                  decodedContent.match(/<div class="md">([\s\S]*?)<\/div>/i)

                if (mdMatch) {
                  const cleanMd = mdMatch[1]
                    .replace(/<[^>]+>/g, " ")
                    .replace(/\s+/g, " ")
                    .trim()
                  if (cleanMd) {
                    description = cleanMd
                  }
                }
              }

              if (!description && author) {
                description = `Posted by ${author} on Reddit`
              }

              const mediaThumbnail =
                entry.match(
                  /<media:thumbnail[^>]+url=["']([^"']+)["']/i
                )?.[1] ||
                entry.match(
                  /<link[^>]+rel=["']enclosure["'][^>]+href=["']([^"']+)["']/i
                )?.[1]

              return {
                title,
                description,
                imageUrl: mediaThumbnail
                  ? decodeHtmlEntities(mediaThumbnail)
                  : dynamicCardUrl,
              }
            }
          }
        }
      } catch (rssErr) {
        this.logger.debug(`Reddit RSS error for ${url}: ${rssErr}`)
      }

      // 3. Try Reddit oEmbed endpoint
      try {
        const oembedUrl = `https://www.reddit.com/oembed?url=${encodeURIComponent(url)}`
        const oembedRes = await fetch(oembedUrl, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          },
          signal: AbortSignal.timeout(4000),
        })

        if (oembedRes.ok) {
          const oembedData = await oembedRes.json()
          const title = oembedData.title
            ? decodeHtmlEntities(oembedData.title.trim())
            : urlObj.hostname
          const author = oembedData.author_name
          const provider = oembedData.provider_name || "Reddit"

          let description: string | undefined
          if (author) {
            description = `Posted by u/${author} on ${provider}`
          }

          const imageUrl =
            dynamicCardUrl ||
            (oembedData.thumbnail_url
              ? decodeHtmlEntities(
                  oembedData.thumbnail_url.replace(/&amp;/g, "&")
                )
              : undefined)

          return {
            title,
            description,
            imageUrl,
          }
        }
      } catch (oembedErr) {
        this.logger.debug(`Reddit oEmbed error for ${url}: ${oembedErr}`)
      }

      // 4. Fallback to generic extractor with dynamic Reddit card
      const general = await this.genericProvider.extract(url, urlObj)
      if (general) {
        return {
          ...general,
          imageUrl: dynamicCardUrl || general.imageUrl,
        }
      }
      return null
    } catch {
      return null
    }
  }
}
