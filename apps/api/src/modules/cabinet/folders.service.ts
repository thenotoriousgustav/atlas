import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateFolderDto } from './dto/create-folder.dto';
import { UpdateFolderDto } from './dto/update-folder.dto';

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
    return this.prisma.folder.findMany({
      where: {
        userId,
        deletedAt: null,
      },
      include: {
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
        },
      },
    });

    if (!folder) {
      throw new NotFoundException('Folder not found');
    }

    return folder;
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
        data: { deletedAt: new Date() },
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
        data: { deletedAt: now },
      });
      // Recurse
      await this.softDeleteFolderContents(tx, sub.id);
    }
  }
}
