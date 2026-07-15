import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { DownloadMediaDto } from './dto/download-media.dto';
import { UpdateHistoryDto } from './dto/update-history.dto';
import { CreateCollectionDto } from './dto/create-collection.dto';
import { spawn } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import { Response } from 'express';

@Injectable()
export class FetchService {
  constructor(private readonly prisma: PrismaService) {}

  private runSpawn(cmd: string, args: string[]): Promise<string> {
    return new Promise((resolve, reject) => {
      const child = spawn(cmd, args);
      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        if (code === 0) {
          resolve(stdout);
        } else {
          reject(new Error(`Command failed with code ${code}. Stderr: ${stderr}`));
        }
      });
    });
  }

  private detectPlatform(url: string): string {
    try {
      const host = new URL(url).hostname.toLowerCase();
      if (host.includes('youtube.com') || host.includes('youtu.be')) return 'YouTube';
      if (host.includes('tiktok.com')) return 'TikTok';
      if (host.includes('instagram.com')) return 'Instagram';
      if (host.includes('threads.net')) return 'Threads';
      if (host.includes('facebook.com')) return 'Facebook';
      if (host.includes('twitter.com') || host.includes('x.com')) return 'Twitter';
      if (host.includes('reddit.com')) return 'Reddit';
      if (host.includes('vimeo.com')) return 'Vimeo';
      if (host.includes('pinterest.com')) return 'Pinterest';
      return 'Other';
    } catch {
      return 'Other';
    }
  }

  async extract(url: string) {
    try {
      // Run yt-dlp to get video metadata in JSON format
      const rawJson = await this.runSpawn('yt-dlp', ['-j', '--no-warnings', url]);
      const data = JSON.parse(rawJson);

      const formats = (data.formats || [])
        .map((f: any) => {
          // Calculate approx size
          const size = f.filesize || f.filesize_approx || null;
          let resolution = 'Audio only';
          if (f.vcodec !== 'none') {
            resolution = f.resolution || `${f.width}x${f.height}` || 'Video';
          }
          return {
            formatId: f.format_id,
            ext: f.ext,
            resolution,
            filesize: size,
            note: f.format_note || f.format || '',
            hasVideo: f.vcodec !== 'none',
            hasAudio: f.acodec !== 'none',
          };
        })
        .filter((f: any) => f.formatId);

      return {
        title: data.title || 'Untitled Media',
        author: data.uploader || data.channel || null,
        duration: data.duration || null,
        thumbnail: data.thumbnail || null,
        platform: this.detectPlatform(url),
        formats,
      };
    } catch (err: any) {
      throw new InternalServerErrorException(`Failed to extract metadata: ${err.message}`);
    }
  }

  async download(userId: string, dto: DownloadMediaDto, res: Response) {
    const tempDir = path.join(process.cwd(), 'scratch');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const fileId = Math.random().toString(36).substring(7);
    const outputExt = dto.mediaType === 'AUDIO' ? 'mp3' : 'mp4';
    const tempFilePath = path.join(tempDir, `fetch-${fileId}.${outputExt}`);

    // Build yt-dlp arguments safely
    const args: string[] = [];

    if (dto.mediaType === 'AUDIO') {
      args.push(
        '-f',
        dto.formatId || 'bestaudio/best',
        '-x',
        '--audio-format',
        'mp3',
        '-o',
        tempFilePath,
        dto.url
      );
    } else {
      args.push(
        '-f',
        dto.formatId || 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best',
        '--merge-output-format',
        'mp4',
        '-o',
        tempFilePath,
        dto.url
      );
    }

    try {
      // Invalidate if yt-dlp is not completed in 3 mins
      const child = spawn('yt-dlp', args);

      await new Promise<void>((resolve, reject) => {
        child.on('close', (code) => {
          if (code === 0) resolve();
          else reject(new Error(`yt-dlp exited with code ${code}`));
        });
        child.on('error', (err) => reject(err));
      });

      if (!fs.existsSync(tempFilePath)) {
        throw new NotFoundException('Downloaded file was not created by yt-dlp');
      }

      // Check size
      const stats = fs.statSync(tempFilePath);
      const fileSize = stats.size;

      // Extract metadata for log
      let resolution: string | null = null;
      let author: string | null = null;
      let thumbnail: string | null = null;
      try {
        const meta = await this.extract(dto.url);
        author = meta.author;
        thumbnail = meta.thumbnail;
        const selectedFormat = meta.formats.find((f) => f.formatId === dto.formatId);
        resolution = selectedFormat ? selectedFormat.resolution : null;
      } catch {
        // Silently continue if metadata extraction fails for history log
      }

      // Save to database FetchHistory
      await this.prisma.fetchHistory.create({
        data: {
          userId,
          url: dto.url,
          title: dto.title,
          author,
          platform: this.detectPlatform(dto.url),
          mediaType: dto.mediaType,
          fileSize,
          resolution,
          thumbnail,
        },
      });

      // Stream download to browser and clean up
      const safeTitle = dto.title.replace(/[^\w\s-]/gi, '').trim() || 'download';
      const downloadFilename = `${safeTitle}.${outputExt}`;

      res.setHeader('Content-Type', dto.mediaType === 'AUDIO' ? 'audio/mpeg' : 'video/mp4');
      res.setHeader('Content-Disposition', `attachment; filename="${downloadFilename}"`);
      res.setHeader('Content-Length', fileSize.toString());

      const fileStream = fs.createReadStream(tempFilePath);
      fileStream.pipe(res);

      fileStream.on('end', () => {
        fs.unlink(tempFilePath, () => {});
      });

      fileStream.on('error', () => {
        fs.unlink(tempFilePath, () => {});
      });

    } catch (err: any) {
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
      throw new InternalServerErrorException(`Download process failed: ${err.message}`);
    }
  }

  async getHistory(
    userId: string,
    search?: string,
    platform?: string,
    isFavorite?: boolean,
    collectionId?: string
  ) {
    const where: any = {
      userId,
      deletedAt: null,
    };

    if (search) {
      where.title = {
        contains: search,
        mode: 'insensitive',
      };
    }

    if (platform) {
      where.platform = platform;
    }

    if (isFavorite !== undefined) {
      where.isFavorite = isFavorite;
    }

    if (collectionId) {
      where.collectionId = collectionId === 'none' ? null : collectionId;
    }

    return this.prisma.fetchHistory.findMany({
      where,
      include: {
        collection: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async updateHistory(userId: string, id: string, dto: UpdateHistoryDto) {
    const history = await this.prisma.fetchHistory.findFirst({
      where: { id, userId, deletedAt: null },
    });

    if (!history) {
      throw new NotFoundException(`History item with ID ${id} not found`);
    }

    const data: any = {};
    if (dto.notes !== undefined) data.notes = dto.notes;
    if (dto.isFavorite !== undefined) data.isFavorite = dto.isFavorite;
    if (dto.collectionId !== undefined) data.collectionId = dto.collectionId;

    return this.prisma.fetchHistory.update({
      where: { id },
      data,
      include: {
        collection: true,
      },
    });
  }

  async removeHistory(userId: string, id: string) {
    const history = await this.prisma.fetchHistory.findFirst({
      where: { id, userId, deletedAt: null },
    });

    if (!history) {
      throw new NotFoundException(`History item with ID ${id} not found`);
    }

    return this.prisma.fetchHistory.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });
  }

  async getCollections(userId: string) {
    return this.prisma.fetchCollection.findMany({
      where: { userId, deletedAt: null },
      orderBy: { name: 'asc' },
    });
  }

  async createCollection(userId: string, dto: CreateCollectionDto) {
    return this.prisma.fetchCollection.create({
      data: {
        userId,
        name: dto.name,
      },
    });
  }

  async removeCollection(userId: string, id: string) {
    const collection = await this.prisma.fetchCollection.findFirst({
      where: { id, userId, deletedAt: null },
    });

    if (!collection) {
      throw new NotFoundException(`Collection with ID ${id} not found`);
    }

    return this.prisma.fetchCollection.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });
  }
}
