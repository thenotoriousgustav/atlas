import { Test, TestingModule } from '@nestjs/testing';
import { BookmarksService } from './bookmarks.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { MetadataService } from '../services/metadata.service';
import { LinkCheckerService } from '../services/link-checker.service';
import { RedditProvider } from '../providers/reddit.provider';
import { getQueueToken } from '@nestjs/bullmq';

describe('BookmarksService - Trash Functionality', () => {
  let service: BookmarksService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      bookmark: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
        delete: jest.fn(),
        deleteMany: jest.fn(),
        groupBy: jest.fn().mockResolvedValue([]),
      },
      folder: {
        findFirst: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookmarksService,
        { provide: PrismaService, useValue: prisma },
        { provide: MetadataService, useValue: { extract: jest.fn() } },
        { provide: LinkCheckerService, useValue: { runScan: jest.fn() } },
        { provide: RedditProvider, useValue: { supports: jest.fn() } },
        { provide: getQueueToken('bookmark-enrichment'), useValue: { add: jest.fn() } },
      ],
    }).compile();

    service = module.get<BookmarksService>(BookmarksService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll with isTrash filter', () => {
    it('should query deletedAt: { not: null } when isTrash is true', async () => {
      prisma.bookmark.findMany.mockResolvedValue([]);
      prisma.bookmark.count.mockResolvedValue(0);

      await service.findAll('user-1', { isTrash: true });

      expect(prisma.bookmark.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: 'user-1',
            deletedAt: { not: null },
          }),
        }),
      );
    });

    it('should query deletedAt: null when isTrash is false or omitted', async () => {
      prisma.bookmark.findMany.mockResolvedValue([]);
      prisma.bookmark.count.mockResolvedValue(0);

      await service.findAll('user-1', {});

      expect(prisma.bookmark.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: 'user-1',
            deletedAt: null,
          }),
        }),
      );
    });
  });

  describe('soft delete via remove', () => {
    it('should set deletedAt to a Date when removing a bookmark', async () => {
      prisma.bookmark.findFirst.mockResolvedValue({ id: 'bm-1', userId: 'user-1' });
      prisma.bookmark.update.mockResolvedValue({ id: 'bm-1', deletedAt: new Date() });

      await service.remove('user-1', 'bm-1');

      expect(prisma.bookmark.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'bm-1' },
          data: expect.objectContaining({
            deletedAt: expect.any(Date),
          }),
        }),
      );
    });
  });

  describe('restore', () => {
    it('should restore a soft-deleted bookmark by setting deletedAt to null', async () => {
      prisma.bookmark.findFirst.mockResolvedValue({
        id: 'bm-1',
        userId: 'user-1',
        deletedAt: new Date(),
        folderId: null,
      });
      prisma.bookmark.update.mockResolvedValue({ id: 'bm-1', deletedAt: null });

      const result = await service.restore('user-1', 'bm-1');

      expect(prisma.bookmark.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'bm-1' },
          data: expect.objectContaining({
            deletedAt: null,
            folderId: null,
          }),
        }),
      );
      expect(result).toBeDefined();
    });

    it('should detach orphaned folderId if parent folder was deleted', async () => {
      prisma.bookmark.findFirst.mockResolvedValue({
        id: 'bm-1',
        userId: 'user-1',
        deletedAt: new Date(),
        folderId: 'folder-deleted',
      });
      prisma.folder.findFirst.mockResolvedValue(null);
      prisma.bookmark.update.mockResolvedValue({ id: 'bm-1', deletedAt: null, folderId: null });

      await service.restore('user-1', 'bm-1');

      expect(prisma.bookmark.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'bm-1' },
          data: expect.objectContaining({
            deletedAt: null,
            folderId: null,
          }),
        }),
      );
    });
  });

  describe('bulkRestore', () => {
    it('should update multiple bookmarks setting deletedAt to null', async () => {
      prisma.bookmark.updateMany.mockResolvedValue({ count: 3 });

      const result = await service.bulkRestore('user-1', ['id-1', 'id-2', 'id-3']);

      expect(prisma.bookmark.updateMany).toHaveBeenCalledWith({
        where: {
          id: { in: ['id-1', 'id-2', 'id-3'] },
          userId: 'user-1',
          deletedAt: { not: null },
        },
        data: {
          deletedAt: null,
        },
      });
      expect(result.restored).toBe(3);
    });
  });

  describe('permanentDelete', () => {
    it('should delete bookmark permanently from database', async () => {
      prisma.bookmark.findFirst.mockResolvedValue({ id: 'bm-1', userId: 'user-1' });
      prisma.bookmark.delete.mockResolvedValue({ id: 'bm-1' });

      await service.permanentDelete('user-1', 'bm-1');

      expect(prisma.bookmark.delete).toHaveBeenCalledWith({
        where: { id: 'bm-1' },
      });
    });
  });

  describe('bulkPermanentDelete', () => {
    it('should delete multiple bookmarks permanently', async () => {
      prisma.bookmark.deleteMany.mockResolvedValue({ count: 2 });

      const result = await service.bulkPermanentDelete('user-1', ['id-1', 'id-2']);

      expect(prisma.bookmark.deleteMany).toHaveBeenCalledWith({
        where: {
          id: { in: ['id-1', 'id-2'] },
          userId: 'user-1',
        },
      });
      expect(result.deleted).toBe(2);
    });
  });

  describe('emptyTrash', () => {
    it('should delete all bookmarks with deletedAt not null for user', async () => {
      prisma.bookmark.deleteMany.mockResolvedValue({ count: 5 });

      const result = await service.emptyTrash('user-1');

      expect(prisma.bookmark.deleteMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-1',
          deletedAt: { not: null },
        },
      });
      expect(result.deleted).toBe(5);
    });
  });

  describe('getHealthSummary', () => {
    it('should include trash count in health summary', async () => {
      prisma.bookmark.count
        .mockResolvedValueOnce(10)
        .mockResolvedValueOnce(1)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(3)
        .mockResolvedValueOnce(2)
        .mockResolvedValueOnce(4);

      const summary = await service.getHealthSummary('user-1');

      expect(summary.total).toBe(10);
      expect(summary.trash).toBe(4);
    });
  });
});
