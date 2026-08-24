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

      // 2. Try Reddit oEmbed endpoint
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

          const description = undefined

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

      // 3. Try Reddit JSON endpoint (.json)
      try {
        let jsonUrl = url
        if (!jsonUrl.includes(".json")) {
          const cleanPath = urlObj.pathname.replace(/\/+$/, "")
          jsonUrl = `https://www.reddit.com${cleanPath}.json?raw_json=1`
        }

        const jsonRes = await fetch(jsonUrl, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (compatible; AtlasCabinetBot/1.0; +https://atlas.app)",
            Accept: "application/json",
          },
          signal: AbortSignal.timeout(4000),
        })

        if (jsonRes.ok) {
          const postDataArray = await jsonRes.json()
          const post =
            Array.isArray(postDataArray) &&
            postDataArray[0]?.data?.children?.[0]?.data
              ? postDataArray[0].data.children[0].data
              : postDataArray?.data?.children?.[0]?.data

          if (post) {
            const subreddit =
              post.subreddit_name_prefixed || `r/${post.subreddit}`
            const rawTitle = post.title
              ? `${post.title} : ${subreddit}`
              : subreddit
            const title = decodeHtmlEntities(rawTitle.trim())
            const description = post.selftext
              ? decodeHtmlEntities(post.selftext.slice(0, 300).trim())
              : undefined

            let imageUrl = dynamicCardUrl
            if (!imageUrl && post.preview?.images?.[0]?.source?.url) {
              imageUrl = decodeHtmlEntities(
                post.preview.images[0].source.url.replace(/&amp;/g, "&")
              )
            } else if (
              !imageUrl &&
              post.url_overridden_by_dest &&
              /\.(jpg|jpeg|png|webp|gif)/i.test(post.url_overridden_by_dest)
            ) {
              imageUrl = post.url_overridden_by_dest
            } else if (
              !imageUrl &&
              post.thumbnail &&
              post.thumbnail.startsWith("http")
            ) {
              imageUrl = post.thumbnail
            }

            return {
              title,
              description,
              imageUrl,
            }
          }
        }
      } catch (jsonErr) {
        this.logger.debug(`Reddit JSON error for ${url}: ${jsonErr}`)
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
