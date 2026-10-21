import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common"
import { PrismaService } from "@/prisma/prisma.service"

@Injectable()
export class TagsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, name: string) {
    const cleanName = name.trim().replace(/^#/, "").trim().toLowerCase()
    if (!cleanName) return null
    return this.prisma.tag.upsert({
      where: { name_userId: { name: cleanName, userId } },
      update: {},
      create: { name: cleanName, userId },
    })
  }

  /** Tags with the number of active (not trashed) items, most used first. One query for all counts. */
  async findAll(userId: string) {
    const tags = await this.prisma.tag.findMany({
      where: { userId },
      include: {
        _count: { select: { bookmarks: { where: { userId, deletedAt: null } } } },
      },
    })
    return tags
      .map(({ _count, ...tag }) => ({ ...tag, bookmarkCount: _count.bookmarks }))
      .sort((a, b) => b.bookmarkCount - a.bookmarkCount || a.name.localeCompare(b.name))
  }

  async rename(userId: string, id: string, name: string) {
    const cleanName = (name ?? "").trim().replace(/^#/, "").trim().toLowerCase()
    if (!cleanName) throw new BadRequestException("Tag name is required")
    if (cleanName.length > 30) throw new BadRequestException("Tag name must be at most 30 characters")

    const tag = await this.prisma.tag.findFirst({ where: { id, userId } })
    if (!tag) throw new NotFoundException("Tag not found")
    if (tag.name === cleanName) return tag

    const clash = await this.prisma.tag.findUnique({
      where: { name_userId: { name: cleanName, userId } },
    })
    if (clash) throw new ConflictException(`#${cleanName} already exists`)
    try {
      return await this.prisma.tag.update({ where: { id }, data: { name: cleanName } })
    } catch (error) {
      if ((error as { code?: string }).code === "P2002") {
        throw new ConflictException(`#${cleanName} already exists`)
      }
      throw error
    }
  }

  /** Moves every item from one tag onto another, then deletes the emptied tag. */
  async merge(userId: string, sourceId: string, targetId: string) {
    if (sourceId === targetId) throw new BadRequestException("Choose a different tag to merge into")
    const [source, target] = await Promise.all([
      this.prisma.tag.findFirst({ where: { id: sourceId, userId } }),
      this.prisma.tag.findFirst({ where: { id: targetId, userId } }),
    ])
    if (!source || !target) throw new NotFoundException("Tag not found")

    return this.prisma.$transaction(async (tx) => {
      const items = await tx.bookmark.findMany({
        where: { tags: { some: { id: sourceId } } },
        select: { id: true },
      })
      if (items.length) {
        await tx.tag.update({ where: { id: targetId }, data: { bookmarks: { connect: items } } })
      }
      await tx.tag.delete({ where: { id: sourceId } })
      return { merged: items.length, target }
    })
  }

  /** Deletes tags that no active item uses. Tags left only on trashed items go too. */
  async removeUnused(userId: string) {
    const result = await this.prisma.tag.deleteMany({
      where: { userId, bookmarks: { none: { userId, deletedAt: null } } },
    })
    return { deleted: result.count }
  }

  async remove(userId: string, id: string) {
    const result = await this.prisma.tag.deleteMany({ where: { id, userId } })
    if (!result.count) throw new NotFoundException("Tag not found")
    return result
  }
}
