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

test("drawings open in their own editor and are not mistaken for notes", async () => {
  const { editorPath, isNoteBookmark, isDrawingBookmark } = await import("../src/lib/bookmark-kind.ts")
  assert.equal(isNoteBookmark({ type: "DRAWING", url: null }), false)
  assert.equal(isDrawingBookmark({ type: "DRAWING" }), true)
  assert.equal(isNoteBookmark({ url: null }), true)
  assert.equal(editorPath({ id: "d1", type: "DRAWING" }), "/cabinet/drawings/d1")
  assert.equal(editorPath({ id: "n1", type: "NOTE" }), "/cabinet/notes/n1")
  assert.equal(editorPath({ id: "b1", type: "BOOKMARK", url: "https://example.com" }), null)
})

test("item access falls back to the older canEdit flag", async () => {
  const { itemAccess } = await import("../src/lib/bookmark-kind.ts")
  assert.equal(itemAccess({ access: "editor", canEdit: false }), "editor")
  assert.equal(itemAccess({ canEdit: false }), "viewer")
  assert.equal(itemAccess({}), "owner")
})
