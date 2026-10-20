import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { MetadataStatus } from '@prisma/client';
import { Job } from 'bullmq';
import { bookmarkSortFields } from '@/modules/cabinet/bookmarks/bookmark-order';
import { PrismaService } from '@/prisma/prisma.service';
import { MetadataService } from '@/modules/cabinet/services/metadata.service';

export interface EnrichmentJobData {
  bookmarkId: string;
  url: string;
}

@Processor('bookmark-enrichment')
export class EnrichmentProcessor extends WorkerHost {
  private readonly logger = new Logger(EnrichmentProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly metadataService: MetadataService,
  ) {
    super();
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
      this.logger.log(`Extracting generic OpenGraph metadata for ${url} via MetadataService`);
      const extracted = await this.metadataService.extract(url);

      await this.prisma.bookmark.update({
        where: { id: bookmarkId },
        data: {
          title: extracted.title || bookmark.title,
          ...bookmarkSortFields({ title: extracted.title || bookmark.title }),
          description: extracted.description || bookmark.description,
          imageUrl: extracted.imageUrl || bookmark.imageUrl,
          faviconUrl: extracted.faviconUrl || bookmark.faviconUrl,
          siteName: extracted.siteName || bookmark.siteName,
          metadataStatus: MetadataStatus.COMPLETED,
          metadataError: null,
          lastEnrichedAt: new Date(),
        },
      });
      this.logger.log(`Successfully enriched bookmark ${bookmarkId} via MetadataService`);

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
