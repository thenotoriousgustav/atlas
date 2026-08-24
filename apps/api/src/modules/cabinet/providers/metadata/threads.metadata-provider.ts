import { Injectable, Logger } from "@nestjs/common"
import {
  ExtractedMetadata,
  MetadataProvider,
  decodeHtmlEntities,
} from "./metadata-provider.interface"
import { GenericMetadataProvider } from "./generic.metadata-provider"

@Injectable()
export class ThreadsMetadataProvider implements MetadataProvider {
  private readonly logger = new Logger(ThreadsMetadataProvider.name)

  constructor(private readonly genericProvider: GenericMetadataProvider) {}

  supports(url: URL): boolean {
    const host = url.hostname.toLowerCase()
    return (
      host === "threads.net" ||
      host === "www.threads.net" ||
      host === "threads.com" ||
      host === "www.threads.com"
    )
  }

  async extract(url: string, urlObj: URL): Promise<ExtractedMetadata | null> {
    try {
      const pathname = urlObj.pathname

      // Parse structured information from URL path
      const postMatch = pathname.match(
        /^\/@([a-zA-Z0-9_.-]+)\/post\/([a-zA-Z0-9_.-]+)/i
      )
      const userMatch = pathname.match(/^\/@([a-zA-Z0-9_.-]+)/i)
      const shortPostMatch = pathname.match(/^\/t\/([a-zA-Z0-9_.-]+)/i)

      const username = postMatch ? postMatch[1] : userMatch ? userMatch[1] : null
      const postId = postMatch ? postMatch[2] : shortPostMatch ? shortPostMatch[1] : null

      // 1. Try generic OpenGraph extraction
      const general = await this.genericProvider.extract(url, urlObj)

      let extractedText: string | undefined = undefined

      // Filter out generic Threads login/welcome placeholders
      const genericPlaceholders = [
        "join threads to share ideas",
        "log in to threads",
        "say more with threads",
        "threads • log in",
        "threads. log in",
        "threads •",
        "threads.",
      ]

      const isGeneric = (str?: string) => {
        if (!str) return true
        const trimmed = str.trim().toLowerCase()
        if (
          trimmed === "threads" ||
          trimmed === "threads.net" ||
          trimmed === "threads.com"
        ) {
          return true
        }
        return genericPlaceholders.some((g) => trimmed.includes(g))
      }

      if (general?.description && !isGeneric(general.description)) {
        extractedText = general.description
      } else if (general?.title && !isGeneric(general.title)) {
        extractedText = general.title
      }

      // Check image (filter out default login banner asset if generic)
      let imageUrl = general?.imageUrl
      if (imageUrl && (imageUrl.includes("kHwIMM5b8PW") || imageUrl.includes("login"))) {
        imageUrl = undefined
      }

      // Normalization:
      // Threads does not have formal article titles; its core payload is `text`.
      // We normalize `title` and `description` from `text`.
      if (extractedText) {
        const cleanText = decodeHtmlEntities(extractedText.trim())
        // Title: first sentence or clean concise snippet up to 120 characters
        let title = cleanText
        if (title.length > 120) {
          const firstSentence = title.split(/[.!?\n]/)[0]?.trim()
          title =
            firstSentence && firstSentence.length >= 20 && firstSentence.length <= 120
              ? firstSentence
              : `${title.slice(0, 117)}...`
        }

        const authorSuffix = username ? `• @${username} on Threads` : "• Threads"

        return {
          title,
          description: `${cleanText} ${authorSuffix}`,
          imageUrl,
        }
      }

      // 2. Structured fallback based on parsed URL metadata if behind login wall
      if (username && postId) {
        return {
          title: `Post by @${username} on Threads`,
          description: `View thread by @${username} on Threads`,
          imageUrl,
        }
      }

      if (username) {
        return {
          title: `@${username} on Threads`,
          description: `Threads profile of @${username}`,
          imageUrl,
        }
      }

      return {
        title: general?.title && !isGeneric(general.title) ? general.title : "Threads",
        description:
          general?.description && !isGeneric(general.description)
            ? general.description
            : "Threads post",
        imageUrl,
      }
    } catch (error: any) {
      this.logger.warn(`Failed to extract Threads metadata for ${url}: ${error.message}`)
      return null
    }
  }
}
