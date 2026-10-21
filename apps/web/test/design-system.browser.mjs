// Isolated browser checks of the real primitives and media dialog. No production route is added.
import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import { createServer } from "node:http"
import { fileURLToPath } from "node:url"
import { build } from "esbuild"
import postcss from "postcss"
import tailwind from "@tailwindcss/postcss"
import { chromium, expect } from "@playwright/test"

const root = fileURLToPath(new URL("../", import.meta.url))
const [bundle, css, font] = await Promise.all([
  build({ absWorkingDir: root, entryPoints: ["test/fixtures/design-system.tsx"], bundle: true, write: false, platform: "browser", format: "esm", jsx: "automatic", define: { "process.env.NODE_ENV": '"development"', "process.env": "{}" } }),
  readFile(`${root}src/app/globals.css`, "utf8").then((source) => postcss([tailwind({ base: root })]).process(source, { from: `${root}src/app/globals.css` })),
  readFile(`${root}src/app/fonts/geist.woff2`),
])
const server = createServer((request, response) => {
  if (request.url === "/app.js") { response.setHeader("Content-Type", "text/javascript"); response.end(bundle.outputFiles[0].text) }
  else if (request.url === "/font.woff2") { response.setHeader("Content-Type", "font/woff2"); response.end(font) }
  else if (request.url === "/style.css") { response.setHeader("Content-Type", "text/css"); response.end(`${css.css}\n@font-face{font-family:Geist;src:url('/font.woff2');font-weight:100 900}:root{--font-geist-sans:Geist,sans-serif;--font-geist-mono:monospace}`) }
  else response.end('<html><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/style.css"></head><body><div id="root"></div><script type="module" src="/app.js"></script></body></html>')
})
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve))
const origin = `http://127.0.0.1:${server.address().port}`
const browser = await chromium.launch({ headless: true })
try {
  const page = await browser.newPage({ reducedMotion: "reduce" })
  const errors = []
  page.on("pageerror", (error) => errors.push(error.message))
  for (const theme of ["light", "dark"]) for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 960 })
    await page.goto(origin)
    await page.evaluate((theme) => document.documentElement.classList.toggle("dark", theme === "dark"), theme)
    await expect(page.getByRole("heading", { name: "Component checks" })).toBeVisible()
    for (const selector of ['[data-slot="input"]', '[data-slot="input-group"]', '[data-slot="textarea"]', '[aria-label="Icon action"]']) await expect(page.locator(selector).first()).toHaveCSS("border-top-left-radius", "6px")
    assert.ok(await page.getByRole("button", { name: "Delete item", exact: true }).evaluate((button) => {
      const ctx = document.createElement("canvas").getContext("2d")
      const rgb = (color) => { ctx.clearRect(0, 0, 1, 1); ctx.fillStyle = color; ctx.fillRect(0, 0, 1, 1); return [...ctx.getImageData(0, 0, 1, 1).data] }
      const over = (a, b) => a.slice(0, 3).map((v, i) => v * a[3] / 255 + b[i] * (1 - a[3] / 255)).concat(255)
      let bg = [255, 255, 255, 255]
      const chain = []
      for (let node = button; node; node = node.parentElement) chain.unshift(node)
      for (const node of chain) bg = over(rgb(getComputedStyle(node).backgroundColor), bg)
      const fg = over(rgb(getComputedStyle(button).color), bg)
      const lum = (c) => c.slice(0, 3).map((n) => n / 255).map((n) => n <= 0.04045 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4).reduce((s, n, i) => s + n * [0.2126, 0.7152, 0.0722][i], 0)
      const [lo, hi] = [lum(fg), lum(bg)].sort((a, b) => a - b)
      return (hi + 0.05) / (lo + 0.05) >= 4.5
    }), `${theme} ${width}: destructive contrast`)
    await expect(page.locator('[data-slot="card"]').first()).toHaveCSS("border-top-left-radius", "8px")
    await expect(page.locator('[data-slot="badge"]')).toHaveCSS("border-top-left-radius", "4px")
    await expect(page.locator('[aria-label="Connected choices"] [data-slot="toggle-group-item"]').first()).toHaveCSS("border-top-left-radius", "6px")
    await expect(page.locator('[aria-label="Connected choices"] [data-slot="toggle-group-item"]').last()).toHaveCSS("border-top-right-radius", "6px")
    await expect(page.locator('[data-selected-single="true"]')).toHaveCSS("border-top-left-radius", "6px")
    await page.getByRole("button", { name: "Open commands", exact: true }).click()
    await expect(page.getByRole("dialog")).toHaveCSS("border-top-left-radius", "12px")
    await expect(page.getByRole("option", { name: "Save bookmark", exact: true })).toHaveCSS("border-top-left-radius", "6px")
    await expect(page.getByRole("option", { name: "Save bookmark", exact: true })).toHaveCSS("font-size", "14px")
    await page.getByRole("combobox", { name: "Find command" }).fill("folder")
    await page.keyboard.press("ArrowDown")
    await page.keyboard.press("Enter")
    await expect(page.locator("#chosen")).toHaveText("folder")
    for (const [button, slot, radius] of [["Open menu", "dropdown-menu-content", 8], ["Open popover", "popover-content", 8], ["Open dialog", "dialog-content", 12], ["Open confirmation", "alert-dialog-content", 12], ["Open drawer", "drawer-content", 12], ["Open sheet", "sheet-content", 12]]) {
      await page.getByRole("button", { name: button, exact: true }).click()
      await expect(page.locator(`[data-slot="${slot}"]`)).toHaveCSS("border-top-left-radius", `${radius}px`)
      if (slot === "dropdown-menu-content") await expect(page.getByRole("menuitem", { name: "Menu action" })).toHaveCSS("border-top-left-radius", "6px")
      if (slot === "sheet-content") {
        await expect(page.getByRole("heading", { name: "Sheet title" })).toHaveCSS("font-size", "16px")
        await expect(page.locator('[data-slot="sheet-content"]').getByRole("button", { name: "Close" })).toHaveCSS("border-top-left-radius", "6px")
      }
      if (slot === "alert-dialog-content") await page.getByRole("button", { name: "Cancel confirmation" }).click()
      else await page.keyboard.press("Escape")
    }
    await page.getByRole("combobox", { name: "Small select" }).click()
    await expect(page.getByRole("option", { name: "Two", exact: true })).toHaveCSS("border-top-left-radius", "6px")
    await page.getByRole("option", { name: "Two", exact: true }).click()
    await page.getByRole("button", { name: "Hover help", exact: true }).hover()
    await expect(page.locator('[data-slot="tooltip-content"]')).toHaveCSS("border-top-left-radius", "6px")
    await page.mouse.move(0, 0)
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${theme} ${width}: overflow`)
    await page.screenshot({ path: `/tmp/cabinet-components-${theme}-${width}.png`, fullPage: true, animations: "disabled" })
  }
  let payload
  await page.route("**/v1/bookmarks/media/download", async (route) => {
    const headers = { "Access-Control-Allow-Origin": origin, "Access-Control-Allow-Credentials": "true", "Access-Control-Allow-Headers": "content-type", "Access-Control-Allow-Methods": "POST,OPTIONS" }
    if (route.request().method() === "OPTIONS") return route.fulfill({ status: 204, headers })
    payload = route.request().postDataJSON()
    return route.fulfill({ headers, contentType: "video/mp4", body: "explicit test media" })
  })
  await page.getByRole("button", { name: "Open media 1", exact: true }).click()
  await page.getByRole("radio", { name: "Audio Only (MP3)", exact: true }).click()
  await expect(page.locator('input[value="a1"]')).toBeChecked()
  await page.getByRole("button", { name: "Close media download" }).click()
  await page.getByRole("button", { name: "Open media 2", exact: true }).click()
  await expect(page.locator('input[value="a2"]')).toBeChecked()
  const [download] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Download MP3", exact: true }).click()])
  assert.equal(payload.formatId, "a2")
  assert.equal(payload.mediaType, "AUDIO")
  assert.match(download.suggestedFilename(), /\.mp3$/)
  assert.deepEqual(errors, [])
  console.log("PASS design system: real computed radii, command search/keyboard, menu/select/dialog/confirmation/drawer, connected edges, calendar, both themes and widths, media format reset/download payload")
} finally { await browser.close(); await new Promise((resolve) => server.close(resolve)) }
