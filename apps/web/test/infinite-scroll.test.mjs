import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"
import vm from "node:vm"
import ts from "typescript"

// Run the dashboard's actual effect without mocking its unrelated UI/auth hooks.
const source = ts.createSourceFile("dashboard.tsx", readFileSync(new URL("../src/app/cabinet/cabinet-dashboard.tsx", import.meta.url), "utf8"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
let effectSource
function visit(node) {
  if (ts.isCallExpression(node) && node.expression.getText(source) === "React.useEffect" && node.arguments[0]?.getText(source).includes("new IntersectionObserver")) {
    effectSource = node.arguments[0].getText(source)
  }
  ts.forEachChild(node, visit)
}
visit(source)
assert.ok(effectSource, "dashboard must observe the pagination sentinel")

function setup(overrides = {}) {
  const observers = []
  const requests = []
  const context = {
    bookmarkScrollRef: { current: {} }, loadMoreRef: { current: {} },
    filterDuplicates: false, hasNextPage: true, isFetchingBookmarks: false, isFetchNextPageError: false,
    fetchNextPage: options => requests.push(options),
    IntersectionObserver: class {
      constructor(callback, options) { this.callback = callback; this.options = options; observers.push(this) }
      observe(target) { this.target = target }
      disconnect() { this.disconnected = true }
    },
    ...overrides,
  }
  const effect = vm.runInNewContext(ts.transpile(`(${effectSource})`, { target: ts.ScriptTarget.ESNext }), context)
  return { context, effect, observers, requests }
}

test("loads once near the bottom of the bookmark panel, and re-arms after fetching", () => {
  const { context, effect, observers, requests } = setup()
  const cleanup = effect()
  const observer = observers[0]
  assert.equal(observer.options.root, context.bookmarkScrollRef.current)
  assert.equal(observer.options.rootMargin, "0px 0px 300px 0px")
  assert.equal(observer.target, context.loadMoreRef.current)
  observer.callback([{ isIntersecting: false }])
  assert.equal(requests.length, 0)
  observer.callback([{ isIntersecting: true }])
  observer.callback([{ isIntersecting: true }])
  assert.equal(requests.length, 1)
  assert.equal(requests[0].cancelRefetch, false)
  assert.equal(observer.disconnected, true)
  cleanup()
  context.isFetchingBookmarks = true
  assert.equal(effect(), undefined)
  context.isFetchingBookmarks = false
  effect()
  observers[1].callback([{ isIntersecting: true }])
  assert.equal(requests.length, 2)
})

test("does not load after cleanup, at the end, during errors, or in duplicate view", () => {
  for (const overrides of [
    { hasNextPage: false }, { isFetchingBookmarks: true }, { isFetchNextPageError: true },
    { filterDuplicates: true }, { bookmarkScrollRef: { current: null } }, { loadMoreRef: { current: null } },
  ]) {
    const { effect, observers } = setup(overrides)
    assert.equal(effect(), undefined)
    assert.equal(observers.length, 0)
  }
  const { effect, observers, requests } = setup()
  const cleanup = effect()
  cleanup()
  observers[0].callback([{ isIntersecting: true }])
  assert.equal(requests.length, 0)
})
