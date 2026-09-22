import { AXIOS_INSTANCE } from "./custom-instance"

export interface BookmarkArticle {
  id: string
  bookmarkId: string
  author?: string
  publishedAt?: string
  readingTimeMinutes?: number
  wordCount?: number
  contentHtml?: string
  contentMarkdown?: string
  waybackUrl?: string
  isRead: boolean
  readAt?: string
  scrollProgress: number
  createdAt: string
  updatedAt: string
}

export const cabinetReaderApi = {
  getArticle: async (bookmarkId: string): Promise<BookmarkArticle> => {
    const res = await AXIOS_INSTANCE.get(`/v1/bookmarks/${bookmarkId}/article`)
    return res.data?.data || res.data
  },

  updateProgress: async (
    bookmarkId: string,
    payload: { scrollProgress?: number; isRead?: boolean }
  ): Promise<BookmarkArticle> => {
    const res = await AXIOS_INSTANCE.patch(
      `/v1/bookmarks/${bookmarkId}/article/progress`,
      payload
    )
    return res.data?.data || res.data
  },
}
