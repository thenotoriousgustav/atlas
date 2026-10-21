/** Routes remote preview images through the API to avoid hotlink and CORS blocks. */
export function getProxiedImageUrl(imageUrl?: string | null): string {
  if (!imageUrl) return ""
  if (imageUrl.startsWith("/") || imageUrl.startsWith("blob:") || imageUrl.startsWith("data:")) {
    return imageUrl
  }
  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"
  // Invalidate previews cached before the Reddit share-image request fix.
  return `${apiBase}/v1/bookmarks/proxy-image?v=2&url=${encodeURIComponent(imageUrl)}`
}
