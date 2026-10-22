import { MetadataStatus } from '@prisma/client';
import { Job } from 'bullmq';
import { PrismaService } from '@/prisma/prisma.service';
import { MetadataService } from '@/modules/cabinet/services/metadata.service';
import { EnrichmentJobData, EnrichmentProcessor } from './enrichment.processor';

describe('EnrichmentProcessor', () => {
  it('uses generic metadata for Reddit bookmarks', async () => {
    const url = 'https://www.reddit.com/r/mac/comments/abc123/post/';
    const prisma = {
      bookmark: {
        findUnique: jest.fn().mockResolvedValue({ id: 'bm-1', title: 'Old title' }),
        update: jest.fn().mockResolvedValue({}),
      },
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
    expect(prisma.bookmark.update).toHaveBeenLastCalledWith({
      where: { id: 'bm-1' },
      data: {
        title: 'Post title',
        sortTitle: 'post title',
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

  it('keeps existing metadata when the website blocks the request', async () => {
    const prisma = {
      bookmark: {
        findUnique: jest.fn().mockResolvedValue({ id: 'bm-2', title: 'Tiptap vs Lexical' }),
        update: jest.fn().mockResolvedValue({}),
      },
    };
    const metadataService = {
      extract: jest.fn().mockResolvedValue({ title: 'medium.com', unavailable: true }),
    };
    const processor = new EnrichmentProcessor(
      prisma as unknown as PrismaService,
      metadataService as unknown as MetadataService,
    );

    await processor.process({
      id: 'job-2',
      data: { bookmarkId: 'bm-2', url: 'https://medium.com/@a/post' },
    } as Job<EnrichmentJobData>);

    expect(prisma.bookmark.update).toHaveBeenLastCalledWith({
      where: { id: 'bm-2' },
      data: {
        metadataStatus: MetadataStatus.FAILED,
        metadataError: expect.any(String),
        lastEnrichedAt: expect.any(Date),
      },
    });
  });
});
