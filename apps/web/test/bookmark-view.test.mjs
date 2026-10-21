import assert from "node:assert/strict"
import test from "node:test"
import { adjacentPreviewBookmark, moodboardColumnCount } from "../src/lib/bookmark-view.ts"

test("masonry adapts to container width with responsive breakpoints up to 4 columns", () => {
  for (const [width, expected] of [
    [320, 1],
    [479, 1],
    [480, 2],
    [767, 2],
    [768, 3],
    [1023, 3],
    [1024, 4],
    [1400, 4],
  ]) {
    assert.equal(moodboardColumnCount(width), expected)
  }
  // Opening the inspector reduces container width without changing the viewport.
  assert.equal(moodboardColumnCount(1000), 3)
  assert.equal(moodboardColumnCount(552), 2)
})

test("preview navigation follows displayed order, skips notes, and stops at boundaries", () => {
  const bookmarks = [
    { id: "first", url: "https://example.com/1" },
    { id: "note", type: "NOTE", url: "https://example.com/note" },
    { id: "empty" },
    { id: "second", url: "https://example.com/2" },
  ]
  assert.equal(adjacentPreviewBookmark(bookmarks, "first", 1), bookmarks[3])
  assert.equal(adjacentPreviewBookmark(bookmarks, "second", -1), bookmarks[0])
  assert.equal(adjacentPreviewBookmark(bookmarks, "first", -1), undefined)
  assert.equal(adjacentPreviewBookmark(bookmarks, "second", 1), undefined)
  assert.equal(adjacentPreviewBookmark(bookmarks, "missing", 1), undefined)
})
