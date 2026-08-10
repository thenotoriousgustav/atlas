import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { MetadataStatus } from '@prisma/client';
import { Job } from 'bullmq';
import { PrismaService } from '../../../prisma/prisma.service';
import { RedditProvider } from '../providers/reddit.provider';
import { BookmarkEnrichmentProvider } from '../providers/enrichment-provider.interface';

export interface EnrichmentJobData {
  bookmarkId: string;
  url: string;
}

@Processor('bookmark-enrichment')
export class EnrichmentProcessor extends WorkerHost {
  private readonly logger = new Logger(EnrichmentProcessor.name);
  private readonly providers: BookmarkEnrichmentProvider[];

  constructor(
    private readonly prisma: PrismaService,
    private readonly redditProvider: RedditProvider,
  ) {
    super();
    // ponytail: register providers array cleanly for extensible provider matching
    this.providers = [this.redditProvider];
  }

  async process(job: Job<EnrichmentJobData>): Promise<void> {
    const { bookmarkId, url } = job.data;
    this.logger.log(`Processing enrichment job ${job.id} for bookmark ${bookmarkId}`);

    const bookmark = await this.prisma.bookmark.findUnique({
      where: { id: bookmarkId },
    });

    if (!bookmark || bookmark.deletedAt) {
      this.logger.warn(`Bookmark ${bookmarkId} not found or deleted. Skipping enrichment.`);
      return;
    }

    await this.prisma.bookmark.update({
      where: { id: bookmarkId },
      data: { metadataStatus: MetadataStatus.PROCESSING },
    });

    try {
      const parsedUrl = new URL(url);
      const provider = this.providers.find((p) => p.supports(parsedUrl));

      if (!provider) {
        this.logger.log(`No specialized provider for ${url}. Marking generic enrichment completed.`);
        await this.prisma.bookmark.update({
          where: { id: bookmarkId },
          data: {
            metadataStatus: MetadataStatus.COMPLETED,
            lastEnrichedAt: new Date(),
          },
        });
        return;
      }

      const result = await provider.enrich({ url: parsedUrl, rawUrl: url });

      await this.prisma.bookmark.update({
        where: { id: bookmarkId },
        data: {
          provider: result.provider,
          contentType: result.contentType,
          title: result.title || bookmark.title,
          description: result.description || bookmark.description,
          imageUrl: result.imageUrl || bookmark.imageUrl,
          faviconUrl: result.faviconUrl,
          siteName: result.siteName,
          canonicalUrl: result.canonicalUrl,
          metadata: result.metadata,
          metadataStatus: MetadataStatus.COMPLETED,
          metadataError: null,
          lastEnrichedAt: new Date(),
        },
      });

      this.logger.log(`Successfully enriched bookmark ${bookmarkId} via ${provider.name}`);
    } catch (error: any) {
      this.logger.error(`Enrichment failed for bookmark ${bookmarkId}: ${error.message}`, error.stack);
      await this.prisma.bookmark.update({
        where: { id: bookmarkId },
        data: {
          metadataStatus: MetadataStatus.FAILED,
          metadataError: error.message || 'Unknown enrichment error',
        },
      });
      throw error;
    }
  }
}
