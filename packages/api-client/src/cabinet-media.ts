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

  download: async (payload: DownloadMediaPayload): Promise<Blob> => {
    const res = await AXIOS_INSTANCE.post<Blob>(
      "/v1/bookmarks/media/download",
      payload,
      {
        responseType: "blob",
      }
    )
    return res.data
  },
}
