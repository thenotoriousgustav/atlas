import assert from "node:assert/strict"
import test from "node:test"
import { sharedCollectionItems, safeHttpUrl } from "../src/lib/shared-collection.ts"
import { loginReturnPath } from "../src/lib/login-redirect.ts"

test("public collection items filter unsafe URLs and index title, description and website for local search", () => {
  const items = sharedCollectionItems([
    { id: "a", title: "Typography", description: "Design references", url: "https://www.example.com/type", imageUrl: "https://example.com/preview.jpg" },
    { id: "b", title: "A useful article", description: null, url: "https://other.test/read", imageUrl: "javascript:alert(1)" },
    { id: "c", title: "Unsafe", description: null, url: "javascript:alert(1)", imageUrl: null },
  ], "https://api.test")
  assert.equal(items.length, 2)
  assert.equal(items[0].hostname, "example.com")
  for (const query of ["typography", "references", "example.com", "/type"]) {
    assert.equal(items.filter((item) => item.searchText.includes(query)).length, 1)
  }
  assert.equal(items[0].preview, "https://api.test/v1/bookmarks/proxy-image?v=2&url=https%3A%2F%2Fexample.com%2Fpreview.jpg")
  assert.equal(items[1].preview, null)
  for (const url of ["/relative", "data:text/html,test", "file:///etc/passwd", "not a url"]) assert.equal(safeHttpUrl(url), null)
})

test("login can return to a shared collection but cannot become an open redirect", () => {
  const path = `/share/${"a".repeat(64)}`
  assert.equal(loginReturnPath(`?next=${encodeURIComponent(path)}`), path)
  for (const next of ["https://evil.test", "//evil.test", "/\\evil.test", "/share/bad", `${path}?next=https://evil.test`, "/login"]) {
    assert.equal(loginReturnPath(`?next=${encodeURIComponent(next)}`), "/cabinet")
  }
  const invitation = `/invite/${"b".repeat(64)}`
  assert.equal(loginReturnPath(`?next=${encodeURIComponent(invitation)}`), invitation)
  for (const next of ["/invite/bad", `${invitation}?next=https://evil.test`, `//evil.test${invitation}`]) {
    assert.equal(loginReturnPath(`?next=${encodeURIComponent(next)}`), "/cabinet")
  }
  assert.equal(loginReturnPath(""), "/cabinet")
})
