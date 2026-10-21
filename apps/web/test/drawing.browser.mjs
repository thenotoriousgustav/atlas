// Requires the web dev server: node test/drawing.browser.mjs [screenshot-dir]
// Every API response is faked; no account or data is changed.
import assert from "node:assert/strict"
import { join } from "node:path"
import { chromium, expect } from "@playwright/test"

const origin = process.env.WEB_URL || "http://localhost:3000"
const shots = process.argv[2]
const drawingId = "33333333-3333-4333-8333-333333333333"
const sharedId = "44444444-4444-4444-8444-444444444444"
const browser = await chromium.launch({ headless: true })
try {
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } })
  await context.addCookies([{ name: "cabinet.session_token", value: "test", url: origin }])
  const page = await context.newPage()
  const errors = []
  page.on("pageerror", (error) => errors.push(error.message))
  const saves = []
  await page.route("**/v1/**", async (route) => {
    const request = route.request()
    const path = new URL(request.url()).pathname
    const json = (body, status = 200) => route.fulfill({ status, contentType: "application/json", headers: { "Access-Control-Allow-Origin": origin, "Access-Control-Allow-Credentials": "true" }, body: JSON.stringify(body) })
    if (request.method() === "OPTIONS") return json({})
    if (path.endsWith("/auth/get-session")) return json({ user: { id: "me", name: "Gustav", email: "g@example.com" }, session: { id: "s", expiresAt: "2099-01-01T00:00:00Z" } })
    if (path.endsWith("/folders")) return json({ data: [{ id: "f1", name: "Sketches", isOwner: true, access: "OWNER" }] })
    if (path.endsWith(`/bookmarks/${drawingId}/drawing`)) { saves.push(request.postDataJSON()); return json({ data: { id: drawingId } }) }
    if (path.endsWith(`/bookmarks/${drawingId}`)) return json({ message: "Not found" }, 404)
    if (path.endsWith(`/bookmarks/${sharedId}`)) return json({ data: {
      id: sharedId, type: "DRAWING", title: "Team flow", access: "viewer", folderId: "f1",
      drawing: { elements: [], appState: { viewBackgroundColor: "#ffffff" }, files: {} },
    } })
    return json({ data: [] })
  })

  // A new drawing: opening it saves nothing.
  await page.goto(`${origin}/cabinet/drawings/${drawingId}?new=1&folder=f1`)
  const canvas = page.locator("canvas.interactive")
  await canvas.waitFor({ timeout: 20000 })
  await page.waitForTimeout(2500)
  assert.equal(saves.length, 0, "opening a new drawing does not create it")
  await expect(page.getByRole("status").filter({ hasText: "Start drawing to save" })).toBeVisible()

  // Draw a rectangle and name it; autosave sends the scene and a preview.
  await page.getByLabel("Drawing title").fill("Onboarding flow")
  await page.keyboard.press("Escape")
  const box = await canvas.boundingBox()
  await page.getByRole("radio", { name: /Rectangle/ }).check({ force: true })
  await page.mouse.move(box.x + 300, box.y + 200)
  await page.mouse.down()
  await page.mouse.move(box.x + 560, box.y + 380, { steps: 8 })
  await page.mouse.up()
  // The title saves on its own first; wait for the save that carries the rectangle.
  const drawn = () => saves.findLast((save) => save.scene.elements.some((element) => !element.isDeleted && element.type === "rectangle"))
  await expect.poll(drawn, { timeout: 10000 }).toBeTruthy()
  await expect(page.getByRole("status").filter({ hasText: "All changes saved" })).toBeVisible({ timeout: 10000 })
  const last = drawn()
  assert.equal(last.title, "Onboarding flow")
  assert.equal(last.folderId, "f1")
  assert.equal(last.scene.elements.filter((element) => !element.isDeleted && element.type === "rectangle").length, 1)
  assert.match(last.preview, /^data:image\/webp;base64,/)
  assert.ok(last.preview.length < 600_000, "the preview stays small")
  assert.deepEqual(Object.keys(last.scene.appState), ["viewBackgroundColor"])
  await expect(page).toHaveURL(`${origin}/cabinet/drawings/${drawingId}`)
  if (shots) await page.screenshot({ path: join(shots, "drawing-editor.png") })

  // A drawing shared as view only opens read-only.
  await page.goto(`${origin}/cabinet/drawings/${sharedId}`)
  await page.locator("canvas.interactive").waitFor({ timeout: 20000 })
  await expect(page.getByRole("status").filter({ hasText: "View only" })).toBeVisible()
  await expect(page.getByLabel("Drawing title")).toHaveAttribute("readonly", "")
  await expect(page.getByLabel("Drawing folder")).toHaveCount(0)

  assert.deepEqual(errors, [])
  console.log("PASS new drawing saves nothing until drawn, autosave sends scene, title, folder and a small preview, view-only sharing")
} finally {
  await browser.close()
}
