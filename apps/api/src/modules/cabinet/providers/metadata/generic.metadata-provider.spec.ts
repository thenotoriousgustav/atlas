import { GenericMetadataProvider } from "./generic.metadata-provider"
import { CRAWLER_USER_AGENTS } from "./metadata-provider.interface"

describe("GenericMetadataProvider", () => {
  let provider: GenericMetadataProvider
  let fetchMock: jest.SpyInstance

  beforeEach(() => {
    provider = new GenericMetadataProvider()
    fetchMock = jest.spyOn(global, "fetch")
  })
  afterEach(() => jest.restoreAllMocks())

  it("extracts generic HTML metadata and resolves relative asset URLs", async () => {
    fetchMock.mockResolvedValue(
      new Response(`
      <title>Fallback title</title>
      <meta property="og:title" content="Example &amp; title">
      <meta content="Description &amp; details" name="description">
      <meta property="og:image" content="/image.jpg?x=1&amp;y=2">
      <meta property="og:site_name" content="Example">
      <link href="/favicon.ico" rel="icon">
    `)
    )
    expect(await provider.extract("https://example.com/page")).toEqual({
      title: "Example & title",
      description: "Description & details",
      imageUrl: "https://example.com/image.jpg?x=1&y=2",
      faviconUrl: "https://example.com/favicon.ico",
      siteName: "Example",
    })
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it("retries the same URL with each user agent after HTTP and network failures", async () => {
    const url = "https://example.com/page"
    fetchMock
      .mockResolvedValueOnce(new Response("Blocked", { status: 403 }))
      .mockRejectedValueOnce(new Error("Network error"))
      .mockResolvedValueOnce(new Response("<title>Page title</title>"))
    expect(await provider.extract(url)).toMatchObject({ title: "Page title" })
    expect(fetchMock.mock.calls.map(([requestedUrl]) => requestedUrl)).toEqual([
      url,
      url,
      url,
    ])
    expect(
      fetchMock.mock.calls.map(([, options]) => options.headers["User-Agent"])
    ).toEqual([
      CRAWLER_USER_AGENTS.FACEBOOK_EXTERNAL_HIT,
      CRAWLER_USER_AGENTS.WHATSAPP,
      CRAWLER_USER_AGENTS.CHROME_DESKTOP,
    ])
  })

  it("falls back to the domain when all user agents fail", async () => {
    fetchMock.mockResolvedValue(new Response("Blocked", { status: 403 }))
    expect(await provider.extract("https://www.example.com/page")).toEqual({
      title: "example.com",
      unavailable: true,
    })
    expect(fetchMock).toHaveBeenCalledTimes(3)
  })

  it.each([
    "https://www.reddit.com/r/example/comments/123/post/",
    "https://x.com/example/status/123",
    "https://www.youtube.com/watch?v=123",
    "https://www.tiktok.com/@example/video/123",
    "https://vimeo.com/123",
  ])("uses only HTML scraping for %s", async (url) => {
    fetchMock.mockResolvedValue(
      new Response(`
      <title>404 Error</title>
      <meta name="description" content="Explore this post">
    `)
    )
    expect(await provider.extract(url)).toMatchObject({
      title: "404 Error",
      description: "Explore this post",
    })
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock.mock.calls[0][0]).toBe(url)
  })

  it("uses the domain when HTML has no title or metadata", async () => {
    fetchMock.mockResolvedValue(
      new Response("<html><body>Plain page</body></html>")
    )
    expect(await provider.extract("https://example.com/page")).toMatchObject({
      title: "example.com",
    })
    expect(fetchMock).toHaveBeenCalledTimes(3)
  })

  describe("content type", () => {
    const page = (head: string) =>
      new Response(`<html><head><title>T</title>${head}</head></html>`, {
        headers: { "content-type": "text/html; charset=utf-8" },
      })

    it.each([
      ['<meta property="og:type" content="video.other">', "VIDEO"],
      ['<meta property="og:video" content="https://cdn.example.com/a.mp4">', "VIDEO"],
      ['<meta property="og:type" content="article">', "ARTICLE"],
    ])("reads %s as %s", async (head, expected) => {
      fetchMock.mockResolvedValue(page(head))
      expect(await provider.extract("https://example.com/p")).toMatchObject({ contentType: expected })
    })

    it("leaves a plain page unclassified", async () => {
      fetchMock.mockResolvedValue(page('<meta property="og:image" content="/a.jpg">'))
      expect((await provider.extract("https://example.com/p"))?.contentType).toBeUndefined()
    })

    describe("Pinterest pins", () => {
      const pin = '<meta property="og:type" content="pinterestapp:pin"><meta property="og:image" content="https://i.pinimg.com/a.jpg">'

      it("leaves a photo pin, whose embedded data has no videos, unclassified", async () => {
        fetchMock.mockResolvedValue(page(`${pin}<script>{"link":null,"videos":null,"is_video":false}</script>`))
        const result = await provider.extract("https://id.pinterest.com/pin/843721311485677788/")
        expect(result?.contentType).toBeUndefined()
      })

      it("reads a pin with embedded video streams as a video, even though og:video is missing", async () => {
        fetchMock.mockResolvedValue(
          page(`${pin}<script>{"link":null,"videos":{"node_id":"abc","video_list":{"V_720P":{"url":"https://v1.pinimg.com/a.mp4"}}}}</script>`)
        )
        expect(await provider.extract("https://in.pinterest.com/pin/video--68747367050/")).toMatchObject({ contentType: "VIDEO" })
      })

      it("does not classify other Pinterest pages", async () => {
        fetchMock.mockResolvedValue(page(pin))
        expect((await provider.extract("https://www.pinterest.com/someone/board/"))?.contentType).toBeUndefined()
      })
    })

    it("describes a direct video file by its name without reading the body", async () => {
      fetchMock.mockResolvedValue(new Response("BINARY", { headers: { "content-type": "video/mp4" } }))
      const result = await provider.extract("https://example.com/clip.mp4")
      expect(result).toMatchObject({ contentType: "VIDEO", title: "clip.mp4" })
      expect(fetchMock).toHaveBeenCalledTimes(1)
    })

    it("does not classify direct images or PDFs", async () => {
      fetchMock.mockResolvedValue(new Response("BINARY", { headers: { "content-type": "image/png" } }))
      const result = await provider.extract("https://example.com/a.png")
      expect(result?.contentType).toBeUndefined()
    })
  })
})
