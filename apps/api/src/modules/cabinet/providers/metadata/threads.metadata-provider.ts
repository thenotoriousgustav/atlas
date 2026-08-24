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
    return host === "threads.net" || host === "www.threads.net"
  }

  async extract(url: string, urlObj: URL): Promise<ExtractedMetadata | null> {
    try {
      // 1. Try FixupThreads / FxThreads API
      try {
        const fxUrl = `https://api.fxthreads.net${urlObj.pathname}`
        const fxRes = await fetch(fxUrl, {
          signal: AbortSignal.timeout(4000),
        })

        if (fxRes.ok) {
          const data = await fxRes.json()
          if (data && (data.text || data.author)) {
            const author = data.author?.name || data.author?.username || "Threads User"
            const handle = data.author?.username ? `@${data.author.username}` : ""
            const title = `${author} ${handle ? `(${handle}) ` : ""}on Threads`
            const description = data.text
            const imageUrl =
              data.media?.photos?.[0]?.url ||
              data.media?.videos?.[0]?.thumbnail_url ||
              data.author?.avatar_url

            return {
              title: decodeHtmlEntities(title.trim()),
              description: description ? decodeHtmlEntities(description.trim()) : undefined,
              imageUrl,
            }
          }
        }
      } catch (fxErr) {
        this.logger.debug(`FxThreads error for ${url}: ${fxErr}`)
      }

      // 2. Fallback to OpenGraph extraction via Generic Provider
      const general = await this.genericProvider.extract(url, urlObj)
      if (general) {
        return general
      }
      return null
    } catch {
      return null
    }
  }
}
