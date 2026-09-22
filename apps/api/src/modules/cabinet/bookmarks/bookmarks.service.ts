import {
  Injectable,
  NotFoundException,
  Inject,
  forwardRef,
  Logger,
  OnModuleInit,
} from "@nestjs/common"
import { InjectQueue } from "@nestjs/bullmq"
import { Queue } from "bullmq"
import {
  BookmarkProvider,
  BookmarkType,
  BookmarkContentType,
  MetadataStatus,
} from "@prisma/client"
import { Response } from "express"
import axios from "axios"
import { PrismaService } from "../../../prisma/prisma.service"
import { MetadataService } from "../services/metadata.service"
import { LinkCheckerService } from "../services/link-checker.service"
import { RedditProvider } from "../providers/reddit.provider"
import { ReaderService } from "../services/reader.service"
import { CabinetMediaService } from "../services/cabinet-media.service"
import { CreateBookmarkDto } from "./dto/create-bookmark.dto"
import { UpdateBookmarkDto } from "./dto/update-bookmark.dto"
import { DownloadMediaDto } from "../dto/download-media.dto"

@Injectable()
export class BookmarksService implements OnModuleInit {
  private readonly logger = new Logger(BookmarksService.name)

  constructor(
    private prisma: PrismaService,
    private metadataService: MetadataService,
    @Inject(forwardRef(() => LinkCheckerService))
    private linkCheckerService: LinkCheckerService,
    private redditProvider: RedditProvider,
    private readerService: ReaderService,
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

    let extracted: any = {}
    let detectedProvider: BookmarkProvider | null = null
    let contentType: BookmarkContentType | null = null

    if (!isNote && createBookmarkDto.url) {
      extracted = await this.metadataService.extract(createBookmarkDto.url)
      try {
        const urlObj = new URL(createBookmarkDto.url)
        if (this.redditProvider.supports(urlObj)) {
          detectedProvider = BookmarkProvider.REDDIT
        }
      } catch {
        // Ignore invalid URL parsing errors here, handled downstream
      }

      if (this.cabinetMediaService.isVideoUrl(createBookmarkDto.url)) {
        contentType = BookmarkContentType.VIDEO
      }
    }

    // 2. Prep tags
    const tagConnectOrCreate =
      createBookmarkDto.tags?.map((name) => {
        const formatted = name.trim().toLowerCase()
        return {
          where: { name: formatted },
          create: { name: formatted },
        }
      }) || []

    // 3. Check folder ownership if folderId is specified
    if (createBookmarkDto.folderId) {
      const folder = await this.prisma.folder.findFirst({
        where: { id: createBookmarkDto.folderId, userId, deletedAt: null },
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
        description:
          createBookmarkDto.description || extracted.description || null,
        notes: createBookmarkDto.notes || null,
        imageUrl: extracted.imageUrl || null,
        faviconUrl: extracted.faviconUrl || null,
        siteName: extracted.siteName || null,
        metadata: extracted.embedHtml ? { embedHtml: extracted.embedHtml } : undefined,
        folderId: createBookmarkDto.folderId || null,
        userId,
        provider: detectedProvider,
        contentType: contentType || (isNote ? null : undefined),
        metadataStatus: isNote ? MetadataStatus.COMPLETED : MetadataStatus.PENDING,
        tags: {
          connectOrCreate: tagConnectOrCreate,
        },
      },
      include: {
        tags: true,
        folder: true,
        article: {
          select: {
            id: true,
            author: true,
            publishedAt: true,
            readingTimeMinutes: true,
            wordCount: true,
            waybackUrl: true,
            isRead: true,
            scrollProgress: true,
          },
        },
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
        folder: true,
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
    }
  ) {
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
      where.folderId = filters.folderId
    }

    if (filters.isFavorite !== undefined) {
      where.isFavorite = filters.isFavorite
    }

    if (filters.isArchived !== undefined) {
      where.isArchived = filters.isArchived
    }

    if (filters.status) {
      where.status = filters.status
    }

    if (filters.tag) {
      where.tags = {
        some: {
          name: filters.tag.trim().toLowerCase(),
        },
      }
    }

    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: "insensitive" } },
        { description: { contains: filters.search, mode: "insensitive" } },
        { notes: { contains: filters.search, mode: "insensitive" } },
        { url: { contains: filters.search, mode: "insensitive" } },
      ]
    }

    const take = filters.limit
    const findParams: any = {
      where,
      include: {
        tags: true,
        folder: true,
        article: {
          select: {
            id: true,
            author: true,
            publishedAt: true,
            readingTimeMinutes: true,
            wordCount: true,
            waybackUrl: true,
            isRead: true,
            scrollProgress: true,
          },
        },
      },
      orderBy: [{ position: "asc" }, { createdAt: "desc" }],
    }

    if (take !== undefined) {
      findParams.take = take + 1
      if (filters.cursor) {
        findParams.cursor = { id: filters.cursor }
        findParams.skip = 1
      }
    }

    const items = await this.prisma.bookmark.findMany(findParams)
    const totalCount = await this.prisma.bookmark.count({ where })

    let nextCursor: string | null = null
    let slicedItems = items
    if (take !== undefined) {
      if (items.length > take) {
        nextCursor = items[take - 1].id
      }
      slicedItems = items.slice(0, take)
    }

    return {
      data: slicedItems,
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
        folder: true,
        article: {
          select: {
            id: true,
            author: true,
            publishedAt: true,
            readingTimeMinutes: true,
            wordCount: true,
            waybackUrl: true,
            isRead: true,
            scrollProgress: true,
          },
        },
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
        where: { id: updateBookmarkDto.folderId, userId, deletedAt: null },
      })
      if (!folder) {
        throw new NotFoundException("Target folder not found")
      }
    }

    // Prep tags set/connectOrCreate
    const tagConnectOrCreate = updateBookmarkDto.tags?.map((name) => {
      const formatted = name.trim().toLowerCase()
      return {
        where: { name: formatted },
        create: { name: formatted },
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
        folder: true,
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
        where: { id: folderId, userId, deletedAt: null },
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
        folder: true,
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

  async exportBookmarks(userId: string): Promise<string> {
    const folders = await this.prisma.folder.findMany({
      where: { userId, deletedAt: null },
      include: {
        bookmarks: {
          where: { deletedAt: null },
          include: { tags: true },
        },
      },
    })

    const rootBookmarks = await this.prisma.bookmark.findMany({
      where: { userId, folderId: null, deletedAt: null },
      include: { tags: true },
    })

    let html = `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<!-- This is an automatically generated file.
     It will be read and imported by browsers and bookmark managers. -->
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>Bookmarks</TITLE>
<H1>Bookmarks</H1>
<DL><p>
`

    for (const folder of folders) {
      html += `    <DT><H3 ADD_DATE="${Math.floor(folder.createdAt.getTime() / 1000)}">${folder.name}</H3>\n    <DL><p>\n`
      for (const bookmark of folder.bookmarks) {
        const tagStr = bookmark.tags.map((t) => t.name).join(",")
        html += `        <DT><A HREF="${bookmark.url}" ADD_DATE="${Math.floor(bookmark.createdAt.getTime() / 1000)}" TAGS="${tagStr}">${bookmark.title}</A>\n`
        if (bookmark.description) {
          html += `        <DD>${bookmark.description}\n`
        }
      }
      html += `    </DL><p>\n`
    }

    for (const bookmark of rootBookmarks) {
      const tagStr = bookmark.tags.map((t) => t.name).join(",")
      html += `    <DT><A HREF="${bookmark.url}" ADD_DATE="${Math.floor(bookmark.createdAt.getTime() / 1000)}" TAGS="${tagStr}">${bookmark.title}</A>\n`
      if (bookmark.description) {
        html += `    <DD>${bookmark.description}\n`
      }
    }

    html += `</DL><p>\n`
    return html
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
            userId,
            folderId: currentFolderId,
            metadataStatus: MetadataStatus.PENDING,
            tags: {
              connectOrCreate: tags.map((name) => ({
                where: { name: name.toLowerCase() },
                create: { name: name.toLowerCase() },
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

  async scrapeUrl(url: string) {
    return this.metadataService.extract(url)
  }

  async getHealthSummary(userId: string) {
    const total = await this.prisma.bookmark.count({
      where: { userId, deletedAt: null },
    })
    const broken = await this.prisma.bookmark.count({
      where: { userId, status: "BROKEN", deletedAt: null },
    })
    const redirected = await this.prisma.bookmark.count({
      where: { userId, status: "REDIRECTED", deletedAt: null },
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
        folder: true,
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
      message: "Health scan and missing metadata enrichment started in background",
    }
  }

  async reorder(userId: string, ids: string[]) {
    await this.prisma.$transaction(
      ids.map((id, index) =>
        this.prisma.bookmark.updateMany({
          where: { id, userId },
          data: { position: index },
        })
      )
    )
    return { success: true }
  }

  async proxyImage(imageUrl: string, res: Response) {
    if (
      !imageUrl ||
      (!imageUrl.startsWith("http://") && !imageUrl.startsWith("https://"))
    ) {
      return res.status(400).send("Invalid or non-HTTP image URL")
    }

    try {
      const response = await axios.get(imageUrl, {
        responseType: "stream",
        timeout: 10000,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
          Accept:
            "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
          Referer: new URL(imageUrl).origin,
        },
        maxRedirects: 5,
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

  async getArticle(userId: string, id: string) {
    const bookmark = await this.prisma.bookmark.findFirst({
      where: { id, userId, deletedAt: null },
      include: { article: true },
    })

    if (!bookmark) {
      throw new NotFoundException("Bookmark not found")
    }

    if (bookmark.article && bookmark.article.contentHtml) {
      return bookmark.article
    }

    // On-demand article extraction if not yet cached in background
    const extracted = await this.readerService.extractArticle(bookmark.url)
    if (!extracted) {
      throw new NotFoundException("No readable article content found for this bookmark URL")
    }

    return this.prisma.bookmarkArticle.upsert({
      where: { bookmarkId: id },
      create: {
        bookmarkId: id,
        author: extracted.author,
        publishedAt: extracted.publishedAt,
        readingTimeMinutes: extracted.readingTimeMinutes,
        wordCount: extracted.wordCount,
        contentHtml: extracted.contentHtml,
        contentMarkdown: extracted.contentMarkdown,
        waybackUrl: extracted.waybackUrl,
      },
      update: {
        author: extracted.author,
        publishedAt: extracted.publishedAt,
        readingTimeMinutes: extracted.readingTimeMinutes,
        wordCount: extracted.wordCount,
        contentHtml: extracted.contentHtml,
        contentMarkdown: extracted.contentMarkdown,
        waybackUrl: extracted.waybackUrl,
      },
    })
  }

  async updateArticleProgress(
    userId: string,
    id: string,
    dto: { scrollProgress?: number; isRead?: boolean }
  ) {
    const bookmark = await this.prisma.bookmark.findFirst({
      where: { id, userId, deletedAt: null },
      include: { article: true },
    })

    if (!bookmark) {
      throw new NotFoundException("Bookmark not found")
    }

    if (!bookmark.article) {
      throw new NotFoundException("Article record not found for this bookmark")
    }

    const data: any = {}
    if (dto.scrollProgress !== undefined) {
      data.scrollProgress = Math.min(100, Math.max(0, dto.scrollProgress))
    }
    if (dto.isRead !== undefined) {
      data.isRead = dto.isRead
      data.readAt = dto.isRead ? new Date() : null
    }

    return this.prisma.bookmarkArticle.update({
      where: { bookmarkId: id },
      data,
    })
  }

  async extractMedia(url: string) {
    return this.cabinetMediaService.extract(url)
  }

  async downloadMedia(dto: DownloadMediaDto, res: Response) {
    return this.cabinetMediaService.download(dto, res)
  }
}
