import { Injectable } from "@nestjs/common"
import { PrismaService } from "../../../prisma/prisma.service"

@Injectable()
export class TagsService {
  constructor(private prisma: PrismaService) {}

  async create(name: string) {
    const cleanName = name.replace(/^#/, "").trim()
    if (!cleanName) return null
    return this.prisma.tag.upsert({
      where: { name: cleanName },
      update: {},
      create: { name: cleanName },
    })
  }

  async findAll(userId: string) {
    const tags = await this.prisma.tag.findMany({
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

  async remove(id: string) {
    return this.prisma.tag.delete({
      where: { id },
    })
  }
}
