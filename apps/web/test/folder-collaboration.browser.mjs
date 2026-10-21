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
  let inviteRole = "CONTRIBUTOR"
  let shareToken = null
  let members = []
  const writes = []
  await page.route("**/v1/**", async (route) => {
    const request = route.request()
    const path = new URL(request.url()).pathname
    const method = request.method()
    const body = request.postData() ? JSON.parse(request.postData()) : undefined
    const response = (body, status = 200) => route.fulfill({ status, contentType: "application/json", headers: { "Access-Control-Allow-Origin": origin, "Access-Control-Allow-Credentials": "true" }, body: JSON.stringify(body) })
    if (method === "OPTIONS") return response({})
    if (method !== "GET") writes.push({ method, path, body })
    if (path.endsWith("/auth/get-session")) return response(signedIn ? { user: { id: "owner", name: "Test owner", email: "owner@example.com" }, session: { id: "test", expiresAt: "2099-01-01T00:00:00Z" } } : null)
    if (path.endsWith(`/invitations/${token}/accept`)) return response({ data: { folderId } }, joinStatus)
    if (path.endsWith("/collaboration")) return response({ data: { owner: { id: "owner", name: "Test owner", email: "owner@example.com" }, inviteEnabled, inviteRole, members } })
    if (path.endsWith("/invitation")) {
      if (method === "PUT") { inviteEnabled = true; inviteRole = body?.role ?? inviteRole }
      if (method === "PATCH") inviteRole = body.role
      if (method === "DELETE") inviteEnabled = false
      return response({ data: { token, inviteEnabled, inviteRole } })
    }
    if (path.endsWith(`/folders/${folderId}/members`) && method === "POST") {
      if (body.email === "nobody@example.com") return response({ message: "No Cabinet account uses this email. Send them the invite link instead." }, 404)
      members = [...members, { userId: "22222222-2222-4222-8222-222222222222", role: body.role, user: { name: "Friend", email: body.email } }]
      return response({ data: members.at(-1) })
    }
    if (path.includes(`/folders/${folderId}/members/`)) {
      if (method === "PATCH") members = members.map((member) => ({ ...member, role: body.role }))
      if (method === "DELETE") { members = []; inviteEnabled = false }
      return response({ data: {} })
    }
    if (path.endsWith("/share")) {
      if (method === "PUT") shareToken = "b".repeat(64)
      if (method === "DELETE") shareToken = null
      return response({ data: { shareToken } })
    }
    if (path.endsWith("/folders")) return response({ data: [{ id: folderId, userId: "owner", isOwner: true, access: "OWNER", name: "Team links", parentId: null }] })
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
  await page.waitForURL(`${origin}/cabinet/folders/${folderId}`)

  // One Share dialog, like Google Drive: people, roles, invite link, general access.
  await page.getByRole("button", { name: "Share", exact: true }).click()
  const dialog = page.getByRole("dialog")
  await expect(dialog).toContainText("Share “Team links”")
  await expect(dialog).toContainText("Owner")

  await dialog.getByLabel("Email address").fill("nobody@example.com")
  await dialog.getByRole("button", { name: "Share", exact: true }).click()
  await expect(dialog.getByRole("alert")).toContainText("No Cabinet account uses this email")

  await dialog.getByLabel("Email address").fill("friend@example.com")
  await dialog.getByRole("combobox", { name: "Role for the new person" }).click()
  await page.getByRole("option", { name: "Editor" }).click()
  await dialog.getByRole("button", { name: "Share", exact: true }).click()
  const friendRole = dialog.getByRole("combobox", { name: "Access for Friend" })
  await expect(friendRole).toHaveText("Editor")
  assert.deepEqual(writes.at(-1).body, { email: "friend@example.com", role: "EDITOR" })

  await friendRole.click()
  await page.getByRole("option", { name: "Viewer" }).click()
  await expect(friendRole).toHaveText("Viewer")
  assert.deepEqual(writes.at(-1).body, { role: "VIEWER" })

  // Choosing a role for a link that does not exist yet must not create one.
  const writesBeforeRole = writes.length
  await dialog.getByRole("combobox", { name: "Role for people who join with the link" }).click()
  await page.getByRole("option", { name: "Editor" }).click()
  assert.equal(writes.length, writesBeforeRole)
  await dialog.getByRole("button", { name: "Create invite link", exact: true }).click()
  await expect(dialog.getByRole("button", { name: "Copy invite link", exact: true })).toBeVisible()
  assert.deepEqual(writes.at(-1), { method: "PUT", path: `/v1/folders/${folderId}/invitation`, body: { role: "EDITOR" } })
  await dialog.getByRole("button", { name: "Turn off", exact: true }).click()
  await expect(dialog.getByRole("button", { name: "Copy invite link", exact: true })).toHaveCount(0)
  await expect(dialog.getByRole("button", { name: "Create invite link", exact: true })).toBeVisible()

  await dialog.getByRole("combobox", { name: "General access" }).click()
  await page.getByRole("option", { name: "Anyone with the link" }).click()
  await expect(dialog.getByRole("button", { name: "Copy public link", exact: true })).toBeVisible()

  await friendRole.click()
  await page.getByRole("option", { name: "Remove access" }).click()
  await expect(dialog.getByRole("combobox", { name: "Access for Friend" })).toHaveCount(0)
  assert.deepEqual(errors, [])
  console.log("PASS invitation sign-in, invalid/revoked handling, acceptance redirect, sharing by email with roles, role changes, role-based invite link, public access, and removal")
} finally { await browser.close() }
