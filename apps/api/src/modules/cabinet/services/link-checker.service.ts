import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class LinkCheckerService implements OnModuleInit {
  private readonly logger = new Logger(LinkCheckerService.name);

  constructor(private prisma: PrismaService) {}

  onModuleInit() {
    // ponytail: native interval timer avoids external scheduler dependencies
    setTimeout(() => this.runScan().catch(err => this.logger.error('Startup link scan failed', err)), 60000);
    setInterval(() => this.runScan().catch(err => this.logger.error('Daily link scan failed', err)), 24 * 60 * 60 * 1000);
  }

  async runScan() {
    this.logger.log('Starting bookmark health check scan...');
    const bookmarks = await this.prisma.bookmark.findMany({
      where: { deletedAt: null },
      orderBy: [{ lastChecked: 'asc' }],
      take: 100,
    });

    if (bookmarks.length === 0) {
      this.logger.log('No bookmarks found to scan.');
      return;
    }

    this.logger.log(`Scanning status for ${bookmarks.length} bookmarks...`);
    for (const bookmark of bookmarks) {
      await this.checkBookmark(bookmark);
    }
    this.logger.log('Bookmark health check scan finished.');
  }

  async checkBookmark(bookmark: { id: string; url: string }) {
    // ponytail: use native fetch with HEAD and manual redirect to avoid axios dependency
    try {
      const response = await fetch(bookmark.url, {
        method: 'HEAD',
        redirect: 'manual',
        signal: AbortSignal.timeout(5000),
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; AtlasBot/1.0; +http://atlasapp.internal)',
        },
      });

      const isRedirect = response.status === 301 || response.status === 308;
      const redirectLocation = response.headers.get('location');

      if (isRedirect && redirectLocation && redirectLocation !== bookmark.url) {
        await this.prisma.bookmark.update({
          where: { id: bookmark.id },
          data: {
            url: redirectLocation,
            status: 'REDIRECTED',
            statusCode: response.status,
            lastChecked: new Date(),
          },
        });
        this.logger.log(`Auto-redirected bookmark ${bookmark.id} to ${redirectLocation}`);
        return;
      }

      const isOk = response.ok || response.status < 400;
      await this.prisma.bookmark.update({
        where: { id: bookmark.id },
        data: {
          status: isOk ? 'OK' : 'BROKEN',
          statusCode: response.status,
          lastChecked: new Date(),
        },
      });
    } catch {
      await this.prisma.bookmark.update({
        where: { id: bookmark.id },
        data: {
          status: 'BROKEN',
          statusCode: 500,
          lastChecked: new Date(),
        },
      });
    }
  }
}
