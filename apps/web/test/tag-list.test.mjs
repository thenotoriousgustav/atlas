import assert from "node:assert/strict"
import test from "node:test"
import { visibleSidebarTags } from "../src/lib/tag-list.ts"

const tags = Array.from({ length: 12 }, (_, i) => ({ name: `t${i}` }))

test("sidebar lists only the most used tags", () => {
  assert.deepEqual(visibleSidebarTags(tags).map((t) => t.name), ["t0", "t1", "t2", "t3", "t4", "t5", "t6", "t7"])
  assert.equal(visibleSidebarTags(tags.slice(0, 3)).length, 3)
})

test("the active tag stays visible even when it is rarely used", () => {
  const names = visibleSidebarTags(tags, "t11").map((t) => t.name)
  assert.equal(names.length, 9)
  assert.equal(names.at(-1), "t11")
  assert.equal(visibleSidebarTags(tags, "t2").length, 8)
})
