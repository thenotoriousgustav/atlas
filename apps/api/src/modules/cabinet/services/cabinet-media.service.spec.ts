import { CabinetMediaService } from "./cabinet-media.service"

describe("CabinetMediaService.isVideoUrl", () => {
  const service = new CabinetMediaService()

  it.each([
    "https://www.youtube.com/watch?v=abc",
    "https://youtu.be/abc",
    "https://vimeo.com/123",
    "https://www.tiktok.com/@a/video/123",
    "https://www.instagram.com/reel/abc/",
    "https://fb.watch/abc/",
  ])("treats %s as a video", (url) => {
    expect(service.isVideoUrl(url)).toBe(true)
  })

  it.each([
    "https://id.pinterest.com/pin/843721311485677788/",
    "https://www.instagram.com/p/abc/",
    "https://www.reddit.com/r/mac/comments/1/post/",
    "https://x.com/a/status/1",
    "https://www.youtube.com/@channel",
    "https://vimeo.com/",
    "not a url",
  ])("does not treat %s as a video", (url) => {
    expect(service.isVideoUrl(url)).toBe(false)
  })
})
