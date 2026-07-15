import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TagsService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string) {
    const tags = await this.prisma.tag.findMany({
      where: {
        bookmarks: {
          some: {
            userId,
            deletedAt: null,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    // Manually map counts for compliance with database schemas
    const tagsWithCounts = await Promise.all(
      tags.map(async (tag) => {
        const count = await this.prisma.bookmark.count({
          where: {
            userId,
            deletedAt: null,
            tags: {
              some: {
                id: tag.id,
              },
            },
          },
        });
        return {
          ...tag,
          bookmarkCount: count,
        };
      }),
    );

    return tagsWithCounts;
  }
}
