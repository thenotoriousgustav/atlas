import { Injectable, Logger } from "@nestjs/common"
import {
  ExtractedMetadata,
  MetadataProvider,
  decodeHtmlEntities,
} from "./metadata-provider.interface"
import { GenericMetadataProvider } from "./generic.metadata-provider"

@Injectable()
export class TwitterMetadataProvider implements MetadataProvider {
  private readonly logger = new Logger(TwitterMetadataProvider.name)

  constructor(private readonly genericProvider: GenericMetadataProvider) {}

  supports(url: URL): boolean {
    const host = url.hostname.toLowerCase()
    return (
      host === "twitter.com" ||
      host === "www.twitter.com" ||
      host === "x.com" ||
      host === "www.x.com" ||
      host === "t.co"
    )
  }

  async extract(url: string, urlObj: URL): Promise<ExtractedMetadata | null> {
    try {
      const path = urlObj.pathname

      // 1. Try VxTwitter API for full tweet metadata & media
      try {
        const vxUrl = `https://api.vxtwitter.com${path}`
        const vxRes = await fetch(vxUrl, {
          headers: {
            "User-Agent": "Mozilla/5.0 (compatible; AtlasCabinetBot/1.0)",
          },
          signal: AbortSignal.timeout(4000),
        })

        if (vxRes.ok) {
          const vxData = await vxRes.json()
          if (vxData && (vxData.text || vxData.user_name)) {
            const author = vxData.user_name || "X User"
            const handle = vxData.user_screen_name ? `@${vxData.user_screen_name}` : ""
            const title = `${author} ${handle ? `(${handle}) ` : ""}on X`
            const description = vxData.text
            const imageUrl =
              vxData.mediaURLs?.[0] ||
              vxData.media_extended?.[0]?.url ||
              vxData.media_extended?.[0]?.thumbnail_url ||
              vxData.user_profile_image_url

            return {
              title: decodeHtmlEntities(title.trim()),
              description: description ? decodeHtmlEntities(description.trim()) : undefined,
              imageUrl,
            }
          }
        }
      } catch (vxErr) {
        this.logger.debug(`VxTwitter error for ${url}: ${vxErr}`)
      }

      // 2. Try FixupX / FxTwitter API
      try {
        const fxUrl = `https://api.fxtwitter.com${path}`
        const fxRes = await fetch(fxUrl, {
          signal: AbortSignal.timeout(4000),
        })

        if (fxRes.ok) {
          const fxData = await fxRes.json()
          const tweet = fxData.tweet
          if (tweet) {
            const author = tweet.author?.name || "X User"
            const handle = tweet.author?.screen_name ? `@${tweet.author.screen_name}` : ""
            const title = `${author} ${handle ? `(${handle}) ` : ""}on X`
            const description = tweet.text
            const imageUrl =
              tweet.media?.photos?.[0]?.url ||
              tweet.media?.mosaic?.formats?.jpeg ||
              tweet.author?.avatar_url

            return {
              title: decodeHtmlEntities(title.trim()),
              description: description ? decodeHtmlEntities(description.trim()) : undefined,
              imageUrl,
            }
          }
        }
      } catch (fxErr) {
        this.logger.debug(`FxTwitter error for ${url}: ${fxErr}`)
      }

      // 3. Try Twitter oEmbed
      try {
        const oembedUrl = `https://publish.twitter.com/oembed?url=${encodeURIComponent(url)}`
        const oembedRes = await fetch(oembedUrl, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          },
          signal: AbortSignal.timeout(4000),
        })

        if (oembedRes.ok) {
          const data = await oembedRes.json()
          const htmlSnippet = data.html || ""
          const textMatch = htmlSnippet.match(/<p[^>]*>([\s\S]*?)<\/p>/i)?.[1]
          const cleanText = textMatch
            ? decodeHtmlEntities(textMatch.replace(/<[^>]+>/g, "").trim())
            : undefined

          const authorName = data.author_name || "X Post"
          return {
            title: `${authorName} on X`,
            description: cleanText,
            imageUrl: undefined,
          }
        }
      } catch (oembedErr) {
        this.logger.debug(`Twitter oEmbed error for ${url}: ${oembedErr}`)
      }

      return await this.genericProvider.extract(url, urlObj)
    } catch {
      return null
    }
  }
}
