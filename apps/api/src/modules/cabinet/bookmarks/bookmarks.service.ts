import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
  forwardRef,
  Logger,
  OnModuleInit,
} from "@nestjs/common"
import { InjectQueue } from "@nestjs/bullmq"
import { Queue } from "bullmq"
import {
  BookmarkType,
  BookmarkContentType,
  MetadataStatus,
} from "@prisma/client"
import { Response } from "express"
import axios from "axios"
import { PrismaService } from "@/prisma/prisma.service"
import { MetadataService } from "@/modules/cabinet/services/metadata.service"
import { LinkCheckerService } from "@/modules/cabinet/services/link-checker.service"
import { CabinetMediaService } from "@/modules/cabinet/services/cabinet-media.service"
import { CreateBookmarkDto } from "./dto/create-bookmark.dto"
import { UpdateBookmarkDto } from "./dto/update-bookmark.dto"
import { DownloadMediaDto } from "@/modules/cabinet/dto/download-media.dto"
import { SaveNoteDto } from "./dto/save-note.dto"
import { CRAWLER_USER_AGENTS } from "@/modules/cabinet/providers/metadata/metadata-provider.interface"
import { validatePublicUrl } from "@/common/utils/ssrf"
import { BookmarkSort, bookmarkOrderBy, bookmarkSortFields } from "./bookmark-order"
import { accessibleFolder, folderSummary } from "../folders/folder-access"

@Injectable()
export class BookmarksService implements OnModuleInit {
  private readonly logger = new Logger(BookmarksService.name)

  constructor(
    private prisma: PrismaService,
    private metadataService: MetadataService,
    @Inject(forwardRef(() => LinkCheckerService))
    private linkCheckerService: LinkCheckerService,
    private cabinetMediaService: CabinetMediaService,
    @InjectQueue("bookmark-enrichment")
    private enrichmentQueue: Queue
  ) {}

  onModuleInit() {
    // Automatically queue background enrichment for missing metadata after startup
    setTimeout(() => {
      this.enrichMissingMetadata().catch((err) => {
        this.logger.error("Startup missing metadata enrichment failed", err)
      })
    }, 15000)
  }

  async create(userId: string, createBookmarkDto: CreateBookmarkDto) {
    const isNote =
      createBookmarkDto.type === BookmarkType.NOTE || !createBookmarkDto.url
    const itemType = isNote ? BookmarkType.NOTE : BookmarkType.BOOKMARK
    if (
      createBookmarkDto.noteDocument &&
      (!isNote ||
        createBookmarkDto.noteDocument.type !== "doc" ||
        !Array.isArray(createBookmarkDto.noteDocument.content))
    ) {
      throw new BadRequestException("Invalid note document")
    }

    let extracted: any = {}
    let contentType: BookmarkContentType | null = null

    if (!isNote && createBookmarkDto.url) {
      extracted = await this.metadataService.extract(createBookmarkDto.url)

      if (this.cabinetMediaService.isVideoUrl(createBookmarkDto.url)) {
        contentType = BookmarkContentType.VIDEO
      }
    }

    // 2. Prep tags
    const tagConnectOrCreate =
      createBookmarkDto.tags?.map((name) => {
        const formatted = name.trim().toLowerCase()
        return {
          where: { name_userId: { name: formatted, userId } },
          create: { name: formatted, userId },
        }
      }) || []

    // 3. Check folder ownership if folderId is specified
    if (createBookmarkDto.folderId) {
      const folder = await this.prisma.folder.findFirst({
        where: { id: createBookmarkDto.folderId, ...accessibleFolder(userId) },
      })
      if (!folder) {
        throw new NotFoundException("Target folder not found")
      }
    }

    const bookmark = await this.prisma.bookmark.create({
      data: {
        type: itemType,
        url: createBookmarkDto.url || null,
        title:
          createBookmarkDto.title ||
          extracted.title ||
          (isNote ? "Untitled Note" : "Untitled"),
        ...bookmarkSortFields({
          title: createBookmarkDto.title || extracted.title || (isNote ? "Untitled Note" : "Untitled"),
          url: createBookmarkDto.url || null,
        }),
        description:
          createBookmarkDto.description || extracted.description || null,
        notes: null,
        noteDocument: createBookmarkDto.noteDocument,
        imageUrl: extracted.imageUrl || null,
        faviconUrl: extracted.faviconUrl || null,
        siteName: extracted.siteName || null,
        folderId: createBookmarkDto.folderId || null,
        userId,
        contentType: contentType || (isNote ? null : undefined),
        metadataStatus: isNote
          ? MetadataStatus.COMPLETED
          : MetadataStatus.PENDING,
        tags: {
          connectOrCreate: tagConnectOrCreate,
        },
      },
      include: {
        tags: true,
        folder: { select: folderSummary },
      },
    })

    // 5. Enqueue enrichment job only for web bookmarks with URL
    if (!isNote && bookmark.url) {
      try {
        await this.enrichmentQueue.add("enrich", {
          bookmarkId: bookmark.id,
          url: bookmark.url,
        })
      } catch (err: any) {
        this.logger.error(
          `Failed to queue enrichment job for ${bookmark.id}: ${err.message}`
        )
      }
    }

    return bookmark
  }

  async saveNote(userId: string, id: string, dto: SaveNoteDto) {
    if (
      dto.noteDocument.type !== "doc" ||
      !Array.isArray(dto.noteDocument.content)
    ) {
      throw new BadRequestException("Invalid note document")
    }
    const where = { id, userId, type: BookmarkType.NOTE, deletedAt: null }
    const existing = await this.prisma.bookmark.findFirst({ where: { id } })
    if (
      existing &&
      (existing.userId !== userId ||
        existing.type !== BookmarkType.NOTE ||
        existing.deletedAt)
    ) {
      throw new NotFoundException("Note not found")
    }
    if (!existing && dto.folderId) {
      const folder = await this.prisma.folder.findFirst({
        where: { id: dto.folderId, ...accessibleFolder(userId) },
      })
      if (!folder) throw new NotFoundException("Folder not found")
    }
    const data = {
      title: dto.title?.trim() || "Untitled note",
      ...bookmarkSortFields({ title: dto.title?.trim() || "Untitled note" }),
      notes: dto.notes ?? "",
      noteDocument: dto.noteDocument,
    }
    const include = { tags: true, folder: { select: folderSummary } }
    try {
      // A stable client-generated UUID makes retries safe after a lost response.
      return await this.prisma.bookmark.upsert({
        where,
        create: {
          id,
          userId,
          folderId: dto.folderId || null,
          type: BookmarkType.NOTE,
          metadataStatus: MetadataStatus.COMPLETED,
          ...data,
        },
        update: data,
        include,
      })
    } catch (error) {
      const code = (error as { code?: string }).code
      if (code !== "P2002" && code !== "P2025") throw error
      // An existing ID is writable only by its owner, and only while it is an active note.
      const note = await this.prisma.bookmark.findFirst({ where })
      if (!note) throw new NotFoundException("Note not found")
      return this.prisma.bookmark.update({ where, data, include })
    }
  }

  async refreshEnrichment(userId: string, id: string) {
    const bookmark = await this.prisma.bookmark.findFirst({
      where: { id, userId, deletedAt: null },
    })

    if (!bookmark) {
      throw new NotFoundException("Bookmark not found")
    }

    const updated = await this.prisma.bookmark.update({
      where: { id: bookmark.id },
      data: {
        metadataStatus: MetadataStatus.PENDING,
        metadataError: null,
      },
      include: {
        tags: true,
        folder: { select: folderSummary },
      },
    })

    try {
      await this.enrichmentQueue.add("enrich", {
        bookmarkId: bookmark.id,
        url: bookmark.url,
      })
    } catch (err: any) {
      this.logger.error(
        `Failed to queue refresh enrichment job for ${bookmark.id}: ${err.message}`
      )
    }

    return updated
  }

  async findAll(
    userId: string,
    filters: {
      folderId?: string
      isFavorite?: boolean
      isArchived?: boolean
      isTrash?: boolean
      tag?: string
      search?: string
      cursor?: string
      limit?: number
      status?: string
      type?: BookmarkType
      contentType?: BookmarkContentType
      sort?: BookmarkSort
    }
  ) {
    if (filters.sort !== undefined && !Object.values(BookmarkSort).includes(filters.sort)) {
      throw new BadRequestException("Invalid bookmark sort")
    }
    if (filters.limit !== undefined && (!Number.isInteger(filters.limit) || filters.limit < 1 || filters.limit > 100)) {
      throw new BadRequestException("Limit must be an integer between 1 and 100")
    }
    // ponytail: single where condition handles both active items and trash
    const where: any = {
      userId,
      deletedAt: filters.isTrash ? { not: null } : null,
    }

    if (filters.type) {
      where.type = filters.type
    }

    if (filters.contentType) {
      where.contentType = filters.contentType
    }

    if (filters.folderId) {
      const folder = await this.prisma.folder.findFirst({
        where: { id: filters.folderId, ...accessibleFolder(userId) },
        select: { id: true },
      })
      if (!folder) throw new NotFoundException("Folder not found")
      where.folderId = filters.folderId
      if (!filters.isTrash) {
        delete where.userId
        where.AND = [{ OR: [{ userId }, { type: BookmarkType.BOOKMARK }] }]
      }
    }

    if (filters.isFavorite !== undefined) {
      where.isFavorite = filters.isFavorite
    }

    if (filters.isArchived !== undefined) {
      where.isArchived = filters.isArchived
    }

    if (filters.status) {
      where.status = filters.status
      if (filters.status === "BROKEN" || filters.status === "REDIRECTED") {
        where.type = BookmarkType.BOOKMARK
        where.url = { not: null }
      }
    }

    if (filters.tag) {
      where.tags = {
        some: {
          name: filters.tag.trim().toLowerCase(),
        },
      }
    }

    if (filters.search) {
      if (!filters.folderId && !filters.isTrash && filters.isFavorite === undefined && filters.isArchived === undefined && !filters.tag && !filters.status && !filters.type && !filters.contentType) {
        // Only unscoped global search adds shared links; scoped personal queues stay personal.
        delete where.userId
        where.AND = [{ OR: [{ userId }, { type: BookmarkType.BOOKMARK, folder: { is: accessibleFolder(userId) } }] }]
      }
      where.OR = [
        { title: { contains: filters.search, mode: "insensitive" } },
        { description: { contains: filters.search, mode: "insensitive" } },
        { AND: [{ userId }, { notes: { contains: filters.search, mode: "insensitive" } }] },
        { url: { contains: filters.search, mode: "insensitive" } },
      ]
    }

    const take = filters.limit
    const findParams: any = {
      where,
      include: {
        tags: true,
        folder: { select: folderSummary },
      },
      orderBy: bookmarkOrderBy(filters.sort),
    }

    if (take !== undefined) {
      findParams.take = take + 1
      if (filters.cursor) {
        findParams.cursor = { id: filters.cursor }
        findParams.skip = 1
      }
    }

    const itemsPromise = this.prisma.bookmark.findMany(findParams)
    const countPromise = filters.cursor
      ? Promise.resolve(undefined)
      : this.prisma.bookmark.count({ where })

    const [items, totalCount] = await Promise.all([itemsPromise, countPromise])

    let nextCursor: string | null = null
    let slicedItems = items
    if (take !== undefined) {
      if (items.length > take) {
        nextCursor = items[take - 1].id
      }
      slicedItems = items.slice(0, take)
    }

    return {
      data: slicedItems.map((item) => ({
        ...item,
        notes: item.userId === userId ? item.notes : null,
        noteDocument: item.userId === userId ? item.noteDocument : null,
        canEdit: item.userId === userId,
      })),
      nextCursor,
      totalCount,
    }
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
        folder: { select: folderSummary },
      },
    })

    if (!bookmark) {
      throw new NotFoundException("Bookmark not found")
    }

    return bookmark
  }

  async update(
    userId: string,
    id: string,
    updateBookmarkDto: UpdateBookmarkDto
  ) {
    await this.findOne(userId, id) // check existence

    // Check folder ownership if folderId is updated
    if (updateBookmarkDto.folderId) {
      const folder = await this.prisma.folder.findFirst({
        where: { id: updateBookmarkDto.folderId, ...accessibleFolder(userId) },
      })
      if (!folder) {
        throw new NotFoundException("Target folder not found")
      }
    }

    // Prep tags set/connectOrCreate
    const tagConnectOrCreate = updateBookmarkDto.tags?.map((name) => {
      const formatted = name.trim().toLowerCase()
      return {
        where: { name_userId: { name: formatted, userId } },
        create: { name: formatted, userId },
      }
    })

    return this.prisma.bookmark.update({
      where: { id },
      data: {
        type: updateBookmarkDto.type,
        url: updateBookmarkDto.url,
        title: updateBookmarkDto.title,
        description: updateBookmarkDto.description,
        notes: updateBookmarkDto.notes,
        ...bookmarkSortFields(updateBookmarkDto),
        isPinned: updateBookmarkDto.isPinned,
        isFavorite: updateBookmarkDto.isFavorite,
        isArchived: updateBookmarkDto.isArchived,
        folderId:
          updateBookmarkDto.folderId !== undefined
            ? updateBookmarkDto.folderId || null
            : undefined,
        tags: tagConnectOrCreate
          ? {
              set: [],
              connectOrCreate: tagConnectOrCreate,
            }
          : undefined,
      },
      include: {
        tags: true,
        folder: { select: folderSummary },
      },
    })
  }

  async remove(userId: string, id: string) {
    await this.findOne(userId, id) // check existence

    return this.prisma.bookmark.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    })
  }

  // ponytail: restore soft-deleted bookmark; detach orphaned folder if folder was deleted
  async restore(userId: string, id: string) {
    const bookmark = await this.prisma.bookmark.findFirst({
      where: { id, userId, deletedAt: { not: null } },
    })

    if (!bookmark) {
      throw new NotFoundException("Bookmark not found in trash")
    }

    let folderId = bookmark.folderId
    if (folderId) {
      const folder = await this.prisma.folder.findFirst({
        where: { id: folderId, ...accessibleFolder(userId) },
      })
      if (!folder) {
        folderId = null
      }
    }

    return this.prisma.bookmark.update({
      where: { id },
      data: {
        deletedAt: null,
        folderId,
      },
      include: {
        tags: true,
        folder: { select: folderSummary },
      },
    })
  }

  // ponytail: bulk restore via updateMany
  async bulkRestore(userId: string, ids: string[]) {
    const result = await this.prisma.bookmark.updateMany({
      where: {
        id: { in: ids },
        userId,
        deletedAt: { not: null },
      },
      data: {
        deletedAt: null,
      },
    })
    return { restored: result.count }
  }

  // ponytail: bulk soft delete via updateMany
  async bulkTrash(userId: string, ids: string[]) {
    const result = await this.prisma.bookmark.updateMany({
      where: {
        id: { in: ids },
        userId,
        deletedAt: null,
      },
      data: {
        deletedAt: new Date(),
      },
    })
    return { trashed: result.count }
  }

  // ponytail: bulk archive via updateMany
  async bulkArchive(userId: string, ids: string[], isArchived = true) {
    const result = await this.prisma.bookmark.updateMany({
      where: {
        id: { in: ids },
        userId,
        deletedAt: null,
      },
      data: {
        isArchived,
      },
    })
    return { updated: result.count }
  }

  // ponytail: bulk move folder via updateMany
  async bulkMove(userId: string, ids: string[], folderId?: string | null) {
    if (folderId) {
      const folder = await this.prisma.folder.findFirst({
        where: { id: folderId, ...accessibleFolder(userId) },
      })
      if (!folder) throw new NotFoundException("Folder not found")
    }
    const result = await this.prisma.bookmark.updateMany({
      where: {
        id: { in: ids },
        userId,
        deletedAt: null,
      },
      data: {
        folderId: folderId || null,
      },
    })
    return { moved: result.count }
  }

  // ponytail: bulk add tags to bookmarks
  async bulkAddTags(userId: string, ids: string[], tagNames: string[]) {
    const cleanTags = tagNames
      .map((t) => t.replace(/^#/, "").trim().toLowerCase())
      .filter(Boolean)
    if (cleanTags.length === 0 || ids.length === 0) return { updated: 0 }

    const userBookmarks = await this.prisma.bookmark.findMany({
      where: { id: { in: ids }, userId, deletedAt: null },
      select: { id: true },
    })
    const validIds = userBookmarks.map((b) => b.id)
    if (validIds.length === 0) return { updated: 0 }

    const tags = await Promise.all(
      cleanTags.map((name) =>
        this.prisma.tag.upsert({
          where: { name_userId: { name, userId } },
          create: { name, userId },
          update: {},
        })
      )
    )

    await Promise.all(
      tags.map((tag) =>
        this.prisma.tag.update({
          where: { id: tag.id },
          data: {
            bookmarks: {
              connect: validIds.map((id) => ({ id })),
            },
          },
        })
      )
    )
    return { updated: validIds.length }
  }

  // ponytail: hard delete single bookmark from database
  async permanentDelete(userId: string, id: string) {
    const bookmark = await this.prisma.bookmark.findFirst({
      where: { id, userId },
    })

    if (!bookmark) {
      throw new NotFoundException("Bookmark not found")
    }

    return this.prisma.bookmark.delete({
      where: { id },
    })
  }

  // ponytail: bulk permanent delete via deleteMany
  async bulkPermanentDelete(userId: string, ids: string[]) {
    const result = await this.prisma.bookmark.deleteMany({
      where: {
        id: { in: ids },
        userId,
      },
    })
    return { deleted: result.count }
  }

  // ponytail: empty all items in trash via deleteMany
  async emptyTrash(userId: string) {
    const result = await this.prisma.bookmark.deleteMany({
      where: {
        userId,
        deletedAt: { not: null },
      },
    })
    return { deleted: result.count }
  }

  async importBookmarks(userId: string, htmlContent: string) {
    const lines = htmlContent.split("\n")
    let currentFolderId: string | null = null
    let importCount = 0

    for (const line of lines) {
      // 1. Match folder creation
      const folderMatch = line.match(/<H3[^>]*>([^<]+)<\/H3>/i)
      if (folderMatch) {
        const folderName = folderMatch[1].trim()
        const folder = await this.prisma.folder.create({
          data: { name: folderName, userId },
        })
        currentFolderId = folder.id
        continue
      }

      // 2. Close folder context
      if (line.includes("</DL>")) {
        currentFolderId = null
      }

      // 3. Match bookmark link
      const bookmarkMatch = line.match(
        /<A\s+HREF=["']([^"']+)["'][^>]*>([^<]+)<\/A>/i
      )
      if (bookmarkMatch) {
        const url = bookmarkMatch[1].trim()
        const title = bookmarkMatch[2].trim()

        // Check for tags attribute
        const tagsMatch = line.match(/TAGS=["']([^"']+)["']/i)
        const tags = tagsMatch
          ? tagsMatch[1]
              .split(",")
              .map((t) => t.trim())
              .filter((t) => t.length > 0)
          : []

        const newBookmark = await this.prisma.bookmark.create({
          data: {
            url,
            title,
            ...bookmarkSortFields({ title, url }),
            userId,
            folderId: currentFolderId,
            metadataStatus: MetadataStatus.PENDING,
            tags: {
              connectOrCreate: tags.map((name) => ({
                where: { name_userId: { name: name.toLowerCase(), userId } },
                create: { name: name.toLowerCase(), userId },
              })),
            },
          },
        })
        importCount++

        // Enqueue background enrichment job to fetch OpenGraph image, title, and description
        try {
          await this.enrichmentQueue.add("enrich", {
            bookmarkId: newBookmark.id,
            url: newBookmark.url,
          })
        } catch (err: any) {
          this.logger.error(
            `Failed to queue enrichment job for imported bookmark ${newBookmark.id}: ${err.message}`
          )
        }
      }
    }

    return { imported: importCount }
  }

  async exportBookmarks(userId: string) {
    const folders = await this.prisma.folder.findMany({
      where: { userId, deletedAt: null },
      include: {
        bookmarks: {
          where: { deletedAt: null, userId },
          include: { tags: true },
          orderBy: [{ position: "asc" }, { createdAt: "desc" }],
        },
      },
      orderBy: { name: "asc" },
    })

    const rootBookmarks = await this.prisma.bookmark.findMany({
      where: { userId, folderId: null, deletedAt: null },
      include: { tags: true },
      orderBy: [{ position: "asc" }, { createdAt: "desc" }],
    })

    const escapeHtml = (str: string) =>
      str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")

    let html = `<!DOCTYPE NETSCAPE-Bookmark-file-1>\n<!-- This is an automatically generated file. Do not edit! -->\n<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">\n<TITLE>Cabinet Bookmarks</TITLE>\n<H1>Bookmarks</H1>\n<DL><p>\n`

    for (const b of rootBookmarks) {
      if (!b.url) continue
      const tags = b.tags?.map((t) => t.name).join(",")
      const timestamp = Math.floor(b.createdAt.getTime() / 1000)
      html += `    <DT><A HREF="${escapeHtml(b.url)}" ADD_DATE="${timestamp}"${tags ? ` TAGS="${escapeHtml(tags)}"` : ""}>${escapeHtml(b.title || b.url)}</A>\n`
    }

    for (const f of folders) {
      const folderTime = Math.floor(f.createdAt.getTime() / 1000)
      html += `    <DT><H3 ADD_DATE="${folderTime}">${escapeHtml(f.name)}</H3>\n    <DL><p>\n`
      for (const b of f.bookmarks) {
        if (!b.url) continue
        const tags = b.tags?.map((t) => t.name).join(",")
        const timestamp = Math.floor(b.createdAt.getTime() / 1000)
        html += `        <DT><A HREF="${escapeHtml(b.url)}" ADD_DATE="${timestamp}"${tags ? ` TAGS="${escapeHtml(tags)}"` : ""}>${escapeHtml(b.title || b.url)}</A>\n`
      }
      html += `    </DL><p>\n`
    }

    html += `</DL><p>\n`
    return html
  }

  async scrapeUrl(url: string) {
    return this.metadataService.extract(url)
  }

  async getHealthSummary(userId: string) {
    const total = await this.prisma.bookmark.count({
      where: { userId, deletedAt: null },
    })
    const linkWhere = {
      userId,
      type: BookmarkType.BOOKMARK,
      url: { not: null },
      deletedAt: null,
    }
    const broken = await this.prisma.bookmark.count({
      where: { ...linkWhere, status: "BROKEN" },
    })
    const redirected = await this.prisma.bookmark.count({
      where: { ...linkWhere, status: "REDIRECTED" },
    })
    const favorites = await this.prisma.bookmark.count({
      where: { userId, isFavorite: true, deletedAt: null },
    })
    const archived = await this.prisma.bookmark.count({
      where: { userId, isArchived: true, deletedAt: null },
    })
    const trash = await this.prisma.bookmark.count({
      where: { userId, deletedAt: { not: null } },
    })

    const duplicatesGrouped = await this.prisma.bookmark.groupBy({
      by: ["url"],
      where: { userId, deletedAt: null },
      _count: { url: true },
      having: {
        url: {
          _count: {
            gt: 1,
          },
        },
      },
    })
    const duplicates = duplicatesGrouped.length

    return { total, broken, redirected, favorites, archived, duplicates, trash }
  }

  async getDuplicates(userId: string) {
    const duplicatesGrouped = await this.prisma.bookmark.groupBy({
      by: ["url"],
      where: { userId, deletedAt: null },
      _count: { url: true },
      having: {
        url: {
          _count: { gt: 1 },
        },
      },
    })

    const urls = duplicatesGrouped.map((g) => g.url)
    const bookmarks = await this.prisma.bookmark.findMany({
      where: {
        userId,
        deletedAt: null,
        url: { in: urls },
      },
      include: {
        tags: true,
        folder: { select: folderSummary },
      },
      orderBy: { createdAt: "desc" },
    })

    return urls.map((url) => ({
      url,
      bookmarks: bookmarks.filter((b) => b.url === url),
    }))
  }

  async cleanDuplicates(userId: string) {
    const duplicatesGrouped = await this.prisma.bookmark.groupBy({
      by: ["url"],
      where: { userId, deletedAt: null },
      _count: { url: true },
      having: {
        url: {
          _count: { gt: 1 },
        },
      },
    })

    const urls = duplicatesGrouped.map((g) => g.url)
    if (urls.length === 0) {
      return { deleted: 0 }
    }

    const allDuplicates = await this.prisma.bookmark.findMany({
      where: { userId, url: { in: urls }, deletedAt: null },
      orderBy: { createdAt: "asc" },
    })

    const seenUrls = new Set<string>()
    const idsToDelete: string[] = []

    for (const item of allDuplicates) {
      if (seenUrls.has(item.url)) {
        idsToDelete.push(item.id)
      } else {
        seenUrls.add(item.url)
      }
    }

    if (idsToDelete.length > 0) {
      await this.prisma.bookmark.updateMany({
        where: { id: { in: idsToDelete } },
        data: { deletedAt: new Date() },
      })
    }

    return { deleted: idsToDelete.length }
  }

  async enrichMissingMetadata(userId?: string) {
    const where: any = {
      deletedAt: null,
      OR: [
        { imageUrl: null },
        { description: null },
        { metadataStatus: MetadataStatus.PENDING },
      ],
    }
    if (userId) {
      where.userId = userId
    }

    const bookmarks = await this.prisma.bookmark.findMany({
      where,
      take: 100,
      orderBy: { createdAt: "desc" },
    })

    let queuedCount = 0
    for (const b of bookmarks) {
      try {
        await this.enrichmentQueue.add("enrich", {
          bookmarkId: b.id,
          url: b.url,
        })
        queuedCount++
      } catch (err: any) {
        this.logger.error(
          `Failed to queue missing metadata enrichment for ${b.id}: ${err.message}`
        )
      }
    }

    this.logger.log(
      `Queued ${queuedCount} bookmarks for missing metadata enrichment (found ${bookmarks.length})`
    )
    return { queued: queuedCount, totalFound: bookmarks.length }
  }

  async triggerHealthCheck(userId: string) {
    // ponytail: trigger runScan and enrichMissingMetadata asynchronously to prevent blocking the HTTP response
    this.linkCheckerService.runScan().catch((err) => {
      console.error("Triggered health scan failed", err)
    })
    this.enrichMissingMetadata(userId).catch((err) => {
      console.error("Triggered missing metadata enrichment failed", err)
    })
    return {
      success: true,
      message:
        "Health scan and missing metadata enrichment started in background",
    }
  }

  async reorder(userId: string, ids: string[]) {
    await this.prisma.$transaction(async (tx) => {
      const bookmarks = await tx.bookmark.findMany({
        where: { userId, deletedAt: null },
        select: { id: true, isPinned: true },
        orderBy: [{ position: "asc" }, { createdAt: "desc" }, { id: "asc" }],
      })
      const moved = new Set(ids)
      const owned = new Set(bookmarks.filter((bookmark) => !bookmark.isPinned).map((bookmark) => bookmark.id))
      if (moved.size !== ids.length || ids.some((id) => !owned.has(id))) {
        throw new BadRequestException("Invalid bookmark order")
      }

      // Keep filtered/unloaded bookmarks in their slots, not interleaved at position 0.
      // ponytail: renumber the library; use sparse ranks if library size makes this costly.
      let next = 0
      await Promise.all(bookmarks.map((bookmark, position) =>
        bookmark.isPinned ? undefined : tx.bookmark.updateMany({
          where: { id: moved.has(bookmark.id) ? ids[next++] : bookmark.id, userId, isPinned: false },
          data: { position },
        })
      ))
    })
    return { success: true }
  }

  async proxyImage(imageUrl: string, res: Response) {
    let parsedUrl: URL
    try {
      parsedUrl = await validatePublicUrl(imageUrl)
    } catch (err: any) {
      return res
        .status(400)
        .send(`Invalid or disallowed image URL: ${err.message}`)
    }

    try {
      const response = await axios.get(parsedUrl.href, {
        responseType: "stream",
        timeout: 10000,
        headers: {
          // Reddit's share endpoint returns a generic logo to desktop browsers.
          "User-Agent":
            parsedUrl.hostname === "share.redd.it"
              ? CRAWLER_USER_AGENTS.WHATSAPP
              : "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
          Accept:
            "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
          Referer: parsedUrl.origin,
        },
        maxRedirects: 5,
        beforeRedirect: async (options) => {
          await validatePublicUrl(options.href)
        },
        validateStatus: (status) => status >= 200 && status < 400,
      })

      const contentType = response.headers["content-type"]
        ? String(response.headers["content-type"])
        : "image/jpeg"
      const contentLength = response.headers["content-length"]
        ? String(response.headers["content-length"])
        : undefined

      res.setHeader("Content-Type", contentType)
      if (contentLength) {
        res.setHeader("Content-Length", contentLength)
      }
      res.setHeader(
        "Cache-Control",
        "public, max-age=86400, s-maxage=86400, immutable"
      )
      res.setHeader("Access-Control-Allow-Origin", "*")

      response.data.pipe(res)
    } catch (error: any) {
      return res.status(502).send(`Failed to proxy image: ${error.message}`)
    }
  }

  async extractMedia(url: string) {
    return this.cabinetMediaService.extract(url)
  }

  async downloadMedia(dto: DownloadMediaDto, res: Response) {
    return this.cabinetMediaService.download(dto, res)
  }
}
