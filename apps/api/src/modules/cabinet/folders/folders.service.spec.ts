import { NotFoundException } from '@nestjs/common';
import { FoldersService } from './folders.service';
import { FoldersController } from './folders.controller';
import { IS_PUBLIC_KEY } from '@/common/decorators/public.decorator';

jest.mock('@/auth/guards/auth.guard', () => ({ AuthGuard: class AuthGuard {} }));

describe('FoldersService - shared collections', () => {
  let service: FoldersService;
  let prisma: any;

  beforeEach(() => {
    prisma = {
      folder: {
        findFirst: jest.fn(),
        create: jest.fn().mockResolvedValue({ id: 'copy-folder' }),
        findMany: jest.fn().mockResolvedValue([]),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
      bookmark: {
        findMany: jest.fn().mockResolvedValue([]),
        createMany: jest.fn(),
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
    const links = [
      {
        id: 'bookmark-1',
        url: 'https://example.com',
        title: 'Example',
        description: 'Public description',
        imageUrl: 'https://example.com/og.png',
      },
    ];
    prisma.bookmark.findMany.mockImplementation(({ where }: any) =>
      Promise.resolve(where.type === 'NOTE' ? [{ id: 'note-1', title: 'Plan', notes: 'Shared text' }]
        : where.type === 'DRAWING' ? [{ id: 'd-1', title: 'Flow', imageUrl: 'data:image/png;base64,AAAA' }, { id: 'd-2', title: 'Raw', imageUrl: 'https://tracker.example/x.png' }]
        : links));

    await expect(service.findShared(token)).resolves.toEqual({
      name: 'Refs',
      notes: [{ id: 'note-1', title: 'Plan', text: 'Shared text' }],
      // Only an embedded preview is served; any other address is dropped.
      drawings: [{ id: 'd-1', title: 'Flow', preview: 'data:image/png;base64,AAAA' }, { id: 'd-2', title: 'Raw', preview: null }],
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
      orderBy: [{ isPinned: 'desc' }, { position: 'asc' }, { createdAt: 'desc' }, { id: 'asc' }],
    });
    // Notes share their title and text only: no document, tags, or personal fields.
    expect(prisma.bookmark.findMany).toHaveBeenCalledWith({
      where: { folderId: 'folder-1', userId: 'user-1', type: 'NOTE', deletedAt: null, isArchived: false },
      select: { id: true, title: true, notes: true },
      orderBy: [{ isPinned: 'desc' }, { position: 'asc' }, { createdAt: 'desc' }, { id: 'asc' }],
    });
  });

  it('requires authentication for copy while leaving the view public', () => {
    expect(Reflect.getMetadata(IS_PUBLIC_KEY, FoldersController.prototype.findShared)).toBe(true);
    expect(Reflect.getMetadata(IS_PUBLIC_KEY, FoldersController.prototype.copyShared)).not.toBe(true);
  });

  it('copies only public bookmark fields into a private folder owned by the requester', async () => {
    prisma.folder.findFirst.mockResolvedValue({ id: 'source', userId: 'owner', name: 'Design' });
    const links = [
      { id: 'one', url: 'https://www.example.com/one', title: 'One', description: 'Public', imageUrl: null, notes: 'secret', tags: ['private'], isPinned: true },
      { id: 'two', url: 'https://example.com/two', title: 'Two', description: null, imageUrl: 'https://example.com/two.png' },
      { id: 'unsafe', url: 'javascript:alert(1)', title: 'Unsafe' },
    ];
    prisma.bookmark.findMany.mockImplementation(({ where }: any) => Promise.resolve(where.type === 'BOOKMARK' ? links : []));
    await expect(service.copyShared('requester', 'a'.repeat(64))).resolves.toEqual({ folderId: 'copy-folder', copied: 2 });
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(prisma.folder.create).toHaveBeenCalledWith({ data: { name: 'Design (Copy)', userId: 'requester' }, select: { id: true } });
    expect(prisma.bookmark.findMany.mock.calls[1][0].where).toMatchObject({ userId: 'owner', folderId: 'source', type: 'BOOKMARK', deletedAt: null, isArchived: false });
    expect(prisma.bookmark.createMany).toHaveBeenCalledWith({ data: [
      { userId: 'requester', folderId: 'copy-folder', url: 'https://www.example.com/one', title: 'One', description: 'Public', imageUrl: null, sortTitle: 'one', sortDomain: 'example.com', position: 0, metadataStatus: 'COMPLETED' },
      { userId: 'requester', folderId: 'copy-folder', url: 'https://example.com/two', title: 'Two', description: null, imageUrl: 'https://example.com/two.png', sortTitle: 'two', sortDomain: 'example.com', position: 1, metadataStatus: 'COMPLETED' },
    ] });
  });

  it('copies shared notes as notes with a plain document built from their text', async () => {
    prisma.folder.findFirst.mockResolvedValue({ id: 'source', userId: 'owner', name: 'Design' });
    prisma.bookmark.findMany.mockImplementation(({ where }: any) =>
      Promise.resolve(where.type === 'NOTE' ? [{ id: 'n', title: 'Plan', notes: 'First\n\nSecond' }] : []));
    await expect(service.copyShared('requester', 'a'.repeat(64))).resolves.toEqual({ folderId: 'copy-folder', copied: 1 });
    expect(prisma.bookmark.createMany).toHaveBeenCalledWith({ data: [expect.objectContaining({
      userId: 'requester', folderId: 'copy-folder', type: 'NOTE', title: 'Plan', notes: 'First\n\nSecond',
      noteDocument: { type: 'doc', content: [
        { type: 'paragraph', content: [{ type: 'text', text: 'First' }] },
        { type: 'paragraph' },
        { type: 'paragraph', content: [{ type: 'text', text: 'Second' }] },
      ] },
    })] });
  });

  it('copies shared drawings with their scene and preview', async () => {
    prisma.folder.findFirst.mockResolvedValue({ id: 'source', userId: 'owner', name: 'Design' });
    const scene = { elements: [{ id: 'e1', type: 'rectangle' }], appState: {}, files: {} };
    prisma.bookmark.findMany.mockImplementation(({ where, select }: any) => Promise.resolve(
      where.type !== 'DRAWING' ? []
        : select.drawing ? [{ title: 'Flow', drawing: scene, imageUrl: 'data:image/png;base64,AAAA' }]
        : [{ id: 'd-1', title: 'Flow', imageUrl: 'data:image/png;base64,AAAA' }]));
    await expect(service.copyShared('requester', 'a'.repeat(64))).resolves.toEqual({ folderId: 'copy-folder', copied: 1 });
    expect(prisma.bookmark.findMany).toHaveBeenLastCalledWith({
      where: { id: { in: ['d-1'] }, type: 'DRAWING', deletedAt: null },
      select: { title: true, drawing: true, imageUrl: true },
    });
    expect(prisma.bookmark.createMany).toHaveBeenCalledWith({ data: [expect.objectContaining({
      userId: 'requester', folderId: 'copy-folder', type: 'DRAWING', title: 'Flow', drawing: scene, imageUrl: 'data:image/png;base64,AAAA',
    })] });
  });

  it('rejects invalid, deleted, or revoked collections without creating anything', async () => {
    await expect(service.copyShared('user', 'bad')).rejects.toThrow(NotFoundException);
    prisma.folder.findFirst.mockResolvedValue(null);
    await expect(service.copyShared('user', 'a'.repeat(64))).rejects.toThrow(NotFoundException);
    expect(prisma.folder.create).not.toHaveBeenCalled();
    expect(prisma.bookmark.createMany).not.toHaveBeenCalled();
  });

  it('supports an empty collection and propagates write errors to roll back the transaction', async () => {
    prisma.folder.findFirst.mockResolvedValue({ id: 'source', userId: 'owner', name: 'Empty' });
    await expect(service.copyShared('user', 'a'.repeat(64))).resolves.toEqual({ folderId: 'copy-folder', copied: 0 });
    expect(prisma.bookmark.createMany).not.toHaveBeenCalled();
    prisma.bookmark.findMany.mockResolvedValue([{ url: 'https://example.com', title: 'Example' }]);
    prisma.bookmark.createMany.mockRejectedValue(new Error('write failed'));
    await expect(service.copyShared('user', 'a'.repeat(64))).rejects.toThrow('write failed');
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
