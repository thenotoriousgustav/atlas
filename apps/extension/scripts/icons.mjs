// Renders the toolbar and store icons from the Cabinet mark.
// Run from the repo: node apps/extension/scripts/icons.mjs  (uses the web app's Playwright)
import { createRequire } from "node:module"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"

const here = dirname(fileURLToPath(import.meta.url))
const require = createRequire(join(here, "../../web/package.json"))
const { chromium } = require("@playwright/test")

// The cabinet mark from apps/web/src/components/cabinet-brand.tsx, on Cabinet's ink.
const svg = (size) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="7" fill="#272924"/>
  <g transform="translate(9 6.5) scale(0.6)" fill="none" stroke="#f0f0ec" stroke-width="${size <= 16 ? 2.6 : 2.1}" stroke-linecap="round">
    <rect x="2" y="2" width="20" height="28" rx="2.5"/>
    <path d="M2 16h20M9 9h6M9 23h6"/>
  </g>
</svg>`

const browser = await chromium.launch()
try {
  const page = await browser.newPage({ deviceScaleFactor: 1 })
  for (const size of [16, 32, 48, 128]) {
    await page.setViewportSize({ width: size, height: size })
    await page.setContent(`<style>html,body{margin:0;background:transparent}</style>${svg(size)}`)
    await page.locator("svg").screenshot({ path: join(here, `../icons/icon-${size}.png`), omitBackground: true })
  }
} finally {
  await browser.close()
}
console.log("icons written")
