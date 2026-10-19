import { MetadataStatus } from '@prisma/client';
import { Job } from 'bullmq';
import { PrismaService } from '../../../prisma/prisma.service';
import { MetadataService } from '../services/metadata.service';
import { EnrichmentJobData, EnrichmentProcessor } from './enrichment.processor';

describe('EnrichmentProcessor', () => {
  it('uses generic metadata for Reddit bookmarks', async () => {
    const url = 'https://www.reddit.com/r/mac/comments/abc123/post/';
    const prisma = {
      bookmark: {
        findUnique: jest.fn().mockResolvedValue({ id: 'bm-1', title: 'Old title' }),
        update: jest.fn().mockResolvedValue({}),
      },
      bookmarkArticle: { upsert: jest.fn() },
    };
    const metadataService = {
      extract: jest.fn().mockResolvedValue({
        title: 'Post title',
        description: 'Post description',
        imageUrl: 'https://example.com/image.jpg',
        siteName: 'Reddit',
      }),
    };
    const processor = new EnrichmentProcessor(
      prisma as unknown as PrismaService,
      metadataService as unknown as MetadataService,
    );

    await processor.process({
      id: 'job-1',
      data: { bookmarkId: 'bm-1', url },
    } as Job<EnrichmentJobData>);

    expect(metadataService.extract).toHaveBeenCalledWith(url);
    expect(prisma.bookmarkArticle.upsert).not.toHaveBeenCalled();
    expect(prisma.bookmark.update).toHaveBeenLastCalledWith({
      where: { id: 'bm-1' },
      data: {
        title: 'Post title',
        description: 'Post description',
        imageUrl: 'https://example.com/image.jpg',
        faviconUrl: undefined,
        siteName: 'Reddit',
        metadataStatus: MetadataStatus.COMPLETED,
        metadataError: null,
        lastEnrichedAt: expect.any(Date),
      },
    });
  });
});
