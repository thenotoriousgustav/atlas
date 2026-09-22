import { Injectable, Logger } from "@nestjs/common"
import {
  ExtractedMetadata,
  MetadataProvider,
  CRAWLER_USER_AGENTS,
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
            "User-Agent": CRAWLER_USER_AGENTS.WHATSAPP,
            Accept: "application/json",
          },
          signal: AbortSignal.timeout(4000),
        })

        if (vxRes.ok) {
          const vxData = await vxRes.json()
          if (vxData && (vxData.text || vxData.user_name)) {
            const author = vxData.user_name || "X User"
            const handle = vxData.user_screen_name
              ? `@${vxData.user_screen_name}`
              : ""
            const title = `${author} ${handle ? `(${handle}) ` : ""}on X`
            const description = vxData.text
            const imageUrl =
              vxData.mediaURLs?.[0] ||
              vxData.media_extended?.[0]?.url ||
              vxData.media_extended?.[0]?.thumbnail_url ||
              vxData.user_profile_image_url

            return {
              title: decodeHtmlEntities(title.trim()),
              description: description
                ? decodeHtmlEntities(description.trim())
                : undefined,
              imageUrl,
              siteName: "X (Twitter)",
              faviconUrl: "https://abs.twimg.com/favicons/twitter.3.ico",
            }
          }
        }
      } catch (vxErr: any) {
        this.logger.debug(`VxTwitter error for ${url}: ${vxErr.message}`)
      }

      // 2. Try FixupX / FxTwitter API
      try {
        const fxUrl = `https://api.fxtwitter.com${path}`
        const fxRes = await fetch(fxUrl, {
          headers: {
            "User-Agent": CRAWLER_USER_AGENTS.FACEBOOK_EXTERNAL_HIT,
            Accept: "application/json",
          },
          signal: AbortSignal.timeout(4000),
        })

        if (fxRes.ok) {
          const fxData = await fxRes.json()
          const tweet = fxData.tweet
          if (tweet) {
            const author = tweet.author?.name || "X User"
            const handle = tweet.author?.screen_name
              ? `@${tweet.author.screen_name}`
              : ""
            const title = `${author} ${handle ? `(${handle}) ` : ""}on X`
            const description = tweet.text
            const imageUrl =
              tweet.media?.photos?.[0]?.url ||
              tweet.media?.mosaic?.formats?.jpeg ||
              tweet.author?.avatar_url

            return {
              title: decodeHtmlEntities(title.trim()),
              description: description
                ? decodeHtmlEntities(description.trim())
                : undefined,
              imageUrl,
              siteName: "X (Twitter)",
              faviconUrl: "https://abs.twimg.com/favicons/twitter.3.ico",
            }
          }
        }
      } catch (fxErr: any) {
        this.logger.debug(`FxTwitter error for ${url}: ${fxErr.message}`)
      }

      // 3. Fallback to generic extractor with Meta/WhatsApp user-agent
      return await this.genericProvider.extract(url, urlObj)
    } catch {
      return null
    }
  }
}
