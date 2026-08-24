import { Injectable, Logger } from "@nestjs/common"
import {
  ExtractedMetadata,
  MetadataProvider,
} from "../providers/metadata/metadata-provider.interface"
import { RedditMetadataProvider } from "../providers/metadata/reddit.metadata-provider"
import { TwitterMetadataProvider } from "../providers/metadata/twitter.metadata-provider"
import { GenericMetadataProvider } from "../providers/metadata/generic.metadata-provider"

export type { ExtractedMetadata } from "../providers/metadata/metadata-provider.interface"

@Injectable()
export class MetadataService {
  private readonly logger = new Logger(MetadataService.name)
  private readonly specializedProviders: MetadataProvider[]

  constructor(
    private readonly redditProvider: RedditMetadataProvider,
    private readonly twitterProvider: TwitterMetadataProvider,
    private readonly genericProvider: GenericMetadataProvider
  ) {
    // ponytail: register specialized providers in prioritized evaluation order
    this.specializedProviders = [
      this.redditProvider,
      this.twitterProvider,
    ]
  }

  async extract(url: string): Promise<ExtractedMetadata> {
    try {
      const urlObj = new URL(url)

      // 1. Try matching specialized metadata provider
      for (const provider of this.specializedProviders) {
        if (provider.supports(urlObj)) {
          const result = await provider.extract(url, urlObj)
          if (result && (result.title || result.imageUrl)) {
            return result
          }
        }
      }

      // 2. Fallback to generic OpenGraph/HTML metadata provider
      const genericResult = await this.genericProvider.extract(url, urlObj)
      if (genericResult) {
        return genericResult
      }

      return { title: this.getDomain(url) }
    } catch (error) {
      this.logger.warn(
        `Failed to extract metadata for ${url}: ${(error as any).message}`
      )
      return { title: this.getDomain(url) }
    }
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
