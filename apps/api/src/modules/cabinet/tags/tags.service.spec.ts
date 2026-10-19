import { NotFoundException } from "@nestjs/common"
import { PrismaService } from "../../../prisma/prisma.service"
import { TagsService } from "./tags.service"

describe("TagsService user isolation", () => {
  const prisma = {
    tag: {
      upsert: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
      deleteMany: jest.fn(),
    },
  }
  const service = new TagsService(prisma as unknown as PrismaService)

  it("scopes tag creation and listing to the current user", async () => {
    await service.create("user-1", "#Work")
    expect(prisma.tag.upsert).toHaveBeenCalledWith({
      where: { name_userId: { name: "work", userId: "user-1" } },
      update: {},
      create: { name: "work", userId: "user-1" },
    })
    await service.findAll("user-1")
    expect(prisma.tag.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: "user-1" } })
    )
  })

  it("cannot delete another user’s tag", async () => {
    prisma.tag.deleteMany.mockResolvedValue({ count: 0 })
    await expect(service.remove("user-1", "other-tag")).rejects.toBeInstanceOf(
      NotFoundException
    )
    expect(prisma.tag.deleteMany).toHaveBeenCalledWith({
      where: { id: "other-tag", userId: "user-1" },
    })
  })
})
