export interface ExtractedMetadata {
  title: string
  description?: string
  imageUrl?: string
}

export interface MetadataProvider {
  supports(url: URL): boolean
  extract(url: string, urlObj: URL): Promise<ExtractedMetadata | null>
}

export function decodeHtmlEntities(str: string): string {
  if (!str) return ""
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, "/")
    .replace(/&nbsp;/g, " ")
}
