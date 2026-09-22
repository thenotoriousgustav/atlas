import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  Logger,
} from "@nestjs/common"
import { spawn } from "child_process"
import * as path from "path"
import * as fs from "fs"
import { Response } from "express"
import { DownloadMediaDto } from "../dto/download-media.dto"

export interface ExtractedMediaFormat {
  formatId: string
  ext: string
  resolution: string
  filesize: number | null
  note: string
  hasVideo: boolean
  hasAudio: boolean
}

export interface ExtractedMediaInfo {
  title: string
  author: string | null
  duration: number | null
  thumbnail: string | null
  platform: string
  formats: ExtractedMediaFormat[]
}

@Injectable()
export class CabinetMediaService {
  private readonly logger = new Logger(CabinetMediaService.name)

  private runSpawn(cmd: string, args: string[]): Promise<string> {
    return new Promise((resolve, reject) => {
      const child = spawn(cmd, args)
      let stdout = ""
      let stderr = ""

      child.stdout.on("data", (data) => {
        stdout += data.toString()
      })

      child.stderr.on("data", (data) => {
        stderr += data.toString()
      })

      child.on("close", (code) => {
        if (code === 0) {
          resolve(stdout)
        } else {
          reject(new Error(`Command failed with code ${code}. Stderr: ${stderr}`))
        }
      })
    })
  }

  detectPlatform(url: string): string {
    try {
      const host = new URL(url).hostname.toLowerCase()
      if (host.includes("youtube.com") || host.includes("youtu.be")) return "YouTube"
      if (host.includes("tiktok.com")) return "TikTok"
      if (host.includes("instagram.com")) return "Instagram"
      if (host.includes("threads.net")) return "Threads"
      if (host.includes("facebook.com") || host.includes("fb.watch")) return "Facebook"
      if (host.includes("twitter.com") || host.includes("x.com")) return "Twitter"
      if (host.includes("reddit.com")) return "Reddit"
      if (host.includes("vimeo.com")) return "Vimeo"
      if (host.includes("pinterest.com")) return "Pinterest"
      return "Other"
    } catch {
      return "Other"
    }
  }

  isVideoUrl(url?: string | null): boolean {
    if (!url) return false
    const platform = this.detectPlatform(url)
    return platform !== "Other"
  }

  async extract(url: string): Promise<ExtractedMediaInfo> {
    try {
      const rawJson = await this.runSpawn("yt-dlp", ["-j", "--no-warnings", url])
      const data = JSON.parse(rawJson)

      const formats: ExtractedMediaFormat[] = (data.formats || [])
        .map((f: any) => {
          const size = f.filesize || f.filesize_approx || null
          let resolution = "Audio only"
          if (f.vcodec && f.vcodec !== "none") {
            resolution = f.resolution || `${f.width || ""}x${f.height || ""}` || "Video"
          }
          return {
            formatId: f.format_id,
            ext: f.ext,
            resolution,
            filesize: size,
            note: f.format_note || f.format || "",
            hasVideo: f.vcodec && f.vcodec !== "none",
            hasAudio: f.acodec && f.acodec !== "none",
          }
        })
        .filter((f: any) => f.formatId)

      return {
        title: data.title || "Untitled Video",
        author: data.uploader || data.channel || null,
        duration: data.duration || null,
        thumbnail: data.thumbnail || null,
        platform: this.detectPlatform(url),
        formats,
      }
    } catch (err: any) {
      this.logger.error(`yt-dlp extraction failed for ${url}: ${err.message}`)
      throw new InternalServerErrorException(
        `Failed to extract video info: ${err.message}`
      )
    }
  }

  async download(dto: DownloadMediaDto, res: Response): Promise<void> {
    const tempDir = path.join(process.cwd(), "scratch")
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true })
    }

    const fileId = Math.random().toString(36).substring(7)
    const outputExt = dto.mediaType === "AUDIO" ? "mp3" : "mp4"
    const tempFilePath = path.join(tempDir, `media-${fileId}.${outputExt}`)

    const args: string[] = []

    if (dto.mediaType === "AUDIO") {
      args.push(
        "-f",
        dto.formatId || "bestaudio/best",
        "-x",
        "--audio-format",
        "mp3",
        "-o",
        tempFilePath,
        dto.url
      )
    } else {
      args.push(
        "-f",
        dto.formatId || "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best",
        "--merge-output-format",
        "mp4",
        "-o",
        tempFilePath,
        dto.url
      )
    }

    try {
      const child = spawn("yt-dlp", args)

      await new Promise<void>((resolve, reject) => {
        child.on("close", (code) => {
          if (code === 0) resolve()
          else reject(new Error(`yt-dlp exited with code ${code}`))
        })
        child.on("error", (err) => reject(err))
      })

      if (!fs.existsSync(tempFilePath)) {
        throw new NotFoundException("Downloaded media file was not found")
      }

      const stats = fs.statSync(tempFilePath)
      const fileSize = stats.size

      const safeTitle = dto.title.replace(/[^\w\s-]/gi, "").trim() || "download"
      const downloadFilename = `${safeTitle}.${outputExt}`

      res.setHeader(
        "Content-Type",
        dto.mediaType === "AUDIO" ? "audio/mpeg" : "video/mp4"
      )
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${downloadFilename}"`
      )
      res.setHeader("Content-Length", fileSize.toString())

      const fileStream = fs.createReadStream(tempFilePath)
      fileStream.pipe(res)

      fileStream.on("end", () => {
        fs.unlink(tempFilePath, () => {})
      })

      fileStream.on("error", () => {
        fs.unlink(tempFilePath, () => {})
      })
    } catch (err: any) {
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath)
      }
      throw new InternalServerErrorException(
        `Media download failed: ${err.message}`
      )
    }
  }
}
