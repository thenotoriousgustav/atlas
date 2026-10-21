// Explicit browser-test data, never imported by the application.
import { mkdir, readFile, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
export const folder = { id: "11111111-1111-4111-8111-111111111111", name: "Design references", userId: "owner", parentId: null, isOwner: true, _count: { bookmarks: 0 } }
export const samples = [
  ["98.css: A design system for building faithful interfaces", "https://jdan.github.io/98.css/", "A collection of components that brings a familiar desktop language to the web.", "https://github.com/jdan/98.css/raw/main/docs/window.png?raw=true"],
  ["A practical guide to accessible design", "https://www.w3.org/WAI/", "Resources for making the web work for everyone.", "https://www.w3.org/WAI/assets/images/social-sharing-default.jpg"],
  ["Awesome shadcn/ui", "https://github.com/birobirobiro/awesome-shadcn-ui", "A curated collection of components, tools, and references for your next project."],
  ["Small details worth keeping", "", "Useful notes from this week's reading. Look for clear hierarchy, readable text, and fewer competing actions."],
  ["The details that make interfaces feel right", "https://rauno.me/", "Exploring interaction, craft, and the space between design and engineering.", "https://rauno.me/og4.png"],
  ["Patterns for a calmer workspace", "https://linear.app/", "Fewer distractions. More room for the work that matters.", "https://linear.app/api/og/main?title=Linear&v=4"],
  ["CSS: Cascading Style Sheets", "https://developer.mozilla.org/en-US/docs/Web/CSS", "A reference for layouts, typography, and the details of the web platform.", "https://developer.mozilla.org/mdn-social-image.46ac2375.png"],
  ["Are.na: A place for your ideas", "https://www.are.na/", "Collect connections between images, writing, and the things you want to return to.", "https://www.are.na/og-image.png"],
  ["Ideas for the next reading session", "", "Keep the navigation quiet. Let the work be the interesting part. Make every saved link easy to find again."],
  ["Designing with progressive enhancement", "https://resilientwebdesign.com/", "A practical approach to building interfaces that remain useful when things go wrong."],
  ["A collection of web experiments", "https://github.com/", "Small explorations worth keeping nearby for the next project."],
  ["Notes on a personal library", "", "Group references around a question, not just a format. A useful library makes it easier to pick up where you left off."],
]
export const bookmarks = samples.map(([title, url, description, imageUrl], index) => ({
  id: `sample-${index}`, userId: "owner", canEdit: true, title, url, description, imageUrl,
  type: url ? "BOOKMARK" : "NOTE", folderId: folder.id, folder, metadataStatus: "COMPLETED",
  createdAt: "2026-10-18T10:00:00Z", tags: index % 2 ? [] : [{ id: "design", name: "design" }],
  notes: "", isPinned: false, isFavorite: index === 0 || index === 2,
}))
folder._count.bookmarks = bookmarks.length
export async function prepareCabinetImages() {
  const directory = join(tmpdir(), "cabinet-editorial-assets")
  await mkdir(directory, { recursive: true })
  const images = new Map()
  await Promise.all(samples.filter((sample) => sample[3]).map(async (sample, index) => {
    const url = sample[3]
    const path = join(directory, `${index}.bin`)
    let body = await readFile(path).catch(() => null)
    if (!body) {
      const response = await fetch(url, { signal: AbortSignal.timeout(20000) })
      if (!response.ok) throw new Error(`Could not fetch real bookmark preview: ${url}`)
      body = Buffer.from(await response.arrayBuffer())
      await writeFile(path, body)
    }
    images.set(url, { body, contentType: body[0] === 0xff ? "image/jpeg" : "image/png" })
  }))
  return images
}
export function cabinetResponse(url) {
  const { pathname: path, searchParams: params } = new URL(url)
  if (path.endsWith("/auth/get-session")) return { user: { id: "owner", name: "Raka Pradana", email: "raka@cabinet.test" }, session: { id: "test", expiresAt: "2099-01-01T00:00:00Z" } }
  if (path.endsWith("/folders")) return { data: [folder] }
  if (path.endsWith("/tags")) return { data: [{ id: "design", name: "design" }] }
  if (path.endsWith("/health")) return { data: { total: bookmarks.length, ok: bookmarks.length, broken: 0, redirected: 0, favorites: bookmarks.filter((item) => item.isFavorite).length, archived: 0, trash: 0, duplicates: 0 } }
  if (path.endsWith("/bookmarks")) {
    const data = bookmarks.filter((item) => (!params.get("type") || item.type === params.get("type")) && (!params.get("search") || `${item.title} ${item.description}`.toLowerCase().includes(params.get("search").toLowerCase())) && (params.get("isFavorite") !== "true" || item.isFavorite))
    return { data: { data, totalCount: data.length, nextCursor: null } }
  }
  return { data: [] }
}
