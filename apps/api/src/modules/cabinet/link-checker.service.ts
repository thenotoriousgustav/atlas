import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import axios from 'axios';

@Injectable()
export class LinkCheckerService implements OnModuleInit {
  private readonly logger = new Logger(LinkCheckerService.name);

  constructor(private prisma: PrismaService) {}

  onModuleInit() {
    // ponytail: simple background interval timer prevents importing external cron/schedule libraries
    // Run initial scan in background after 1 minute of startup
    setTimeout(() => this.runScan().catch(err => this.logger.error('Startup link scan failed', err)), 60000);
    // Run scan once every 24 hours
    setInterval(() => this.runScan().catch(err => this.logger.error('Daily link scan failed', err)), 24 * 60 * 60 * 1000);
  }

  async runScan() {
    this.logger.log('Starting bookmark health check scan...');
    // Find active bookmarks (not soft-deleted), prioritizing those unchecked or oldest checked
    const bookmarks = await this.prisma.bookmark.findMany({
      where: { deletedAt: null },
      orderBy: [
        { lastChecked: 'asc' }
      ],
      take: 100, // Batch of 100 to prevent database lock or network choke
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

  async checkBookmark(bookmark: any) {
    try {
      const response = await axios.head(bookmark.url, {
        timeout: 5000,
        maxRedirects: 0,
        validateStatus: (status) => status < 400, // Handle redirects (3xx) as successful check candidates
      });

      // Handle redirect
      if (response.status === 301 || response.status === 308) {
        const newUrl = response.headers.location;
        if (newUrl && newUrl !== bookmark.url) {
          await this.prisma.bookmark.update({
            where: { id: bookmark.id },
            data: {
              url: newUrl,
              status: 'REDIRECTED',
              statusCode: response.status,
              lastChecked: new Date(),
            },
          });
          this.logger.log(`Auto-redirected bookmark ${bookmark.id} from ${bookmark.url} to ${newUrl}`);
          return;
        }
      }

      await this.prisma.bookmark.update({
        where: { id: bookmark.id },
        data: {
          status: 'OK',
          statusCode: response.status,
          lastChecked: new Date(),
        },
      });
    } catch (err: any) {
      let statusCode = 500;
      if (err.response) {
        statusCode = err.response.status;
        if ((statusCode === 301 || statusCode === 308) && err.response.headers.location) {
          const newUrl = err.response.headers.location;
          if (newUrl !== bookmark.url) {
            await this.prisma.bookmark.update({
              where: { id: bookmark.id },
              data: {
                url: newUrl,
                status: 'REDIRECTED',
                statusCode,
                lastChecked: new Date(),
              },
            });
            this.logger.log(`Auto-redirected bookmark ${bookmark.id} on error catch from ${bookmark.url} to ${newUrl}`);
            return;
          }
        }
      } else if (err.code === 'ENOTFOUND' || err.code === 'ECONNREFUSED') {
        statusCode = 404;
      }

      await this.prisma.bookmark.update({
        where: { id: bookmark.id },
        data: {
          status: 'BROKEN',
          statusCode,
          lastChecked: new Date(),
        },
      });
    }
  }
}
