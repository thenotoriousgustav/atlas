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

export interface ExtractedMetadata {
  title: string
  description?: string
  imageUrl?: string
}

@Injectable()
export class MetadataService {
  private readonly logger = new Logger(MetadataService.name)

  async extract(url: string): Promise<ExtractedMetadata> {
    try {
      const urlObj = new URL(url)
      const hostname = urlObj.hostname.toLowerCase()

      // Specialized Handler: Reddit
      if (hostname.includes("reddit.com") || hostname.includes("redd.it")) {
        const redditMeta = await this.extractReddit(url, urlObj)
        if (redditMeta && (redditMeta.title || redditMeta.imageUrl)) {
          return redditMeta
        }
      }

      // Specialized Handler: Twitter / X
      if (
        hostname.includes("twitter.com") ||
        hostname.includes("x.com") ||
        hostname.includes("t.co")
      ) {
        const twitterMeta = await this.extractTwitter(url, urlObj)
        if (twitterMeta && (twitterMeta.title || twitterMeta.imageUrl)) {
          return twitterMeta
        }
      }

      // Specialized Handler: Bluesky
      if (hostname.includes("bsky.app")) {
        const bskyMeta = await this.extractBluesky(url, urlObj)
        if (bskyMeta && (bskyMeta.title || bskyMeta.imageUrl)) {
          return bskyMeta
        }
      }

      // General HTML / OpenGraph extraction
      return await this.extractGeneral(url)
    } catch (error) {
      this.logger.warn(
        `Failed to extract metadata for ${url}: ${(error as any).message}`
      )
      return { title: this.getDomain(url) }
    }
  }

  /**
   * Specialized extractor for Reddit posts & subreddits
   */
  private async extractReddit(
    url: string,
    urlObj: URL
  ): Promise<ExtractedMetadata | null> {
    try {
      // 1. Check for Reddit Post ID in URL
      // Examples: /r/indotech/comments/1vwvdhf/kasih_saran.../ or /comments/1vwvdhf or redd.it/1vwvdhf
      const postIdMatch =
        urlObj.pathname.match(/(?:comments|post|preview\/post)\/([a-zA-Z0-9]+)/i) ||
        urlObj.pathname.match(/^\/([a-zA-Z0-9]{5,8})$/i)

      const postId = postIdMatch ? postIdMatch[1] : null

      // If we have a post ID, we can use Reddit's official dynamic social card preview
      let dynamicCardUrl: string | undefined = undefined
      if (postId) {
        dynamicCardUrl = `https://share.redd.it/preview/post/${postId}`
      }

      // 2. Try Reddit oEmbed endpoint for structured title & author
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
            : this.getDomain(url)
          const author = oembedData.author_name
          const provider = oembedData.provider_name || "Reddit"

          let description: string | undefined
          if (author) {
            description = `Posted by u/${author} on ${provider}`
          }

          const imageUrl =
            dynamicCardUrl ||
            (oembedData.thumbnail_url
              ? decodeHtmlEntities(oembedData.thumbnail_url.replace(/&amp;/g, "&"))
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
          // Strip trailing slash & query params, then add .json
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
            Array.isArray(postDataArray) && postDataArray[0]?.data?.children?.[0]?.data
              ? postDataArray[0].data.children[0].data
              : postDataArray?.data?.children?.[0]?.data

          if (post) {
            const subreddit = post.subreddit_name_prefixed || `r/${post.subreddit}`
            const rawTitle = post.title ? `${post.title} : ${subreddit}` : subreddit
            const title = decodeHtmlEntities(rawTitle.trim())
            const description = post.selftext
              ? decodeHtmlEntities(post.selftext.slice(0, 300).trim())
              : `Posted by u/${post.author} in ${subreddit}`

            // Prefer Reddit dynamic preview card, then source image preview, then direct image URL
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
            } else if (!imageUrl && post.thumbnail && post.thumbnail.startsWith("http")) {
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

      // 4. Fallback to scraping HTML with Reddit specific dynamic card
      const general = await this.extractGeneral(url)
      return {
        ...general,
        imageUrl: dynamicCardUrl || general.imageUrl,
      }
    } catch {
      return null
    }
  }

  /**
   * Specialized extractor for Twitter / X posts
   */
  private async extractTwitter(
    url: string,
    urlObj: URL
  ): Promise<ExtractedMetadata | null> {
    try {
      const path = urlObj.pathname

      // 1. Try VxTwitter API
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

      // 3. Try public oEmbed for Twitter
      try {
        const oembedUrl = `https://publish.twitter.com/oembed?url=${encodeURIComponent(url)}`
        const oembedRes = await fetch(oembedUrl, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
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

      return await this.extractGeneral(url)
    } catch {
      return null
    }
  }

  /**
   * Specialized extractor for Bluesky posts
   */
  private async extractBluesky(
    url: string,
    urlObj: URL
  ): Promise<ExtractedMetadata | null> {
    try {
      return await this.extractGeneral(url)
    } catch {
      return null
    }
  }

  /**
   * General HTML and OpenGraph metadata extractor
   */
  private async extractGeneral(url: string): Promise<ExtractedMetadata> {
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

      // Image: og:image -> og:image:url -> og:image:secure_url -> twitter:image -> twitter:image:src -> link[rel=image_src] -> itemprop[image]
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
        `Failed to extract metadata for ${url}: ${(error as any).message}`
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
