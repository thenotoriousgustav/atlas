// pnpm --filter @cabinet/web exec playwright install chromium (once)
// pnpm --filter @cabinet/web test:moodboard
import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import { createServer } from "node:http"
import { fileURLToPath } from "node:url"
import { build } from "esbuild"
import postcss from "postcss"
import tailwind from "@tailwindcss/postcss"
import { chromium, expect } from "@playwright/test"

const root = fileURLToPath(new URL("../", import.meta.url))
const [bundle, css] = await Promise.all([
  build({ absWorkingDir: root, entryPoints: ["test/fixtures/moodboard.tsx"], bundle: true, write: false,
    platform: "browser", format: "esm", jsx: "automatic", define: { "process.env.NODE_ENV": '"development"', "process.env": "{}" } }),
  readFile(`${root}src/app/globals.css`, "utf8").then((source) => postcss([tailwind({ base: root })]).process(source, { from: `${root}src/app/globals.css` })),
])
const server = createServer((req, res) => {
  if (req.url === "/app.js") { res.setHeader("Content-Type", "text/javascript"); res.end(bundle.outputFiles[0].text) }
  else if (req.url === "/style.css") { res.setHeader("Content-Type", "text/css"); res.end(css.css) }
  else if (req.url === "/late.svg") {
    setTimeout(() => { res.setHeader("Content-Type", "image/svg+xml"); res.end('<svg xmlns="http://www.w3.org/2000/svg" width="320" height="480"><rect width="320" height="480" fill="#ccc"/></svg>') }, 150)
  } else res.end('<html><head><link rel="stylesheet" href="/style.css"></head><body><div id="root"></div><script type="module" src="/app.js"></script></body></html>')
})
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve))
const browser = await chromium.launch({ headless: true })
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
  const errors = []
  page.on("pageerror", (e) => { errors.push(e.message); console.error(e.stack) })
  await page.goto(`http://127.0.0.1:${server.address().port}`)
  const card = (id) => page.locator(`[data-slot="masonry"] [data-slot="sortable-item"][aria-label="Reorder Bookmark ${id}"]`)
  const order = () => page.locator("#order").textContent()
  const reset = async () => { await page.getByRole("button", { name: "Reset", exact: true }).click(); await expect(page.locator("#order")).toHaveText(Array.from({ length: 24 }, (_, i) => `b${i}`).join(",")) }
  const drag = async (from, to) => {
    await from.scrollIntoViewIfNeeded()
    const a = await from.boundingBox(), b = await to.boundingBox()
    // Side padding avoids buttons/checkboxes; links still support thresholded dragging.
    await page.mouse.move(a.x + 5, a.y + a.height / 2)
    await page.mouse.down()
    await page.mouse.move(a.x + 15, a.y + a.height / 2, { steps: 3 })
    await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 15 })
    await page.waitForTimeout(100)
    await page.mouse.up()
  }
  const noOverlap = async () => {
    await expect.poll(async () => page.locator('[data-slot="masonry-item"]').evaluateAll((nodes) => {
      const rects = nodes.map((n) => n.getBoundingClientRect())
      return rects.every((a, i) => a.width > 0 && a.height > 0 && rects.every((b, j) => i === j ||
        a.right <= b.left + 1 || b.right <= a.left + 1 || a.bottom <= b.top + 1 || b.bottom <= a.top + 1))
    })).toBe(true)
  }
  await expect(card(0)).toBeVisible()
  await noOverlap()
  assert.ok((await card(0).boundingBox()).height < (await card(2).boundingBox()).height)

  await drag(card(0), card(1)) // right
  await expect(page.locator("#order")).toHaveText(/^b1,b0,b2,/)
  await noOverlap()
  await drag(card(0), card(1)) // left
  await expect(page.locator("#order")).toHaveText(/^b0,b1,b2,/)
  await drag(card(0), card(3)) // down
  await expect(page.locator("#order")).toHaveText(/^b1,b2,b3,b0,/)
  await noOverlap()
  await drag(card(0), card(1)) // up
  await expect(page.locator("#order")).toHaveText(/^b0,b1,b2,b3,/)

  await reset()
  await card(0).focus()
  await page.keyboard.press("Space")
  await expect(card(0)).toHaveAttribute("data-dragging", "")
  await page.waitForTimeout(50)
  await page.keyboard.press("ArrowRight")
  await expect(card(1)).toHaveAttribute("data-sort-over", "")
  await page.keyboard.press("Space")
  await expect(page.locator("#order")).toHaveText(/^b1,b0,b2,/)
  await card(0).focus()
  const beforeCancel = await order()
  await page.keyboard.press("Enter")
  await expect(card(0)).toHaveAttribute("data-dragging", "")
  await page.waitForTimeout(50)
  await page.keyboard.press("ArrowDown")
  await page.waitForTimeout(50)
  await page.keyboard.press("Escape")
  assert.equal(await order(), beforeCancel)
  await expect(page.locator('[data-dragging=""]')).toHaveCount(0)

  await reset()
  const beforeSize = await card(0).boundingBox()
  await page.getByRole("button", { name: "Resize thumbnail", exact: true }).click()
  await expect.poll(async () => (await card(0).boundingBox()).height).toBeGreaterThan(beforeSize.height + 100)
  await noOverlap()
  await page.getByRole("button", { name: "Remove first", exact: true }).click()
  await noOverlap()
  await expect(card(0)).toHaveCount(0)
  await page.getByRole("button", { name: "Append", exact: true }).click()
  await expect(page.locator('[aria-label="Reorder Extra"]')).toHaveCount(1)
  await noOverlap()
  await page.getByRole("button", { name: "Columns", exact: true }).click()
  await noOverlap()
  await page.locator("#panel").evaluate((node) => { node.scrollTop = node.scrollHeight })
  await expect(page.locator('[aria-label="Reorder Extra"]')).toBeInViewport()
  await page.locator("#panel").evaluate((node) => { node.scrollTop = 0 })

  await reset()
  await card(0).getByRole("checkbox").click()
  await card(1).getByRole("checkbox").click()
  const beforeFolder = await order()
  await drag(card(0), page.locator('[data-folder-drop="design"]'))
  await expect(page.locator("#drop")).toHaveText("design:b0,b1")
  assert.equal(await order(), beforeFolder)
  await reset()
  const buttonOrder = await order()
  await card(0).getByRole("button", { name: "Favorite", exact: true }).click()
  assert.equal(await order(), buttonOrder)
  await expect(page.locator('[data-dragging=""]')).toHaveCount(0)

  await page.getByRole("button", { name: "Trash view", exact: true }).click()
  await card(0).getByRole("button", { name: "Restore", exact: true }).click()
  assert.equal(await order(), buttonOrder)
  await expect(card(0)).not.toHaveAttribute("aria-roledescription", "sortable")
  await page.getByRole("button", { name: "Trash view", exact: true }).click()
  await page.setViewportSize({ width: 720, height: 900 })
  await noOverlap()

  // Exercise the real toolbar + persisted preference and locked pin controls.
  await reset()
  await card(1).getByRole("button", { name: "Pin to top", exact: true }).click()
  await expect(page.locator("#order")).toHaveText(/^b1,b0,b2,/)
  await expect(card(1)).not.toHaveAttribute("aria-roledescription", "sortable")
  const pinnedOrder = await order()
  await drag(card(1), card(0))
  assert.equal(await order(), pinnedOrder)
  await card(1).getByRole("button", { name: "Unpin bookmark", exact: true }).click()
  await expect(card(1)).toHaveAttribute("aria-roledescription", "sortable")

  const chooseSort = async (label) => {
    await page.getByRole("button", { name: "Sort bookmarks", exact: true }).click()
    await page.getByRole("menuitemradio", { name: label, exact: true }).click()
  }
  for (const [value, label] of [["newest", "Newest First"], ["oldest", "Oldest First"], ["title", "Alphabetical (A–Z)"], ["domain", "Domain"]]) {
    await chooseSort(label)
    await expect(page.locator("#sort")).toHaveText(value)
    await expect(page.locator('[data-slot="masonry"] [aria-roledescription="sortable"]')).toHaveCount(0)
  }
  await page.reload()
  await expect(page.locator("#sort")).toHaveText("domain")
  await chooseSort("Custom Order (Drag & Drop)")
  await expect(card(0)).toHaveAttribute("aria-roledescription", "sortable")

  const touchPage = await browser.newPage({ viewport: { width: 900, height: 900 }, hasTouch: true })
  touchPage.on("pageerror", (e) => errors.push(e.message))
  await touchPage.goto(`http://127.0.0.1:${server.address().port}`)
  const touchCard = (i) => touchPage.locator(`[data-slot="masonry"] [aria-label="Reorder Bookmark ${i}"]`)
  await expect(touchCard(0)).toBeVisible()
  await expect(touchPage.locator('[aria-label="Loading thumbnail"]')).toHaveCount(0)
  const a = await touchCard(0).boundingBox(), b = await touchCard(1).boundingBox()
  const session = await touchPage.context().newCDPSession(touchPage)
  await session.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: a.x + 5, y: a.y + a.height / 2 }] })
  await touchPage.waitForTimeout(350)
  await expect(touchCard(0)).toHaveAttribute("data-dragging", "")
  await session.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: b.x + b.width / 2, y: b.y + b.height / 2 }] })
  await expect(touchCard(1)).toHaveAttribute("data-sort-over", "")
  await session.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] })
  await expect(touchPage.locator("#order")).toHaveText(/^b1,b0,b2,/)
  await touchPage.close()
  assert.equal(errors.length, 0, errors.join("\n"))
  console.log("PASS moodboard: masonry sizing, four-way drag, keyboard/cancel, late images, removal/append, columns/resize, nested scrolling, multi-bookmark folder drops, controls, trash, pin locks, sort menu and persisted preferences")
} finally {
  await browser.close()
  await new Promise((resolve) => server.close(resolve))
}
