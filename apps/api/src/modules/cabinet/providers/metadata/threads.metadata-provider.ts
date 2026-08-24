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
    return host.includes("threads.net") || host.includes("threads.com")
  }

  async extract(url: string, urlObj: URL): Promise<ExtractedMetadata | null> {
    try {
      const pathname = urlObj.pathname

      // Parse structured information from URL path
      let parsedTitle: string | undefined
      let parsedDescription: string | undefined

      const postMatch = pathname.match(
        /^\/@([a-zA-Z0-9_.-]+)\/post\/([a-zA-Z0-9_.-]+)/i
      )
      const userMatch = pathname.match(/^\/@([a-zA-Z0-9_.-]+)/i)
      const shortPostMatch = pathname.match(/^\/t\/([a-zA-Z0-9_.-]+)/i)

      if (postMatch) {
        const username = postMatch[1]
        parsedTitle = `Post by @${username} on Threads`
        parsedDescription = `View thread by @${username} on Threads`
      } else if (userMatch) {
        const username = userMatch[1]
        parsedTitle = `@${username} on Threads`
        parsedDescription = `Threads profile of @${username}`
      } else if (shortPostMatch) {
        const postId = shortPostMatch[1]
        parsedTitle = `Thread (${postId}) on Threads`
        parsedDescription = `View thread on Threads`
      } else {
        parsedTitle = "Threads"
        parsedDescription =
          "Say more with Threads — Instagram's text-based conversation app"
      }

      // 1. Try generic OpenGraph extraction
      const general = await this.genericProvider.extract(url, urlObj)

      const isGenericTitle =
        !general?.title ||
        general.title.toLowerCase() === "threads" ||
        general.title.toLowerCase().includes("threads.com") ||
        general.title.toLowerCase().includes("threads.net")

      const finalTitle =
        !isGenericTitle && general?.title
          ? general.title
          : parsedTitle || "Threads"

      const finalDescription =
        general?.description && general.description !== "Threads"
          ? general.description
          : parsedDescription

      return {
        title: decodeHtmlEntities(finalTitle.trim()),
        description: finalDescription
          ? decodeHtmlEntities(finalDescription.trim())
          : undefined,
        imageUrl: general?.imageUrl,
      }
    } catch (error) {
      this.logger.warn(
        `Failed to extract Threads metadata for ${url}: ${(error as any).message}`
      )
      return {
        title: "Threads",
      }
    }
  }
}
