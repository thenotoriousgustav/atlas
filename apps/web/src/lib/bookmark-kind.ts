type BookmarkLike = { url?: string | null; contentType?: string | null; type?: string | null }

function parsedUrl(url?: string | null) {
  if (!url) return null
  try {
    return new URL(url)
  } catch {
    return null
  }
}

const hostIs = (host: string, domain: string) => host === domain || host.endsWith(`.${domain}`)

/** Links that are themselves a video, not merely posts on a site that hosts video. */
export function isVideoBookmark(bookmark: BookmarkLike): boolean {
  if (bookmark.contentType === "VIDEO") return true
  const url = parsedUrl(bookmark.url)
  if (!url) return false
  const host = url.hostname.toLowerCase()
  if (hostIs(host, "youtube.com")) return /^\/(watch|shorts|live|embed)\b/.test(url.pathname)
  if (hostIs(host, "youtu.be") || hostIs(host, "vimeo.com")) return url.pathname.length > 1
  if (hostIs(host, "tiktok.com")) return url.pathname.includes("/video/")
  if (hostIs(host, "instagram.com")) return /^\/(reel|reels|tv)\//.test(url.pathname)
  return false
}

/** Posts the media downloader can usually extract from, including X posts that may carry video. */
export function canDownloadMedia(bookmark: BookmarkLike): boolean {
  if (isVideoBookmark(bookmark)) return true
  const url = parsedUrl(bookmark.url)
  if (!url) return false
  const host = url.hostname.toLowerCase()
  return (hostIs(host, "x.com") || hostIs(host, "twitter.com")) && /\/status\/\d+/.test(url.pathname)
}

export function isNoteBookmark(bookmark: BookmarkLike): boolean {
  return bookmark.type === "NOTE" || !bookmark.url
}
