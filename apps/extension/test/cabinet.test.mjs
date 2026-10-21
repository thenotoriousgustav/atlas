import assert from "node:assert/strict"
import test from "node:test"
import { canonicalUrl, cleanTags, saveableUrl, trimSlash } from "../src/cabinet.js"

test("only web pages can be saved", () => {
  assert.equal(saveableUrl("https://example.com/a"), "https://example.com/a")
  for (const url of ["chrome://extensions", "file:///etc/passwd", "javascript:alert(1)", "data:text/html,x", "about:blank", "not a url"]) {
    assert.equal(saveableUrl(url), null, url)
  }
})

test("duplicate matching ignores the fragment and a trailing slash, like the web app", () => {
  assert.equal(canonicalUrl("https://example.com/read/#part"), "https://example.com/read")
  assert.equal(canonicalUrl("https://example.com/"), "https://example.com")
  assert.equal(canonicalUrl("chrome://newtab"), null)
})

test("tags are trimmed, lowercased, deduplicated, and stripped of a leading #", () => {
  assert.deepEqual(cleanTags(" #Design, design ,UX,, "), ["design", "ux"])
  assert.deepEqual(cleanTags(["Read later", "#read later"]), ["read later"])
  assert.equal(cleanTags(Array.from({ length: 30 }, (_, i) => `t${i}`)).length, 20)
})

test("addresses lose their trailing slashes", () => {
  assert.equal(trimSlash(" http://localhost:4000// "), "http://localhost:4000")
})
