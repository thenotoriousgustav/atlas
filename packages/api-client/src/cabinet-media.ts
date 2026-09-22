import { AXIOS_INSTANCE } from "./custom-instance"

export interface MediaFormat {
  formatId: string
  ext: string
  resolution: string
  filesize: number | null
  note: string
  hasVideo: boolean
  hasAudio: boolean
}

export interface MediaInfo {
  title: string
  author: string | null
  duration: number | null
  thumbnail: string | null
  platform: string
  formats: MediaFormat[]
}

export interface DownloadMediaPayload {
  url: string
  formatId?: string
  mediaType: "VIDEO" | "AUDIO"
  title: string
}

export const cabinetMediaApi = {
  extract: async (url: string): Promise<MediaInfo> => {
    const res = await AXIOS_INSTANCE.get("/v1/bookmarks/media/extract", {
      params: { url },
    })
    return res.data?.data || res.data
  },

  download: async (payload: DownloadMediaPayload): Promise<void> => {
    const res = await AXIOS_INSTANCE.post("/v1/bookmarks/media/download", payload, {
      responseType: "blob",
    })
    const blob = new Blob([res.data])
    const downloadUrl = window.URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = downloadUrl
    const ext = payload.mediaType === "AUDIO" ? "mp3" : "mp4"
    const safeTitle = payload.title.replace(/[^\w\s-]/gi, "").trim() || "download"
    link.setAttribute("download", `${safeTitle}.${ext}`)
    document.body.appendChild(link)
    link.click()
    link.parentNode?.removeChild(link)
    window.URL.revokeObjectURL(downloadUrl)
  },

  getOEmbed: async (url: string): Promise<any | null> => {
    try {
      const res = await AXIOS_INSTANCE.get("/v1/bookmarks/oembed", {
        params: { url },
      })
      return res.data?.data || res.data
    } catch {
      return null
    }
  },
}
