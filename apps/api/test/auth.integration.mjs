import assert from "node:assert/strict"
import { randomUUID } from "node:crypto"
import { spawn } from "node:child_process"
import { once } from "node:events"
import { createRequire } from "node:module"

const require = createRequire(import.meta.url)
const { PrismaClient } = require("@prisma/client")
const { PrismaPg } = require("@prisma/adapter-pg")
const argon2 = require("argon2")

if (process.env.NODE_ENV === "production")
  throw new Error(
    "Run authentication checks against a development database only"
  )
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
})
const apiUrl = "http://localhost:4141"
const origin = "http://localhost:3000"
const id = randomUUID()
const otherOwnerId = randomUUID()
const email = `auth-check-${id}@example.com`
const password = randomUUID()
const initialBookmarks = await prisma.bookmark.count()
let logs = ""
const api = spawn(process.execPath, ["dist/main.js"], {
  env: {
    ...process.env,
    PORT: "4141",
    API_URL: apiUrl,
    FRONTEND_URL: origin,
    NODE_ENV: "test",
    COOKIE_DOMAIN: "localhost",
  },
  stdio: ["ignore", "pipe", "pipe"],
})
api.stdout.on("data", (chunk) => {
  logs += chunk
})
api.stderr.on("data", (chunk) => {
  logs += chunk
})

const post = (path, body, cookie, requestOrigin = origin) =>
  fetch(`${apiUrl}/v1/auth/${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: requestOrigin,
      ...(cookie ? { Cookie: cookie } : {}),
    },
    body: JSON.stringify(body),
  })

try {
  let ready = false
  for (let attempt = 0; attempt < 100; attempt++) {
    if (api.exitCode !== null)
      throw new Error(`API exited before becoming ready: ${logs}`)
    try {
      const result = await fetch(`${apiUrl}/v1/bookmarks`)
      if (result.status === 401) {
        ready = true
        break
      }
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 100))
  }
  assert.ok(ready, `API did not become ready: ${logs}`)

  const hash = await argon2.hash(password)
  await prisma.user.create({
    data: {
      id,
      email,
      name: "Authentication check",
      avatar: "https://example.com/avatar.png",
      accounts: {
        create: { providerId: "credential", accountId: id, password: hash },
      },
    },
  })

  assert.equal(
    (await post("sign-in/email", { email, password: "wrong-password" })).status,
    401
  )
  assert.equal(
    (
      await post(
        "sign-in/email",
        { email, password },
        undefined,
        "https://untrusted.example"
      )
    ).status,
    403
  )
  assert.equal(
    (
      await post("sign-up/email", {
        email: `new-${email}`,
        password,
        name: "New user",
      })
    ).status,
    400
  )

  const signIn = await post("sign-in/email", { email, password })
  assert.equal(signIn.status, 200, await signIn.clone().text())
  const signedInUser = (await signIn.json()).user
  assert.equal(signedInUser.id, id)
  assert.equal(signedInUser.image, "https://example.com/avatar.png")
  assert.equal(signedInUser.password, undefined)
  const sessionCookie = signIn.headers
    .getSetCookie()
    .find((value) => value.startsWith("cabinet.session_token="))
  assert.ok(sessionCookie?.includes("HttpOnly"))
  const cookie = sessionCookie.split(";")[0]

  const session = await fetch(`${apiUrl}/v1/auth/get-session`, {
    headers: { Cookie: cookie },
  })
  assert.equal((await session.json()).user.id, id)
  const bookmarks = await fetch(`${apiUrl}/v1/bookmarks`, {
    headers: { Cookie: cookie },
  })
  assert.equal(bookmarks.status, 200)
  assert.deepEqual((await bookmarks.json()).data.data, [])
  assert.equal(
    (
      await fetch(`${apiUrl}/v1/bookmarks`, {
        headers: { Cookie: "access_token=legacy-jwt" },
      })
    ).status,
    401
  )
  assert.equal(
    (
      await fetch(`${apiUrl}/v1/bookmarks`, {
        headers: { Cookie: "cabinet.session_token=tampered" },
      })
    ).status,
    401
  )

  const profileUpdate = await fetch(`${apiUrl}/v1/users/profile`, {
    method: "PATCH",
    headers: { Cookie: cookie, "Content-Type": "application/json" },
    body: JSON.stringify({ name: "Updated name" }),
  })
  assert.equal(profileUpdate.status, 200)
  assert.equal((await profileUpdate.json()).data.name, "Updated name")

  const noteDocument = {
    type: "doc",
    content: [
      { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Rich note" }] },
      { type: "taskList", content: [{ type: "taskItem", attrs: { checked: true }, content: [{ type: "paragraph", content: [{ type: "text", text: "Done" }] }] }] },
      { type: "image", attrs: { src: "https://example.com/photo.png", width: "60%" } },
    ],
  }
  const saveNote = (noteId, body, sessionCookie = cookie) => fetch(`${apiUrl}/v1/bookmarks/${noteId}/note`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...(sessionCookie ? { Cookie: sessionCookie } : {}) },
    body: JSON.stringify(body),
  })
  const noteId = randomUUID()
  const folder = await prisma.folder.create({ data: { name: "Note test folder", userId: id } })
  const snapshot = { title: "My rich note", notes: "Rich note\nDone", noteDocument, folderId: folder.id }
  assert.equal((await saveNote(noteId, snapshot, "")).status, 401)
  const firstSave = await saveNote(noteId, snapshot)
  assert.equal(firstSave.status, 200, await firstSave.clone().text())
  assert.equal((await firstSave.json()).data.id, noteId)
  const secondSave = await saveNote(noteId, { ...snapshot, title: "Latest title" })
  assert.equal(secondSave.status, 200, await secondSave.clone().text())
  assert.equal(await prisma.bookmark.count({ where: { id: noteId } }), 1)
  const persisted = await prisma.bookmark.findUnique({ where: { id: noteId } })
  assert.equal(persisted.title, "Latest title")
  assert.equal(persisted.folderId, folder.id)
  assert.deepEqual(persisted.noteDocument, noteDocument)
  assert.equal(persisted.notes, snapshot.notes)
  assert.equal((await saveNote(noteId, { ...snapshot, noteDocument: { type: "paragraph" } })).status, 400)
  assert.equal((await saveNote("not-a-uuid", snapshot)).status, 400)

  await prisma.user.create({ data: { id: otherOwnerId, email: `note-owner-${otherOwnerId}@example.com`, name: "Note ownership fixture" } })
  const protectedNote = await prisma.bookmark.create({ data: { userId: otherOwnerId, type: "NOTE", title: "Protected fixture", metadataStatus: "COMPLETED" } })
  assert.equal((await saveNote(protectedNote.id, snapshot)).status, 404)
  assert.equal((await prisma.bookmark.findUnique({ where: { id: protectedNote.id } })).title, "Protected fixture")

  const tag = await prisma.tag.create({ data: { name: `note-test-${id}`, userId: id } })
  const legacy = await prisma.bookmark.create({ data: { userId: id, type: "NOTE", title: "Legacy note", notes: "Old plain text", folderId: folder.id, tags: { connect: { id: tag.id } }, metadataStatus: "COMPLETED" } })
  assert.equal(legacy.noteDocument, null)
  assert.equal((await saveNote(legacy.id, snapshot)).status, 200)
  const updatedLegacy = await prisma.bookmark.findUnique({ where: { id: legacy.id }, include: { tags: true } })
  assert.equal(updatedLegacy.folderId, folder.id)
  assert.equal(updatedLegacy.tags[0].id, tag.id)
  assert.deepEqual(updatedLegacy.noteDocument, noteDocument)
  await prisma.bookmark.update({ where: { id: legacy.id }, data: { deletedAt: new Date() } })
  assert.equal((await saveNote(legacy.id, snapshot)).status, 404)

  const sharedFolder = await prisma.folder.create({ data: { name: "Shared references", userId: id } })
  const childFolder = await prisma.folder.create({ data: { name: "Private child", parentId: sharedFolder.id, userId: id } })
  const otherFolder = await prisma.folder.create({ data: { name: "Other owner folder", userId: otherOwnerId } })
  const publicBookmark = await prisma.bookmark.create({
    data: {
      userId: id,
      folderId: sharedFolder.id,
      type: "BOOKMARK",
      url: "https://example.com/public",
      title: "Public bookmark",
      description: "Visible description",
      notes: "Private bookmark note",
      imageUrl: "https://example.com/public.png",
      position: 1,
      tags: { connect: { id: tag.id } },
      metadataStatus: "COMPLETED",
    },
  })
  await prisma.bookmark.createMany({
    data: [
      { userId: id, folderId: sharedFolder.id, type: "NOTE", title: "Private note", notes: "Secret", metadataStatus: "COMPLETED" },
      { userId: id, folderId: sharedFolder.id, type: "BOOKMARK", url: "https://example.com/archived", title: "Archived", isArchived: true, metadataStatus: "COMPLETED" },
      { userId: id, folderId: sharedFolder.id, type: "BOOKMARK", url: "https://example.com/deleted", title: "Deleted", deletedAt: new Date(), metadataStatus: "COMPLETED" },
      { userId: id, folderId: childFolder.id, type: "BOOKMARK", url: "https://example.com/child", title: "Child bookmark", metadataStatus: "COMPLETED" },
    ],
  })

  assert.equal((await fetch(`${apiUrl}/v1/folders/${sharedFolder.id}/share`)).status, 401)
  assert.equal((await fetch(`${apiUrl}/v1/folders/${otherFolder.id}/share`, { headers: { Cookie: cookie } })).status, 404)
  assert.equal((await fetch(`${apiUrl}/v1/folders/${otherFolder.id}/share`, { method: "PUT", headers: { Cookie: cookie } })).status, 404)

  const enabled = await fetch(`${apiUrl}/v1/folders/${sharedFolder.id}/share`, { method: "PUT", headers: { Cookie: cookie } })
  assert.equal(enabled.status, 200)
  const firstToken = (await enabled.json()).data.shareToken
  assert.match(firstToken, /^[a-f0-9]{64}$/)
  const enabledAgain = await fetch(`${apiUrl}/v1/folders/${sharedFolder.id}/share`, { method: "PUT", headers: { Cookie: cookie } })
  assert.equal((await enabledAgain.json()).data.shareToken, firstToken)

  const sharedResponse = await fetch(`${apiUrl}/v1/folders/shared/${firstToken}`)
  assert.equal(sharedResponse.status, 200)
  assert.equal(sharedResponse.headers.get("cache-control"), "private, no-store")
  const sharedData = (await sharedResponse.json()).data
  assert.deepEqual(sharedData, {
    name: "Shared references",
    bookmarks: [
      {
        id: publicBookmark.id,
        url: "https://example.com/public",
        title: "Public bookmark",
        description: "Visible description",
        imageUrl: "https://example.com/public.png",
      },
    ],
  })

  assert.equal((await fetch(`${apiUrl}/v1/folders/${sharedFolder.id}/share`, { method: "DELETE", headers: { Cookie: cookie } })).status, 200)
  assert.equal((await fetch(`${apiUrl}/v1/folders/shared/${firstToken}`)).status, 404)
  const reenabled = await fetch(`${apiUrl}/v1/folders/${sharedFolder.id}/share`, { method: "PUT", headers: { Cookie: cookie } })
  const rotatedToken = (await reenabled.json()).data.shareToken
  assert.notEqual(rotatedToken, firstToken)
  assert.equal((await fetch(`${apiUrl}/v1/folders/shared/${firstToken}`)).status, 404)
  assert.equal((await fetch(`${apiUrl}/v1/folders/shared/${rotatedToken}`)).status, 200)
  await fetch(`${apiUrl}/v1/folders/${sharedFolder.id}`, { method: "DELETE", headers: { Cookie: cookie } })
  assert.equal((await fetch(`${apiUrl}/v1/folders/shared/${rotatedToken}`)).status, 404)

  await prisma.bookmark.deleteMany({ where: { userId: { in: [id, otherOwnerId] } } })

  assert.equal((await post("sign-out", {}, cookie)).status, 200)
  assert.equal(
    (await fetch(`${apiUrl}/v1/bookmarks`, { headers: { Cookie: cookie } }))
      .status,
    401
  )
  assert.equal(await prisma.session.count({ where: { userId: id } }), 0)
  assert.equal(await prisma.bookmark.count(), initialBookmarks)
  console.log(
    "Authentication integration check passed: password, session cookie, guard, profile, signup policy, origin check, note autosave/ownership/legacy preservation, and logout."
  )
} finally {
  if (api.exitCode === null) {
    const exited = once(api, "exit")
    api.kill("SIGTERM")
    await exited
  }
  // Only the uniquely identified fixture is deleted. Existing records remain untouched.
  await prisma.user.deleteMany({ where: { id: { in: [id, otherOwnerId] } } })
  await prisma.$disconnect()
}
