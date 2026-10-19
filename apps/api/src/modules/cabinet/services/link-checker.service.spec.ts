import { LinkCheckerService } from './link-checker.service';

describe('LinkCheckerService', () => {
  it('does not classify access restrictions or rate limits as broken links', async () => {
    const update = jest.fn();
    const service = new LinkCheckerService({ bookmark: { update } } as any);
    const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue(new Response(null, { status: 403 }));

    await service.checkBookmark({ id: 'bookmark-1', url: 'https://saaspo.com/' });

    expect(update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'bookmark-1' },
      data: expect.objectContaining({ status: 'UNKNOWN', statusCode: 403 }),
    }));
    fetchMock.mockRestore();
  });

  it('still marks missing pages as broken', async () => {
    const update = jest.fn();
    const service = new LinkCheckerService({ bookmark: { update } } as any);
    const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue(new Response(null, { status: 404 }));

    await service.checkBookmark({ id: 'bookmark-1', url: 'https://example.com/missing' });

    expect(update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'bookmark-1' },
      data: expect.objectContaining({ status: 'BROKEN', statusCode: 404 }),
    }));
    fetchMock.mockRestore();
  });

  it('scans only active bookmarks with URLs', async () => {
    const prisma = { bookmark: { findMany: jest.fn().mockResolvedValue([]) } };
    const service = new LinkCheckerService(prisma as any);

    await service.runScan();

    expect(prisma.bookmark.findMany).toHaveBeenCalledWith({
      where: { type: 'BOOKMARK', url: { not: null }, deletedAt: null },
      orderBy: [{ lastChecked: 'asc' }],
      take: 100,
    });
  });
});
