/**
 * Rewrites a third-party page so a sandboxed iframe on another origin can show it.
 *
 * Sites that send X-Frame-Options or a CSP frame-ancestors directive cannot be framed
 * directly, so the API fetches the page itself and serves it back without those headers.
 * The served page always runs with an opaque origin: the CSP sandbox below never grants
 * allow-same-origin, so page scripts cannot read API cookies or call the API as the user.
 */

export const PREVIEW_NAVIGATE_MESSAGE = "cabinet-preview-navigate"
export const PREVIEW_ERROR_MESSAGE = "cabinet-preview-error"

export const MAX_PROXIED_PAGE_BYTES = 5 * 1024 * 1024

/** Response headers for every proxied document, including error pages. */
export function proxiedPageHeaders(): Record<string, string> {
  return {
    "Content-Type": "text/html; charset=utf-8",
    // Enforced by the browser even when the document is opened outside the iframe.
    "Content-Security-Policy":
      "sandbox allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox",
    "Referrer-Policy": "no-referrer",
    "X-Content-Type-Options": "nosniff",
    "X-Robots-Tag": "noindex, nofollow",
    "Cache-Control": "private, max-age=300",
  }
}

export function isHtmlContentType(contentType?: string | null): boolean {
  const type = contentType?.split(";")[0].trim().toLowerCase()
  return type === "text/html" || type === "application/xhtml+xml"
}

/** Decodes the page using the header charset, then a <meta> charset, then UTF-8. */
export function decodeHtml(body: Uint8Array, contentType?: string | null): string {
  const headerCharset = /charset=["']?([\w.:-]+)/i.exec(contentType ?? "")?.[1]
  const head = new TextDecoder("latin1").decode(body.subarray(0, 4096))
  const metaCharset =
    /<meta[^>]+charset=["']?([\w.:-]+)/i.exec(head)?.[1]
  for (const label of [headerCharset, metaCharset, "utf-8"]) {
    if (!label) continue
    try {
      return new TextDecoder(label).decode(body)
    } catch {
      // Unknown label; try the next candidate.
    }
  }
  return new TextDecoder().decode(body)
}

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")

/**
 * Runs inside the proxied page. Link clicks are handed to the parent app, which reloads
 * the frame through the proxy; navigating from inside the sandboxed frame would hit the
 * original site's framing headers again and would not carry the API session cookie.
 */
const navigationScript = `(function(){\n  if (window.parent === window) return;\n  document.addEventListener("click", function (event) {\n    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;\n    var link = event.target && event.target.closest ? event.target.closest("a[href]") : null;\n    if (!link || link.target === "_blank" || link.hasAttribute("download")) return;\n    var href = link.href;\n    if (!/^https?:/i.test(href)) return;\n    if (href.split("#")[0] === location.href.split("#")[0] && href.indexOf("#") !== -1) return;\n    event.preventDefault();\n    window.parent.postMessage({ type: ${JSON.stringify(PREVIEW_NAVIGATE_MESSAGE)}, url: href }, "*");\n  }, true);\n})();`

/**
 * Prepares fetched HTML for the proxy response: drops in-page CSP rules and any
 * author <base>, then points relative URLs back at the original site and installs
 * the navigation hook.
 */
export function rewriteProxiedPage(html: string, pageUrl: string): string {
  const stripped = html
    .replace(/<meta\b[^>]*http-equiv\s*=\s*["']?content-security-policy["']?[^>]*>/gi, "")
    .replace(/<base\b[^>]*>/gi, "")
  const injection =
    `<base href="${escapeHtml(pageUrl)}" target="_self">` +
    `<script>${navigationScript}</script>`
  const headMatch = /<head\b[^>]*>/i.exec(stripped)
  if (headMatch) {
    const at = headMatch.index + headMatch[0].length
    return stripped.slice(0, at) + injection + stripped.slice(at)
  }
  const htmlMatch = /<html\b[^>]*>/i.exec(stripped)
  if (htmlMatch) {
    const at = htmlMatch.index + htmlMatch[0].length
    return stripped.slice(0, at) + `<head>${injection}</head>` + stripped.slice(at)
  }
  return `<head>${injection}</head>` + stripped
}

/** A page that tells the parent app the proxy could not render the site. */
export function proxyErrorPage(message: string): string {
  const payload = JSON.stringify({ type: PREVIEW_ERROR_MESSAGE, message }).replace(/</g, "\\u003c")
  return `<!doctype html><html><head><meta charset="utf-8"><title>Preview unavailable</title>` +
    `<script>if(window.parent!==window)window.parent.postMessage(${payload},"*");</script>` +
    `</head><body style="font:14px system-ui,sans-serif;color:#555;padding:24px">` +
    `<p>${escapeHtml(message)}</p></body></html>`
}
