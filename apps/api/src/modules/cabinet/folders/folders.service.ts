import { Injectable, NotFoundException } from '@nestjs/common';
import { createHash, randomBytes } from 'node:crypto';
import { accessibleFolder } from './folder-access';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateFolderDto } from './dto/create-folder.dto';
import { UpdateFolderDto } from './dto/update-folder.dto';
import { MetadataStatus, type Prisma } from '@prisma/client';
import { bookmarkSortFields } from '@/modules/cabinet/bookmarks/bookmark-order';

@Injectable()
export class FoldersService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, createFolderDto: CreateFolderDto) {
    if (createFolderDto.parentId) {
      const parent = await this.prisma.folder.findFirst({
        where: {
          id: createFolderDto.parentId,
          userId,
          deletedAt: null,
        },
      });
      if (!parent) {
        throw new NotFoundException('Parent folder not found');
      }
    }

    return this.prisma.folder.create({
      data: {
        name: createFolderDto.name,
        description: createFolderDto.description,
        parentId: createFolderDto.parentId || null,
        userId,
      },
    });
  }

  async findAll(userId: string) {
    const folders = await this.prisma.folder.findMany({
      where: accessibleFolder(userId),
      omit: { inviteTokenHash: true, shareToken: true },
      include: {
        _count: {
          select: {
            bookmarks: {
              where: { deletedAt: null, OR: [{ userId }, { type: 'BOOKMARK' }] },
            },
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });
    return folders.map((folder) => ({ ...folder, isOwner: folder.userId === userId, parentId: folder.userId === userId ? folder.parentId : null }));
  }

  async findOne(userId: string, id: string) {
    const folder = await this.prisma.folder.findFirst({
      where: {
        id,
        userId,
        deletedAt: null,
      },
      include: {
        bookmarks: {
          where: { deletedAt: null, OR: [{ userId }, { type: 'BOOKMARK' }] },
        },
      },
    });

    if (!folder) {
      throw new NotFoundException('Folder not found');
    }

    return {
      ...folder,
      bookmarks: folder.bookmarks.map((bookmark) => ({
        ...bookmark,
        notes: bookmark.userId === userId ? bookmark.notes : null,
        noteDocument: bookmark.userId === userId ? bookmark.noteDocument : null,
      })),
    };
  }

  async getCollaboration(userId: string, id: string) {
    const folder = await this.prisma.folder.findFirst({
      where: { id, userId, deletedAt: null },
      select: { inviteTokenHash: true, members: {
        select: { userId: true, user: { select: { name: true } } },
        orderBy: { createdAt: 'asc' },
      } },
    });
    if (!folder) throw new NotFoundException('Folder not found');
    return { inviteEnabled: !!folder.inviteTokenHash, members: folder.members };
  }

  async enableInvite(userId: string, id: string) {
    const token = randomBytes(32).toString('hex');
    const result = await this.prisma.folder.updateMany({
      where: { id, userId, deletedAt: null },
      data: { inviteTokenHash: createHash('sha256').update(token).digest('hex') },
    });
    if (!result.count) throw new NotFoundException('Folder not found');
    return { token };
  }

  async disableInvite(userId: string, id: string) {
    const result = await this.prisma.folder.updateMany({
      where: { id, userId, deletedAt: null }, data: { inviteTokenHash: null },
    });
    if (!result.count) throw new NotFoundException('Folder not found');
    return { inviteEnabled: false };
  }

  async acceptInvite(userId: string, token: string) {
    if (!/^[a-f0-9]{64}$/.test(token)) throw new NotFoundException('Invitation not found');
    return this.prisma.$transaction(async (tx) => {
      const hash = createHash('sha256').update(token).digest('hex');
      // Lock the invitation row so revocation and acceptance cannot race.
      const folders = await tx.$queryRaw<Array<{ id: string; userId: string }>>`
        SELECT "id", "userId" FROM "folders"
        WHERE "inviteTokenHash" = ${hash} AND "deletedAt" IS NULL FOR UPDATE
      `;
      const folder = folders[0];
      if (!folder) throw new NotFoundException('Invitation not found');
      if (folder.userId !== userId) {
        await tx.folderMember.upsert({
          where: { folderId_userId: { folderId: folder.id, userId } },
          create: { folderId: folder.id, userId }, update: {},
        });
      }
      return { folderId: folder.id };
    });
  }

  async removeMember(userId: string, id: string, memberId: string) {
    return this.prisma.$transaction(async (tx) => {
      // Lock and revoke first so acceptance cannot race with removing a member.
      const result = await tx.folder.updateMany({
        where: { id, userId, deletedAt: null }, data: { inviteTokenHash: null },
      });
      if (!result.count) throw new NotFoundException('Folder not found');
      await tx.folderMember.deleteMany({ where: { folderId: id, userId: memberId } });
      return { removed: true };
    });
  }

  async getShare(userId: string, id: string) {
    const folder = await this.prisma.folder.findFirst({
      where: { id, userId, deletedAt: null },
      select: { shareToken: true },
    });
    if (!folder) throw new NotFoundException('Folder not found');
    return folder;
  }

  async enableShare(userId: string, id: string) {
    // Conditional update keeps an existing link stable, including concurrent requests.
    await this.prisma.folder.updateMany({
      where: { id, userId, deletedAt: null, shareToken: null },
      data: { shareToken: randomBytes(32).toString('hex') },
    });
    return this.getShare(userId, id);
  }

  async disableShare(userId: string, id: string) {
    const result = await this.prisma.folder.updateMany({
      where: { id, userId, deletedAt: null },
      data: { shareToken: null },
    });
    if (!result.count) throw new NotFoundException('Folder not found');
    return { shareToken: null };
  }

  async findShared(token: string, db: Prisma.TransactionClient = this.prisma) {
    if (!/^[a-f0-9]{64}$/.test(token)) {
      throw new NotFoundException('Collection not found');
    }
    const folder = await db.folder.findFirst({
      where: { shareToken: token, deletedAt: null },
      select: { id: true, userId: true, name: true },
    });
    if (!folder) throw new NotFoundException('Collection not found');

    // Explicit allowlist: never serialize private notes, tags, metadata, or owner data.
    const bookmarks = await db.bookmark.findMany({
      where: {
        folderId: folder.id,
        userId: folder.userId,
        type: 'BOOKMARK',
        url: { not: null },
        deletedAt: null,
        isArchived: false,
      },
      select: { id: true, url: true, title: true, description: true, imageUrl: true },
      orderBy: [{ isPinned: 'desc' }, { position: 'asc' }, { createdAt: 'desc' }, { id: 'asc' }],
    });
    return { name: folder.name, bookmarks };
  }

  async copyShared(userId: string, token: string) {
    return this.prisma.$transaction(async (tx) => {
      // Read the current public allowlist, not private folder contents or client-supplied data.
      const collection = await this.findShared(token, tx);
      const bookmarks = collection.bookmarks.filter((bookmark) => {
        try {
          const url = new URL(bookmark.url || '');
          return url.protocol === 'http:' || url.protocol === 'https:';
        } catch { return false; }
      });
      const folder = await tx.folder.create({
        data: { name: `${collection.name} (Copy)`, userId },
        select: { id: true },
      });
      if (bookmarks.length) {
        await tx.bookmark.createMany({
          data: bookmarks.map((bookmark, position) => ({
            userId,
            folderId: folder.id,
            url: bookmark.url,
            title: bookmark.title,
            description: bookmark.description,
            imageUrl: bookmark.imageUrl,
            ...bookmarkSortFields({ title: bookmark.title, url: bookmark.url }),
            position,
            metadataStatus: MetadataStatus.COMPLETED,
          })),
        });
      }
      return { folderId: folder.id, copied: bookmarks.length };
    });
  }

  async update(userId: string, id: string, updateFolderDto: UpdateFolderDto) {
    await this.findOne(userId, id); // check existence

    if (updateFolderDto.parentId) {
      if (updateFolderDto.parentId === id) {
        throw new Error('A folder cannot be its own parent');
      }
      const parent = await this.prisma.folder.findFirst({
        where: {
          id: updateFolderDto.parentId,
          userId,
          deletedAt: null,
        },
      });
      if (!parent) {
        throw new NotFoundException('Parent folder not found');
      }
    }

    return this.prisma.folder.update({
      where: { id },
      data: {
        name: updateFolderDto.name,
        description: updateFolderDto.description,
        parentId: updateFolderDto.parentId || null,
      },
    });
  }

  async remove(userId: string, id: string) {
    await this.findOne(userId, id); // check existence

    // Perform soft delete on the folder and trigger soft delete on contents recursively
    return this.prisma.$transaction(async (tx) => {
      // Soft delete this folder
      const folder = await tx.folder.update({
        where: { id },
        data: { deletedAt: new Date(), shareToken: null, inviteTokenHash: null },
      });

      // Recursively soft delete subfolders and bookmarks
      await this.softDeleteFolderContents(tx, id);

      return folder;
    });
  }

  private async softDeleteFolderContents(tx: any, folderId: string) {
    const now = new Date();

    // Soft delete all bookmarks in this folder
    await tx.bookmark.updateMany({
      where: { folderId, deletedAt: null },
      data: { deletedAt: now },
    });

    // Find subfolders
    const subfolders = await tx.folder.findMany({
      where: { parentId: folderId, deletedAt: null },
    });

    for (const sub of subfolders) {
      await tx.folder.update({
        where: { id: sub.id },
        data: { deletedAt: now, shareToken: null, inviteTokenHash: null },
      });
      // Recurse
      await this.softDeleteFolderContents(tx, sub.id);
    }
  }
}
