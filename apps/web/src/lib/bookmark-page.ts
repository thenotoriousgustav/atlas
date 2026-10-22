/**
 * Routes a page the browser refuses to frame through the API, which serves it again
 * without the site's framing headers inside a CSP sandbox. See the API's page-proxy.ts.
 */
export function getProxiedPageUrl(pageUrl: string): string {
  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"
  return `${apiBase}/v1/bookmarks/proxy-page?url=${encodeURIComponent(pageUrl)}&v=2`
}

/** The proxied page asks the app to load a clicked link; the proxy reports failures. */
export const PREVIEW_NAVIGATE_MESSAGE = "cabinet-preview-navigate"
export const PREVIEW_ERROR_MESSAGE = "cabinet-preview-error"
export const PREVIEW_READY_MESSAGE = "cabinet-preview-ready"

/** Sandbox for the proxied frame. Never allow-same-origin: the document sits on the API origin. */
export const PROXIED_FRAME_SANDBOX = "allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
export const DIRECT_FRAME_SANDBOX = "allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
