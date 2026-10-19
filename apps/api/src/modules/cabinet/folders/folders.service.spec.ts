import { NotFoundException } from '@nestjs/common';
import { FoldersService } from './folders.service';

describe('FoldersService - shared collections', () => {
  let service: FoldersService;
  let prisma: any;

  beforeEach(() => {
    prisma = {
      folder: {
        findFirst: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
      bookmark: {
        findMany: jest.fn().mockResolvedValue([]),
        updateMany: jest.fn(),
      },
      $transaction: jest.fn((fn) => fn(prisma)),
    };
    service = new FoldersService(prisma);
  });

  it('creates an unguessable hex token and keeps an existing token stable', async () => {
    let token: string | null = null;
    prisma.folder.updateMany.mockImplementation(async ({ data }: any) => {
      if (!token) token = data.shareToken;
      return { count: 1 };
    });
    prisma.folder.findFirst.mockImplementation(async () => ({ shareToken: token }));

    const first = await service.enableShare('user-1', 'folder-1');
    const second = await service.enableShare('user-1', 'folder-1');

    expect(first.shareToken).toMatch(/^[a-f0-9]{64}$/);
    expect(second.shareToken).toBe(first.shareToken);
    expect(prisma.folder.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'folder-1', userId: 'user-1', deletedAt: null, shareToken: null },
      }),
    );
  });

  it('revokes sharing and rejects non-owners', async () => {
    prisma.folder.updateMany.mockResolvedValueOnce({ count: 1 }).mockResolvedValueOnce({ count: 0 });

    await expect(service.disableShare('user-1', 'folder-1')).resolves.toEqual({ shareToken: null });
    await expect(service.disableShare('other-user', 'folder-1')).rejects.toThrow(NotFoundException);
  });

  it('returns only allowlisted public bookmark fields for active direct bookmarks', async () => {
    const token = 'a'.repeat(64);
    prisma.folder.findFirst.mockResolvedValue({ id: 'folder-1', userId: 'user-1', name: 'Refs' });
    prisma.bookmark.findMany.mockResolvedValue([
      {
        id: 'bookmark-1',
        url: 'https://example.com',
        title: 'Example',
        description: 'Public description',
        imageUrl: 'https://example.com/og.png',
      },
    ]);

    await expect(service.findShared(token)).resolves.toEqual({
      name: 'Refs',
      bookmarks: [
        {
          id: 'bookmark-1',
          url: 'https://example.com',
          title: 'Example',
          description: 'Public description',
          imageUrl: 'https://example.com/og.png',
        },
      ],
    });
    expect(prisma.bookmark.findMany).toHaveBeenCalledWith({
      where: {
        folderId: 'folder-1',
        userId: 'user-1',
        type: 'BOOKMARK',
        url: { not: null },
        deletedAt: null,
        isArchived: false,
      },
      select: { id: true, url: true, title: true, description: true, imageUrl: true },
      orderBy: [{ position: 'asc' }, { createdAt: 'desc' }, { id: 'asc' }],
    });
  });

  it('rejects malformed or unknown share tokens and clears tokens on delete', async () => {
    await expect(service.findShared('short-token')).rejects.toThrow(NotFoundException);
    prisma.folder.findFirst.mockResolvedValueOnce(null);
    await expect(service.findShared('b'.repeat(64))).rejects.toThrow(NotFoundException);

    prisma.folder.findFirst.mockResolvedValueOnce({ id: 'folder-1', userId: 'user-1', bookmarks: [] });
    await service.remove('user-1', 'folder-1');
    expect(prisma.folder.update).toHaveBeenCalledWith({
      where: { id: 'folder-1' },
      data: expect.objectContaining({ shareToken: null }),
    });
  });
});
