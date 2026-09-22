import { Injectable, Logger } from "@nestjs/common"
import {
  ExtractedMetadata,
} from "../providers/metadata/metadata-provider.interface"
import { GenericMetadataProvider } from "../providers/metadata/generic.metadata-provider"

export type { ExtractedMetadata } from "../providers/metadata/metadata-provider.interface"

@Injectable()
export class MetadataService {
  private readonly logger = new Logger(MetadataService.name)

  constructor(
    private readonly genericProvider: GenericMetadataProvider
  ) {}

  async extract(url: string): Promise<ExtractedMetadata> {
    try {
      const urlObj = new URL(url)
      const result = await this.genericProvider.extract(url, urlObj)
      if (result) {
        return result
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
