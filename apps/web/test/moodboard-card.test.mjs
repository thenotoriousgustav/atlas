import assert from "node:assert/strict"
import { mkdtemp, rm, writeFile } from "node:fs/promises"
import { join } from "node:path"
import { pathToFileURL } from "node:url"
import test from "node:test"
import { build } from "esbuild"
import React from "react"
import { renderToStaticMarkup } from "react-dom/server"

const directory = await mkdtemp(join(process.cwd(), ".moodboard-card-test-"))
let MoodboardCard
try {
  const result = await build({
    entryPoints: ["src/app/cabinet/components/bookmark-moodboard-view.tsx"],
    bundle: true,
    jsx: "automatic",
    platform: "node",
    format: "esm",
    packages: "external",
    external: ["react"],
    write: false,
  })
  const file = join(directory, "card.mjs")
  await writeFile(file, result.outputFiles[0].text)
  ;({ MoodboardCard } = await import(pathToFileURL(file).href))
} finally {
  await rm(directory, { recursive: true, force: true })
}

const noop = () => {}
const render = (bookmark, density) => renderToStaticMarkup(React.createElement(MoodboardCard, {
  showActions: false,
  nativeDrag: false,
  displayPreferences: { density, showTitle: true, showDescription: true, showImage: true, showWebsite: true, showFolder: true, showDate: true },
  bookmark: { id: "card", userId: "owner", canEdit: true, folderId: "folder", createdAt: "2026-10-18T10:00:00Z", tags: [{ id: "design", name: "design" }], metadataStatus: "COMPLETED", ...bookmark },
  folders: [{ id: "folder", name: "Design references" }],
  isSelected: false, onToggleSelect: noop, onSelectTag: noop, onToggleFavorite: noop, onToggleArchive: noop,
  onEditBookmark: noop, onDeleteBookmark: noop, onDuplicateBookmark: noop,
  getHostname: (url) => (url ? new URL(url).hostname : ""),
}))

const link = { title: "Japanese Design Since 1945", url: "https://www.example.com/book", description: "A complete sourcebook.", imageUrl: "https://cdn.example.com/cover.jpg" }

test("visual cards show the preview with only the title as a caption", () => {
  const html = render(link, "visual")
  assert.match(html, /<img[^>]+alt="Japanese Design Since 1945"/)
  assert.match(html, /Japanese Design Since 1945<\/p>/)
  for (const detail of [/A complete sourcebook/, /Design references/, /#design/, /<time/]) assert.doesNotMatch(html, detail)
})

test("visual links without a picture set the site and title as a type-only card", () => {
  const html = render({ ...link, imageUrl: null, siteName: "Forbes" }, "visual")
  assert.doesNotMatch(html, /<img/)
  assert.match(html, /font-serif[^"]*">Forbes</)
  assert.match(html, /font-serif[^"]*">Japanese Design Since 1945</)
  // The title already sits in the card, so it is not repeated as a caption.
  assert.equal(html.match(/Japanese Design Since 1945</g).length, 1)
})

test("visual cards flag broken links and keep note titles reachable", () => {
  assert.match(render({ ...link, status: "BROKEN" }, "visual"), /text-destructive[^"]*">Broken/)
  const note = render({ type: "NOTE", title: "Reading list", notes: "Look for clear hierarchy and readable text.", url: null }, "visual")
  assert.match(note, /Look for clear hierarchy/)
  assert.match(note, /<button type="button"[^>]*>Reading list<\/button>/)
})

test("comfortable and compact cards keep their full details", () => {
  for (const density of ["comfortable", "compact"]) {
    const html = render(link, density)
    for (const detail of [/A complete sourcebook/, /Design references/, /#design/, /<time/]) assert.match(html, detail)
  }
})
