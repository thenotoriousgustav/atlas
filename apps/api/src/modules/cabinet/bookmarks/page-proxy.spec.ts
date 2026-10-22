import {
  decodeHtml,
  isHtmlContentType,
  proxiedPageHeaders,
  proxyErrorPage,
  rewriteProxiedPage,
  PREVIEW_ERROR_MESSAGE,
  PREVIEW_NAVIGATE_MESSAGE,
} from "./page-proxy"

describe("rewriteProxiedPage", () => {
  it("points relative URLs at the original site and installs the navigation hook", () => {
    const html = rewriteProxiedPage(
      '<!doctype html><html><head><title>Skill</title></head><body><a href="/other">x</a></body></html>',
      "https://skills.sh/mattpocock/skills/grill-me",
    )
    expect(html).toMatch(/<head><base href="https:\/\/skills.sh\/mattpocock\/skills\/grill-me" target="_self"><script>/)
    expect(html).toContain(PREVIEW_NAVIGATE_MESSAGE)
    expect(html.indexOf("<base")).toBeLessThan(html.indexOf("<title>"))
  })

  it("drops author base tags and in-page CSP rules that would break the proxied view", () => {
    const html = rewriteProxiedPage(
      `<html><head><base href="https://cdn.example.com/"><meta http-equiv="Content-Security-Policy" content="script-src 'self'"></head></html>`,
      "https://example.com/",
    )
    expect(html.match(/<base\b/g)).toHaveLength(1)
    expect(html).toContain('href="https://example.com/"')
    expect(html).not.toMatch(/content-security-policy/i)
  })

  it("creates a head when the page has none", () => {
    expect(rewriteProxiedPage("<html><body>hi</body></html>", "https://example.com/")).toMatch(
      /^<html><head><base href="https:\/\/example.com\/"/,
    )
    expect(rewriteProxiedPage("<p>fragment</p>", "https://example.com/")).toMatch(/^<head><base/)
  })

  it("escapes the page URL inside the base tag", () => {
    const html = rewriteProxiedPage("<head></head>", 'https://example.com/?q="><script>x</script>')
    expect(html).toContain('href="https://example.com/?q=&quot;&gt;&lt;script&gt;x&lt;/script&gt;"')
  })
})

describe("proxied page response", () => {
  it("sandboxes the document without granting it the API origin", () => {
    const csp = proxiedPageHeaders()["Content-Security-Policy"]
    expect(csp).toMatch(/^sandbox /)
    expect(csp).not.toContain("allow-same-origin")
    expect(csp).not.toContain("allow-top-navigation")
    expect(proxiedPageHeaders()["X-Robots-Tag"]).toContain("noindex")
  })

  it("reports failures to the parent app", () => {
    const html = proxyErrorPage("Site <unreachable>")
    expect(html).toContain(`"type":"${PREVIEW_ERROR_MESSAGE}"`)
    expect(html).toContain("<p>Site &lt;unreachable&gt;</p>")
  })
})

describe("content handling", () => {
  it("recognises HTML content types", () => {
    expect(isHtmlContentType("text/html; charset=ISO-8859-1")).toBe(true)
    expect(isHtmlContentType("application/xhtml+xml")).toBe(true)
    expect(isHtmlContentType("application/pdf")).toBe(false)
    expect(isHtmlContentType(null)).toBe(false)
  })

  it("decodes using the header charset, then the meta charset, then UTF-8", () => {
    const latin = new Uint8Array([0xe9])
    expect(decodeHtml(latin, "text/html; charset=iso-8859-1")).toBe("é")
    const meta = new TextEncoder().encode('<meta charset="windows-1252"><p>')
    expect(decodeHtml(new Uint8Array([...meta, 0x80]), "text/html")).toBe('<meta charset="windows-1252"><p>€')
    expect(decodeHtml(new TextEncoder().encode("ü"), "text/html; charset=bogus")).toBe("ü")
  })
})
