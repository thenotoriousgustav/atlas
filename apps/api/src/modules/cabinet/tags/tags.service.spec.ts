import { ConflictException, NotFoundException } from "@nestjs/common"
import { PrismaService } from "@/prisma/prisma.service"
import { TagsService } from "./tags.service"

describe("TagsService user isolation", () => {
  const prisma = {
    tag: {
      upsert: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
      deleteMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
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

  it("renames only the user's own tag and normalizes the name", async () => {
    prisma.tag.findFirst.mockResolvedValue({ id: "t1", name: "old", userId: "user-1" })
    prisma.tag.findUnique.mockResolvedValue(null)
    await service.rename("user-1", "t1", " #Reading ")
    expect(prisma.tag.findFirst).toHaveBeenCalledWith({ where: { id: "t1", userId: "user-1" } })
    expect(prisma.tag.update).toHaveBeenCalledWith({ where: { id: "t1" }, data: { name: "reading" } })
  })

  it("refuses to rename onto an existing tag", async () => {
    prisma.tag.findFirst.mockResolvedValue({ id: "t1", name: "old", userId: "user-1" })
    prisma.tag.findUnique.mockResolvedValue({ id: "t2", name: "work", userId: "user-1" })
    await expect(service.rename("user-1", "t1", "work")).rejects.toBeInstanceOf(ConflictException)
  })

  it("cannot rename another user's tag", async () => {
    prisma.tag.findFirst.mockResolvedValue(null)
    await expect(service.rename("user-1", "other", "x")).rejects.toBeInstanceOf(NotFoundException)
  })

  it("counts active items in one query and sorts by usage", async () => {
    prisma.tag.findMany.mockResolvedValueOnce([
      { id: "a", name: "alpha", userId: "user-1", _count: { bookmarks: 1 } },
      { id: "b", name: "beta", userId: "user-1", _count: { bookmarks: 5 } },
    ])
    const tags = await service.findAll("user-1")
    expect(prisma.tag.findMany).toHaveBeenLastCalledWith({
      where: { userId: "user-1" },
      include: { _count: { select: { bookmarks: { where: { userId: "user-1", deletedAt: null } } } } },
    })
    expect(tags.map((t: any) => [t.name, t.bookmarkCount])).toEqual([["beta", 5], ["alpha", 1]])
  })

  it("refuses to merge a tag into itself or into another user's tag", async () => {
    await expect(service.merge("user-1", "a", "a")).rejects.toThrow("different tag")
    prisma.tag.findFirst.mockResolvedValueOnce({ id: "a" }).mockResolvedValueOnce(null)
    await expect(service.merge("user-1", "a", "other")).rejects.toBeInstanceOf(NotFoundException)
  })

  it("deletes only the user's tags without active items", async () => {
    prisma.tag.deleteMany.mockResolvedValue({ count: 3 })
    await expect(service.removeUnused("user-1")).resolves.toEqual({ deleted: 3 })
    expect(prisma.tag.deleteMany).toHaveBeenLastCalledWith({
      where: { userId: "user-1", bookmarks: { none: { userId: "user-1", deletedAt: null } } },
    })
  })
})
