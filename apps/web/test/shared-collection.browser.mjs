// pnpm --filter @cabinet/web test:share
import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import { createServer } from "node:http"
import { fileURLToPath } from "node:url"
import { build } from "esbuild"
import postcss from "postcss"
import tailwind from "@tailwindcss/postcss"
import { chromium, expect } from "@playwright/test"

const root = fileURLToPath(new URL("../", import.meta.url))
let script = "", styles = "", copyStatus = 500, copyCalls = 0
const folderId = "11111111-1111-4111-8111-111111111111"
const server = createServer((req, res) => {
  if (req.url === "/app.js") { res.setHeader("Content-Type", "text/javascript"); res.end(script) }
  else if (req.url === "/style.css") { res.setHeader("Content-Type", "text/css"); res.end(styles) }
  else if (req.url.startsWith("/v1/bookmarks/proxy-image")) {
    if (req.url.includes("broken")) { res.writeHead(404); res.end(); return }
    const height = req.url.includes("color") ? 300 : 150
    res.setHeader("Content-Type", "image/svg+xml")
    res.end(`<svg xmlns="http://www.w3.org/2000/svg" width="400" height="${height}"><rect width="400" height="${height}" fill="${height === 300 ? '#cbd5c3' : '#c4cbd4'}"/></svg>`)
  } else if (req.url.endsWith("/copy") && req.method === "POST") {
    copyCalls++
    setTimeout(() => { res.writeHead(copyStatus, { "Content-Type": "application/json" }); res.end(JSON.stringify({ data: { folderId, copied: 4 } })) }, 300)
  } else res.end('<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="stylesheet" href="/style.css"></head><body><div id="root"></div><script type="module" src="/app.js"></script></body></html>')
})
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve))
const origin = `http://127.0.0.1:${server.address().port}`
const browser = await chromium.launch({ headless: true })
try {
  const [bundle, css] = await Promise.all([
    build({ absWorkingDir: root, entryPoints: ["test/fixtures/shared-collection.tsx"], bundle: true, write: false,
      platform: "browser", format: "esm", jsx: "automatic", define: { "process.env.NODE_ENV": '"development"', "process.env.NEXT_PUBLIC_API_URL": JSON.stringify(origin), "process.env": "{}" } }),
    readFile(`${root}src/app/globals.css`, "utf8").then((source) => postcss([tailwind({ base: root })]).process(source, { from: `${root}src/app/globals.css` })),
  ])
  script = bundle.outputFiles[0].text
  styles = css.css
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
  const errors = []
  page.on("pageerror", (error) => errors.push(error.message))
  const noOverlap = async () => {
    await expect.poll(() => page.locator('[data-slot="masonry-item"]').evaluateAll((nodes) => {
      const rects = nodes.map((node) => node.getBoundingClientRect())
      return rects.every((a, i) => rects.every((b, j) => i === j || a.right <= b.left + 1 || b.right <= a.left + 1 || a.bottom <= b.top + 1 || b.bottom <= a.top + 1))
    })).toBe(true)
  }
  const path = `/share/${"a".repeat(64)}`
  await page.goto(`${origin}${path}`)
  await expect(page.getByRole("listitem")).toHaveCount(4)
  await expect(page.getByRole("radio", { name: "Grid view" })).toHaveAttribute("aria-checked", "true")
  await expect.poll(() => page.locator("img").evaluateAll((images) => images.every((image) => image.complete))).toBe(true)
  await noOverlap()
  await page.screenshot({ path: "/tmp/cabinet-shared-collection-desktop.png", fullPage: true })
  const search = page.getByRole("searchbox", { name: "Search this collection" })
  for (const [query, title] of [["FONT", "Typography"], ["design.test", "Color Systems"], ["Photography", "Camera Archive"]]) {
    await search.fill(query)
    await expect(page.getByRole("listitem")).toHaveCount(1)
    await expect(page.getByRole("heading", { name: title, exact: true })).toBeVisible()
  }
  await page.getByRole("radio", { name: "List view" }).click()
  await expect(page.locator('[data-view="list"]')).toBeVisible()
  await search.fill("nothing matches")
  await expect(page.getByText("No matching bookmarks", { exact: true })).toBeVisible()
  await page.getByRole("button", { name: "Clear search", exact: true }).last().click()
  await expect(page.getByRole("listitem")).toHaveCount(4)
  await page.getByRole("radio", { name: "Grid view" }).click()
  await page.getByRole("radio", { name: "Grid view" }).click()
  await expect(page.locator('[data-view="grid"]')).toBeVisible()
  await search.fill("Typography")
  await page.getByRole("button", { name: "Copy Collection", exact: true }).click()
  await expect(page.getByRole("alert")).toHaveText("Could not copy this collection. Please try again.")
  assert.equal(copyCalls, 1)
  copyStatus = 200
  await page.getByRole("button", { name: "Copy Collection", exact: true }).click()
  await expect(page.getByRole("button", { name: "Copying…", exact: true })).toBeDisabled()
  await page.getByRole("button", { name: "Copying…", exact: true }).dispatchEvent("click")
  await expect(page.getByRole("link", { name: "Open copied collection" })).toHaveAttribute("href", `/cabinet?folder=${folderId}`)
  await expect(page.getByText("4 bookmarks copied to your Cabinet.", { exact: true })).toBeVisible()
  assert.equal(copyCalls, 2) // Full collection copied once, even while one result is filtered.
  await page.setViewportSize({ width: 375, height: 812 })
  await search.fill("")
  await expect(page.getByRole("listitem")).toHaveCount(4)
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  await noOverlap()
  await page.screenshot({ path: "/tmp/cabinet-shared-collection-mobile.png", fullPage: true })
  await page.evaluate(() => document.documentElement.classList.add("dark"))
  await expect(page.locator('[data-slot="masonry-item"] a').first()).toHaveCSS("background-color", "oklch(0.205 0 0)")
  await page.screenshot({ path: "/tmp/cabinet-shared-collection-dark.png", fullPage: true })

  copyStatus = 404
  await page.goto(`${origin}${path}`)
  await page.getByRole("button", { name: "Copy Collection", exact: true }).click()
  await expect(page.getByRole("alert")).toContainText("no longer shared")
  copyStatus = 401
  await page.reload()
  await page.getByRole("button", { name: "Copy Collection", exact: true }).click()
  await page.waitForURL(`${origin}/login?next=${encodeURIComponent(path)}`)
  assert.equal(errors.length, 0, errors.join("\n"))
  console.log("PASS shared collection: grid/list, search, clear/no-results, copy/retry, full-copy semantics, duplicate-click guard, revoked shares, login return, mobile and dark mode")
} finally {
  await browser.close()
  await new Promise((resolve) => server.close(resolve))
}
