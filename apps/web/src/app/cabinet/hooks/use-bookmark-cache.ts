import { useQueryClient } from "@tanstack/react-query"
import { useCallback } from "react"

export function useBookmarkCache() {
  const queryClient = useQueryClient()

  const updateBookmarkInCache = useCallback(
    (id: string, updater: (bookmark: any) => any) => {
      queryClient.setQueriesData(
        { queryKey: ["infinite", "/v1/bookmarks"] },
        (oldData: any) => {
          if (!oldData?.pages) return oldData
          return {
            ...oldData,
            pages: oldData.pages.map((page: any) => {
              const currentItems = page?.data?.data
              if (!Array.isArray(currentItems)) return page
              return {
                ...page,
                data: {
                  ...page.data,
                  data: currentItems.map((b: any) =>
                    b.id === id ? updater(b) : b
                  ),
                },
              }
            }),
          }
        }
      )
    },
    [queryClient]
  )

  const removeBookmarkFromCache = useCallback(
    (id: string) => {
      queryClient.setQueriesData(
        { queryKey: ["infinite", "/v1/bookmarks"] },
        (oldData: any) => {
          if (!oldData?.pages) return oldData
          return {
            ...oldData,
            pages: oldData.pages.map((page: any) => {
              const currentItems = page?.data?.data
              if (!Array.isArray(currentItems)) return page
              return {
                ...page,
                data: {
                  ...page.data,
                  data: currentItems.filter((b: any) => b.id !== id),
                  totalCount: Math.max(0, (page.data?.totalCount || 1) - 1),
                },
              }
            }),
          }
        }
      )
    },
    [queryClient]
  )

  return {
    updateBookmarkInCache,
    removeBookmarkFromCache,
  }
}
