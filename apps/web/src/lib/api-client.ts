"use client"

import {
  AXIOS_INSTANCE,
  cabinetMediaApi as sharedCabinetMediaApi,
  type DownloadMediaPayload,
} from "@cabinet/api-client"

export {
  AXIOS_INSTANCE,
  useBookmarksControllerCleanDuplicates,
  useBookmarksControllerCreate,
  useBookmarksControllerFindAll,
  useBookmarksControllerFindAllInfinite,
  useBookmarksControllerGetDuplicates,
  useBookmarksControllerGetHealthSummary,
  useBookmarksControllerImport,
  useBookmarksControllerExportBookmarks,
  useBookmarksControllerRemove,
  useBookmarksControllerReorder,
  useBookmarksControllerTriggerHealthCheck,
  useBookmarksControllerUpdate,
  useFoldersControllerCreate,
  useFoldersControllerFindAll,
  useFoldersControllerRemove,
  useFoldersControllerUpdate,
  useTagsControllerFindAll,
  useTagsControllerRemove,
} from "@cabinet/api-client"
export type { MediaFormat, MediaInfo } from "@cabinet/api-client"

export const cabinetMediaApi = {
  ...sharedCabinetMediaApi,
  download: async (payload: DownloadMediaPayload): Promise<void> => {
    const blob = await sharedCabinetMediaApi.download(payload)
    const downloadUrl = URL.createObjectURL(blob)
    const link = document.createElement("a")
    const extension = payload.mediaType === "AUDIO" ? "mp3" : "mp4"
    const title = payload.title.replace(/[^\w\s-]/gi, "").trim() || "download"
    try {
      link.href = downloadUrl
      link.download = `${title}.${extension}`
      document.body.appendChild(link)
      link.click()
    } finally {
      link.remove()
      URL.revokeObjectURL(downloadUrl)
    }
  },
}

AXIOS_INSTANCE.defaults.baseURL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"
AXIOS_INSTANCE.defaults.withCredentials = true

AXIOS_INSTANCE.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error.response?.status === 401 &&
      typeof window !== "undefined" &&
      !window.location.pathname.startsWith("/login")
    ) {
      window.location.assign("/login")
    }
    return Promise.reject(error)
  }
)
