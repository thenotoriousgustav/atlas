import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { createHash, randomBytes } from 'node:crypto';
import { accessibleFolder, shareableNoteFields, type FolderAccess } from './folder-access';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateFolderDto } from './dto/create-folder.dto';
import { UpdateFolderDto } from './dto/update-folder.dto';
import { FolderRole, MetadataStatus, type Prisma } from '@prisma/client';
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
      omit: { inviteTokenHash: true, shareToken: true, inviteRole: true },
      include: {
        members: { where: { userId }, select: { role: true } },
        _count: {
          select: {
            bookmarks: {
              where: { deletedAt: null },
            },
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });
    return folders.map(({ members, ...folder }) => {
      const isOwner = folder.userId === userId;
      const access: FolderAccess = isOwner ? 'OWNER' : members[0]?.role ?? FolderRole.VIEWER;
      return { ...folder, isOwner, access, parentId: isOwner ? folder.parentId : null };
    });
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
          where: { deletedAt: null },
          omit: { drawing: true },
        },
      },
    });

    if (!folder) {
      throw new NotFoundException('Folder not found');
    }

    return {
      ...folder,
      bookmarks: folder.bookmarks.map((bookmark) => ({ ...bookmark, ...shareableNoteFields(bookmark, userId) })),
    };
  }

  async getCollaboration(userId: string, id: string) {
    const folder = await this.prisma.folder.findFirst({
      where: { id, userId, deletedAt: null },
      select: {
        inviteTokenHash: true,
        inviteRole: true,
        user: { select: { id: true, name: true, email: true, avatar: true } },
        members: {
          select: { userId: true, role: true, user: { select: { name: true, email: true, avatar: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
    if (!folder) throw new NotFoundException('Folder not found');
    return {
      owner: folder.user,
      inviteEnabled: !!folder.inviteTokenHash,
      inviteRole: folder.inviteRole,
      members: folder.members,
    };
  }

  /** Creates a new invitation link (the old one stops working), optionally with a new role. */
  async enableInvite(userId: string, id: string, role?: FolderRole) {
    const token = randomBytes(32).toString('hex');
    const result = await this.prisma.folder.updateMany({
      where: { id, userId, deletedAt: null },
      data: { inviteTokenHash: createHash('sha256').update(token).digest('hex'), ...(role ? { inviteRole: role } : {}) },
    });
    if (!result.count) throw new NotFoundException('Folder not found');
    return { token, inviteRole: role };
  }

  /** Changes the role the current link grants without invalidating it. */
  async updateInviteRole(userId: string, id: string, role: FolderRole) {
    const result = await this.prisma.folder.updateMany({
      where: { id, userId, deletedAt: null }, data: { inviteRole: role },
    });
    if (!result.count) throw new NotFoundException('Folder not found');
    return { inviteRole: role };
  }

  async disableInvite(userId: string, id: string) {
    const result = await this.prisma.folder.updateMany({
      where: { id, userId, deletedAt: null }, data: { inviteTokenHash: null },
    });
    if (!result.count) throw new NotFoundException('Folder not found');
    return { inviteEnabled: false };
  }

  /** Gives an existing Cabinet account access directly, or changes its role if it already has access. */
  async addMember(userId: string, id: string, email: string, role: FolderRole) {
    const folder = await this.prisma.folder.findFirst({ where: { id, userId, deletedAt: null }, select: { id: true } });
    if (!folder) throw new NotFoundException('Folder not found');
    const person = await this.prisma.user.findFirst({
      where: { email: { equals: email.trim(), mode: 'insensitive' }, deletedAt: null },
      select: { id: true, name: true, email: true, avatar: true },
    });
    if (!person) {
      throw new NotFoundException('No Cabinet account uses this email. Send them the invite link instead.');
    }
    if (person.id === userId) throw new BadRequestException('You already own this folder');
    await this.prisma.folderMember.upsert({
      where: { folderId_userId: { folderId: id, userId: person.id } },
      create: { folderId: id, userId: person.id, role },
      update: { role },
    });
    return { userId: person.id, role, user: { name: person.name, email: person.email, avatar: person.avatar } };
  }

  async updateMemberRole(userId: string, id: string, memberId: string, role: FolderRole) {
    const folder = await this.prisma.folder.findFirst({ where: { id, userId, deletedAt: null }, select: { id: true } });
    if (!folder) throw new NotFoundException('Folder not found');
    const result = await this.prisma.folderMember.updateMany({ where: { folderId: id, userId: memberId }, data: { role } });
    if (!result.count) throw new NotFoundException('Member not found');
    return { userId: memberId, role };
  }

  async acceptInvite(userId: string, token: string) {
    if (!/^[a-f0-9]{64}$/.test(token)) throw new NotFoundException('Invitation not found');
    return this.prisma.$transaction(async (tx) => {
      const hash = createHash('sha256').update(token).digest('hex');
      // Lock the invitation row so revocation and acceptance cannot race.
      const folders = await tx.$queryRaw<Array<{ id: string; userId: string; inviteRole: FolderRole }>>`
        SELECT "id", "userId", "inviteRole" FROM "folders"
        WHERE "inviteTokenHash" = ${hash} AND "deletedAt" IS NULL FOR UPDATE
      `;
      const folder = folders[0];
      if (!folder) throw new NotFoundException('Invitation not found');
      if (folder.userId !== userId) {
        await tx.folderMember.upsert({
          where: { folderId_userId: { folderId: folder.id, userId } },
          // People who already have access keep their role; the link only grants a starting role.
          create: { folderId: folder.id, userId, role: folder.inviteRole ?? FolderRole.CONTRIBUTOR }, update: {},
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

    // Explicit allowlist: never serialize personal link notes, tags, metadata, or owner data.
    const sharedOrder = [{ isPinned: 'desc' as const }, { position: 'asc' as const }, { createdAt: 'desc' as const }, { id: 'asc' as const }];
    const notes = await db.bookmark.findMany({
      where: { folderId: folder.id, userId: folder.userId, type: 'NOTE', deletedAt: null, isArchived: false },
      // A note's own text is shared with its folder; its document structure and tags are not needed here.
      select: { id: true, title: true, notes: true },
      orderBy: sharedOrder,
    });
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
      orderBy: sharedOrder,
    });
    const drawings = await db.bookmark.findMany({
      where: { folderId: folder.id, userId: folder.userId, type: 'DRAWING', deletedAt: null, isArchived: false },
      // The public page shows a drawing as its preview image; the scene itself is not served.
      select: { id: true, title: true, imageUrl: true },
      orderBy: sharedOrder,
    });
    return {
      name: folder.name,
      bookmarks,
      notes: notes.map((note) => ({ id: note.id, title: note.title, text: note.notes ?? '' })),
      drawings: drawings.map((drawing) => ({
        id: drawing.id,
        title: drawing.title,
        preview: drawing.imageUrl?.startsWith('data:image/') ? drawing.imageUrl : null,
      })),
    };
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
      const notes = collection.notes ?? [];
      // Copying a drawing needs its scene, read here from the same owner's folder only.
      const drawingIds = (collection.drawings ?? []).map((drawing) => drawing.id);
      const drawings = drawingIds.length
        ? await tx.bookmark.findMany({
            where: { id: { in: drawingIds }, type: 'DRAWING', deletedAt: null },
            select: { title: true, drawing: true, imageUrl: true },
          })
        : [];
      if (notes.length) {
        await tx.bookmark.createMany({
          data: notes.map((note, position) => ({
            userId,
            folderId: folder.id,
            type: 'NOTE' as const,
            title: note.title,
            notes: note.text,
            // Rebuild a plain document from the shared text, one paragraph per line.
            noteDocument: {
              type: 'doc',
              content: note.text.split(/\r?\n/).map((line) => (line ? { type: 'paragraph', content: [{ type: 'text', text: line }] } : { type: 'paragraph' })),
            },
            ...bookmarkSortFields({ title: note.title }),
            position: bookmarks.length + position,
            metadataStatus: MetadataStatus.COMPLETED,
          })),
        });
      }
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
      if (drawings.length) {
        await tx.bookmark.createMany({
          data: drawings.map((drawing, position) => ({
            userId,
            folderId: folder.id,
            type: 'DRAWING' as const,
            title: drawing.title,
            drawing: drawing.drawing ?? { elements: [], appState: {}, files: {} },
            imageUrl: drawing.imageUrl,
            ...bookmarkSortFields({ title: drawing.title }),
            position: bookmarks.length + notes.length + position,
            metadataStatus: MetadataStatus.COMPLETED,
          })),
        });
      }
      return { folderId: folder.id, copied: bookmarks.length + notes.length + drawings.length };
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
