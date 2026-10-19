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
})
