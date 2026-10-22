import { Injectable, Logger } from "@nestjs/common"
import {
  ExtractedMetadata,
} from "@/modules/cabinet/providers/metadata/metadata-provider.interface"
import { GenericMetadataProvider } from "@/modules/cabinet/providers/metadata/generic.metadata-provider"

export type { ExtractedMetadata } from "@/modules/cabinet/providers/metadata/metadata-provider.interface"

@Injectable()
export class MetadataService {
  private readonly logger = new Logger(MetadataService.name)

  constructor(
    private readonly genericProvider: GenericMetadataProvider
  ) {}

  async extract(url: string): Promise<ExtractedMetadata> {
    try {
      new URL(url) // Rejects a malformed address before any request is made.
      const result = await this.genericProvider.extract(url)
      if (result) {
        return result
      }
      return { title: this.getDomain(url), unavailable: true }
    } catch (error) {
      this.logger.warn(
        `Failed to extract metadata for ${url}: ${(error as any).message}`
      )
      return { title: this.getDomain(url), unavailable: true }
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
