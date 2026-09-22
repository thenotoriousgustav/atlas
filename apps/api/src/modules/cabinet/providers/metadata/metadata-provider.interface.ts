export interface ExtractedMetadata {
  title: string
  description?: string
  imageUrl?: string
  faviconUrl?: string
  siteName?: string
  embedHtml?: string
}

export interface MetadataProvider {
  supports(url: URL): boolean
  extract(url: string, urlObj?: URL): Promise<ExtractedMetadata | null>
}

export const CRAWLER_USER_AGENTS = {
  // Primary Meta/WhatsApp social preview crawlers whitelisted by Reddit, Shopee, Tokopedia, YouTube, etc.
  FACEBOOK_EXTERNAL_HIT:
    "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)",
  WHATSAPP: "WhatsApp/2.24.6.77 A",
  // Modern desktop browser fallback
  CHROME_DESKTOP:
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
}

export function decodeHtmlEntities(text: string): string {
  if (!text) return ""
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, code) => {
      try {
        return String.fromCharCode(parseInt(code, 10))
      } catch {
        return _
      }
    })
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => {
      try {
        return String.fromCharCode(parseInt(code, 16))
      } catch {
        return _
      }
    })
    .trim()
}
