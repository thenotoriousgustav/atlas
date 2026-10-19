import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { registerHooks } from "node:module"
import test from "node:test"
import React from "react"
import { renderToStaticMarkup } from "react-dom/server"
import ts from "typescript"

// Node strips TypeScript, but needs JSX and the app's path alias resolved.
registerHooks({
  resolve(specifier, context, next) {
    if (specifier.startsWith("@/")) {
      const path = new URL(`../src/${specifier.slice(2)}`, import.meta.url)
      for (const extension of [".tsx", ".ts"]) {
        try {
          readFileSync(new URL(path.href + extension))
          return { url: path.href + extension, shortCircuit: true }
        } catch {}
      }
    }
    return next(specifier, context)
  },
  load(url, context, next) {
    if (url.endsWith(".tsx") || url.endsWith(".ts")) {
      return {
        format: "module",
        shortCircuit: true,
        source: ts.transpileModule(readFileSync(new URL(url), "utf8"), {
          compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.ESNext },
        }).outputText,
      }
    }
    return next(url, context)
  },
})

const { BookmarkMoodboardView, MoodboardCard } = await import("../src/app/cabinet/components/bookmark-moodboard-view.tsx")
const { BookmarkListView } = await import("../src/app/cabinet/components/bookmark-list-view.tsx")
const { TooltipProvider } = await import("../src/components/ui/tooltip.tsx")
const bookmark = { id: "a", title: "Alpha", url: "https://example.com", createdAt: "2026-01-01" }
const props = {
  bookmarks: [bookmark], activeColumnCount: 3, selectedBookmarkIds: [],
  getHostname: () => "example.com", getPastelColor: () => ({}),
}
const render = (Component, extra) => renderToStaticMarkup(
  React.createElement(TooltipProvider, null, React.createElement(Component, { ...props, ...extra }))
)

test("the whole card is draggable and keyboard-accessible, without handles", () => {
  for (const Component of [BookmarkListView, BookmarkMoodboardView]) {
    const html = render(Component, { onReorder() {} })
    assert.doesNotMatch(html, /data-slot="sortable-item-handle"/)
    const card = html.match(/<div[^>]*data-slot="sortable-item"[^>]*>/)?.[0]
    assert.ok(card)
    assert.match(card, /draggable="true"/)
    assert.match(card, /role="button"/)
    assert.match(html, /aria-label="Reorder Alpha"/)
    assert.match(html, /aria-roledescription="sortable"/)
    assert.match(html, /aria-describedby="[^"]+"/)
    assert.match(html, /select-none/)
  }
})

test("trash and read-only groups keep actions usable but do not offer sorting", () => {
  for (const Component of [BookmarkListView, BookmarkMoodboardView]) {
    for (const extra of [{}, { isTrashView: true, onReorder() {} }]) {
      const html = render(Component, extra)
      assert.doesNotMatch(html, /data-slot="sortable-item-handle"/)
      assert.doesNotMatch(html, /aria-roledescription="sortable"/)
      assert.doesNotMatch(html, /pointer-events-none opacity-50/)
    }
  }
  assert.doesNotThrow(() => render(MoodboardCard, { bookmark, isSelected: false }))
})
