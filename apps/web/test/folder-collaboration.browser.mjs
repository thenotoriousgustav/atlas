// Requires the web dev server: node test/folder-collaboration.browser.mjs
// All API responses are mocked; no accounts or memberships are changed.
import assert from "node:assert/strict"
import { chromium, expect } from "@playwright/test"

const origin = process.env.WEB_URL || "http://localhost:3000"
const token = "a".repeat(64)
const folderId = "11111111-1111-4111-8111-111111111111"
const browser = await chromium.launch({ headless: true })
try {
  const context = await browser.newContext()
  const page = await context.newPage()
  const errors = []
  page.on("pageerror", (error) => errors.push(error.message))
  let signedIn = false
  let joinStatus = 404
  let inviteEnabled = false
  await page.route("**/v1/**", async (route) => {
    const request = route.request()
    const path = new URL(request.url()).pathname
    const response = (body, status = 200) => route.fulfill({ status, contentType: "application/json", headers: { "Access-Control-Allow-Origin": origin, "Access-Control-Allow-Credentials": "true" }, body: JSON.stringify(body) })
    if (request.method() === "OPTIONS") return response({})
    if (path.endsWith("/auth/get-session")) return response(signedIn ? { user: { id: "owner", name: "Test owner", email: "owner@example.com" }, session: { id: "test", expiresAt: "2099-01-01T00:00:00Z" } } : null)
    if (path.endsWith(`/invitations/${token}/accept`)) return response({ data: { folderId } }, joinStatus)
    if (path.endsWith("/collaboration")) return response({ data: { inviteEnabled, members: [] } })
    if (path.endsWith("/invitation")) { inviteEnabled = request.method() === "PUT"; return response({ data: { token, inviteEnabled } }) }
    if (path.endsWith("/folders")) return response({ data: [{ id: folderId, userId: "owner", isOwner: true, name: "Team links", parentId: null }] })
    if (path.endsWith("/bookmarks")) return response({ data: { data: [], totalCount: 0, nextCursor: null } })
    if (path.endsWith("/health")) return response({ data: { total: 0, broken: 0, redirected: 0, favorites: 0, archived: 0, trash: 0, duplicates: 0 } })
    return response({ data: [] })
  })
  await page.goto(`${origin}/invite/${token}`)
  await expect(page.getByRole("link", { name: "Sign in to join" })).toHaveAttribute("href", `/login?next=${encodeURIComponent(`/invite/${token}`)}`)
  await page.goto(`${origin}/invite/invalid`)
  await expect(page.locator("main").getByRole("alert")).toHaveText("Invalid invitation link.")

  signedIn = true
  await context.addCookies([{ name: "cabinet.session_token", value: "browser-test", url: origin }])
  await page.goto(`${origin}/invite/${token}`)
  await page.getByRole("button", { name: "Join folder", exact: true }).click()
  await expect(page.locator("main").getByRole("alert")).toContainText("no longer active")
  joinStatus = 200
  await page.getByRole("button", { name: "Join folder", exact: true }).click()
  await page.waitForURL(`${origin}/cabinet?folder=${folderId}`)
  await page.getByRole("button", { name: "Invite friends" }).click()
  await expect(page.getByRole("dialog")).toContainText("Collaborate in Team links")
  await page.getByRole("button", { name: "Create invitation", exact: true }).click()
  await expect(page.getByLabel("Invitation link")).toHaveValue(`${origin}/invite/${token}`)
  await page.getByRole("button", { name: "Disable invitation", exact: true }).click()
  await expect(page.getByLabel("Invitation link")).toHaveCount(0)
  assert.deepEqual(errors, [])
  console.log("PASS invitation sign-in, invalid/revoked handling, acceptance redirect, owner invitation creation and revocation")
} finally { await browser.close() }
