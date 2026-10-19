import assert from "node:assert/strict"
import test from "node:test"

class Element extends EventTarget {
  style = {}
  attributes = {}
  children = []
  setAttribute(key, value) { this.attributes[key] = value }
  removeAttribute(key) { delete this.attributes[key] }
  closest() { return this.sidebar ? this : null }
  getBoundingClientRect() { return { left: 10, top: 20, width: 300, height: 200 } }
  cloneNode() { return new Element() }
  append(...nodes) { nodes.forEach(node => { node.parent = this; this.children.push(node) }) }
  appendChild(node) { this.append(node) }
  remove() { this.parent.children = this.parent.children.filter(node => node !== this) }
}

test("preview switches between whole card and sidebar badge; drop/cancel cleans up", async () => {
  const previous = { Element: globalThis.Element, Image: globalThis.Image, document: globalThis.document }
  globalThis.Element = Element
  globalThis.Image = class {}
  try {
    const { startBookmarkDrag } = await import("../src/lib/bookmark-drag.ts")
    for (const end of ["drop", "dragend"]) {
      const document = new EventTarget()
      document.body = new Element()
      document.createElement = () => new Element()
      globalThis.document = document
      const source = new Element()
      const sidebar = new Element()
      sidebar.sidebar = true
      const payload = {}
      startBookmarkDrag({
        currentTarget: source, target: source, clientX: 110, clientY: 70,
        dataTransfer: {
          setData: (type, value) => { payload[type] = value },
          setDragImage: image => assert.ok(image.src.startsWith("data:image/gif")),
        },
      }, ["a", "b"], '<img src="bad">')
      const preview = document.body.children[0]
      const [card, badge] = preview.children
      assert.deepEqual(source.style, {})
      assert.equal(card.style.width, "300px")
      assert.equal(badge.style.display, "none")
      assert.equal(payload["application/json"], '["a","b"]')
      const move = target => {
        const event = Object.assign(new Event("dragover"), { clientX: 210, clientY: 170 })
        Object.defineProperty(event, "target", { value: target })
        document.dispatchEvent(event)
      }
      move(sidebar)
      assert.equal(preview.attributes["data-bookmark-drag-preview"], "compact")
      assert.equal(card.style.display, "none")
      assert.equal(badge.style.display, "block")
      assert.equal(badge.textContent, "2 bookmarks")
      assert.equal(preview.style.top, "186px")
      move(source)
      assert.equal(preview.attributes["data-bookmark-drag-preview"], "card")
      assert.equal(card.style.display, "")
      assert.equal(badge.style.display, "none")
      document.dispatchEvent(new Event(end))
      assert.equal(document.body.children.length, 0)
      preview.style.left = "unchanged"
      move(sidebar)
      assert.equal(preview.style.left, "unchanged")
    }
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete globalThis[key]
      else globalThis[key] = value
    }
  }
})
