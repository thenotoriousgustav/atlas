import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MetadataService } from './metadata.service';
import { CreateBookmarkDto } from './dto/create-bookmark.dto';
import { UpdateBookmarkDto } from './dto/update-bookmark.dto';

@Injectable()
export class BookmarksService {
  constructor(
    private prisma: PrismaService,
    private metadataService: MetadataService,
  ) {}

  async create(userId: string, createBookmarkDto: CreateBookmarkDto) {
    // 1. Extract metadata if needed
    const extracted = await this.metadataService.extract(createBookmarkDto.url);

    // 2. Prep tags
    const tagConnectOrCreate = createBookmarkDto.tags?.map((name) => {
      const formatted = name.trim().toLowerCase();
      return {
        where: { name: formatted },
        create: { name: formatted },
      };
    }) || [];

    // 3. Check folder ownership if folderId is specified
    if (createBookmarkDto.folderId) {
      const folder = await this.prisma.folder.findFirst({
        where: { id: createBookmarkDto.folderId, userId, deletedAt: null },
      });
      if (!folder) {
        throw new NotFoundException('Target folder not found');
      }
    }

    return this.prisma.bookmark.create({
      data: {
        url: createBookmarkDto.url,
        title: createBookmarkDto.title || extracted.title,
        description: createBookmarkDto.description || extracted.description,
        imageUrl: extracted.imageUrl,
        folderId: createBookmarkDto.folderId || null,
        userId,
        tags: {
          connectOrCreate: tagConnectOrCreate,
        },
      },
      include: {
        tags: true,
        folder: true,
      },
    });
  }

  async findAll(
    userId: string,
    filters: {
      folderId?: string;
      isFavorite?: boolean;
      isArchived?: boolean;
      tag?: string;
      search?: string;
    },
  ) {
    const where: any = {
      userId,
      deletedAt: null,
    };

    if (filters.folderId) {
      where.folderId = filters.folderId;
    }

    if (filters.isFavorite !== undefined) {
      where.isFavorite = filters.isFavorite;
    }

    if (filters.isArchived !== undefined) {
      where.isArchived = filters.isArchived;
    }

    if (filters.tag) {
      where.tags = {
        some: {
          name: filters.tag.trim().toLowerCase(),
        },
      };
    }

    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
        { url: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.bookmark.findMany({
      where,
      include: {
        tags: true,
        folder: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(userId: string, id: string) {
    const bookmark = await this.prisma.bookmark.findFirst({
      where: {
        id,
        userId,
        deletedAt: null,
      },
      include: {
        tags: true,
        folder: true,
      },
    });

    if (!bookmark) {
      throw new NotFoundException('Bookmark not found');
    }

    return bookmark;
  }

  async update(userId: string, id: string, updateBookmarkDto: UpdateBookmarkDto) {
    await this.findOne(userId, id); // check existence

    // Check folder ownership if folderId is updated
    if (updateBookmarkDto.folderId) {
      const folder = await this.prisma.folder.findFirst({
        where: { id: updateBookmarkDto.folderId, userId, deletedAt: null },
      });
      if (!folder) {
        throw new NotFoundException('Target folder not found');
      }
    }

    // Prep tags set/connectOrCreate
    const tagConnectOrCreate = updateBookmarkDto.tags?.map((name) => {
      const formatted = name.trim().toLowerCase();
      return {
        where: { name: formatted },
        create: { name: formatted },
      };
    });

    return this.prisma.bookmark.update({
      where: { id },
      data: {
        url: updateBookmarkDto.url,
        title: updateBookmarkDto.title,
        description: updateBookmarkDto.description,
        isFavorite: updateBookmarkDto.isFavorite,
        isArchived: updateBookmarkDto.isArchived,
        folderId: updateBookmarkDto.folderId !== undefined ? (updateBookmarkDto.folderId || null) : undefined,
        tags: tagConnectOrCreate
          ? {
              set: [],
              connectOrCreate: tagConnectOrCreate,
            }
          : undefined,
      },
      include: {
        tags: true,
        folder: true,
      },
    });
  }

  async remove(userId: string, id: string) {
    await this.findOne(userId, id); // check existence

    return this.prisma.bookmark.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });
  }

  async exportBookmarks(userId: string): Promise<string> {
    const folders = await this.prisma.folder.findMany({
      where: { userId, deletedAt: null },
      include: {
        bookmarks: {
          where: { deletedAt: null },
          include: { tags: true },
        },
      },
    });

    const rootBookmarks = await this.prisma.bookmark.findMany({
      where: { userId, folderId: null, deletedAt: null },
      include: { tags: true },
    });

    let html = `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<!-- This is an automatically generated file.
     It will be read and imported by browsers and bookmark managers. -->
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>Bookmarks</TITLE>
<H1>Bookmarks</H1>
<DL><p>
`;

    for (const folder of folders) {
      html += `    <DT><H3 ADD_DATE="${Math.floor(folder.createdAt.getTime() / 1000)}">${folder.name}</H3>\n    <DL><p>\n`;
      for (const bookmark of folder.bookmarks) {
        const tagStr = bookmark.tags.map((t) => t.name).join(',');
        html += `        <DT><A HREF="${bookmark.url}" ADD_DATE="${Math.floor(bookmark.createdAt.getTime() / 1000)}" TAGS="${tagStr}">${bookmark.title}</A>\n`;
        if (bookmark.description) {
          html += `        <DD>${bookmark.description}\n`;
        }
      }
      html += `    </DL><p>\n`;
    }

    for (const bookmark of rootBookmarks) {
      const tagStr = bookmark.tags.map((t) => t.name).join(',');
      html += `    <DT><A HREF="${bookmark.url}" ADD_DATE="${Math.floor(bookmark.createdAt.getTime() / 1000)}" TAGS="${tagStr}">${bookmark.title}</A>\n`;
      if (bookmark.description) {
        html += `    <DD>${bookmark.description}\n`;
      }
    }

    html += `</DL><p>\n`;
    return html;
  }

  async importBookmarks(userId: string, htmlContent: string) {
    const lines = htmlContent.split('\n');
    let currentFolderId: string | null = null;
    let importCount = 0;

    for (const line of lines) {
      // 1. Match folder creation
      const folderMatch = line.match(/<H3[^>]*>([^<]+)<\/H3>/i);
      if (folderMatch) {
        const folderName = folderMatch[1].trim();
        const folder = await this.prisma.folder.create({
          data: { name: folderName, userId },
        });
        currentFolderId = folder.id;
        continue;
      }

      // 2. Close folder context
      if (line.includes('</DL>')) {
        currentFolderId = null;
      }

      // 3. Match bookmark link
      const bookmarkMatch = line.match(/<A\s+HREF=["']([^"']+)["'][^>]*>([^<]+)<\/A>/i);
      if (bookmarkMatch) {
        const url = bookmarkMatch[1].trim();
        const title = bookmarkMatch[2].trim();

        // Check for tags attribute
        const tagsMatch = line.match(/TAGS=["']([^"']+)["']/i);
        const tags = tagsMatch ? tagsMatch[1].split(',').map((t) => t.trim()).filter((t) => t.length > 0) : [];

        await this.prisma.bookmark.create({
          data: {
            url,
            title,
            userId,
            folderId: currentFolderId,
            tags: {
              connectOrCreate: tags.map((name) => ({
                where: { name: name.toLowerCase() },
                create: { name: name.toLowerCase() },
              })),
            },
          },
        });
        importCount++;
      }
    }

    return { imported: importCount };
  }

  async scrapeUrl(url: string) {
    const extracted = await this.metadataService.extract(url);
    const tags = await this.metadataService.generateTags(extracted.title, extracted.description);
    return {
      ...extracted,
      tags,
    };
  }
}
