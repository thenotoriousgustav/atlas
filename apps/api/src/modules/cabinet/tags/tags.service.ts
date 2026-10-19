import { Injectable, NotFoundException } from "@nestjs/common"
import { PrismaService } from "../../../prisma/prisma.service"

@Injectable()
export class TagsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, name: string) {
    const cleanName = name.replace(/^#/, "").trim().toLowerCase()
    if (!cleanName) return null
    return this.prisma.tag.upsert({
      where: { name_userId: { name: cleanName, userId } },
      update: {},
      create: { name: cleanName, userId },
    })
  }

  async findAll(userId: string) {
    const tags = await this.prisma.tag.findMany({
      where: { userId },
      orderBy: {
        name: "asc",
      },
    })

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
        })
        return {
          ...tag,
          bookmarkCount: count,
        }
      })
    )

    return tagsWithCounts
  }

  async remove(userId: string, id: string) {
    const result = await this.prisma.tag.deleteMany({ where: { id, userId } })
    if (!result.count) throw new NotFoundException("Tag not found")
    return result
  }
}
