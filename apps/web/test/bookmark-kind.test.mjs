import assert from "node:assert/strict"
import test from "node:test"
import { canDownloadMedia, isVideoBookmark } from "../src/lib/bookmark-kind.ts"

test("video detection only matches actual video URLs", () => {
  for (const url of [
    "https://www.youtube.com/watch?v=abc",
    "https://youtu.be/abc",
    "https://vimeo.com/12345",
    "https://www.tiktok.com/@a/video/123",
    "https://www.instagram.com/reel/abc/",
  ]) assert.equal(isVideoBookmark({ url }), true, url)

  for (const url of [
    "https://x.com/someone/status/1",
    "https://twitter.com/someone",
    "https://www.instagram.com/someone/",
    "https://www.youtube.com/@channel",
    "https://example.com/x.com",
    "https://netflix.com",
  ]) assert.equal(isVideoBookmark({ url }), false, url)
})

test("server-classified videos are trusted", () => {
  assert.equal(isVideoBookmark({ url: "https://example.com/clip", contentType: "VIDEO" }), true)
})

test("X posts can still offer media download without being labeled video", () => {
  assert.equal(canDownloadMedia({ url: "https://x.com/a/status/123" }), true)
  assert.equal(canDownloadMedia({ url: "https://x.com/a" }), false)
})
