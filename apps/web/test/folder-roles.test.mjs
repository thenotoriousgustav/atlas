import assert from "node:assert/strict"
import test from "node:test"
import { canAddToFolder, describeFolderAccess, folderAccess } from "../src/lib/folder-roles.ts"

test("viewers cannot add items; owners, contributors, and editors can", () => {
  assert.equal(canAddToFolder({ access: "VIEWER" }), false)
  for (const access of ["OWNER", "CONTRIBUTOR", "EDITOR"]) assert.equal(canAddToFolder({ access }), true)
})

test("older folder responses fall back to the previous member behavior", () => {
  assert.equal(folderAccess({ isOwner: true }), "OWNER")
  assert.equal(folderAccess({ isOwner: false }), "CONTRIBUTOR")
  assert.equal(folderAccess(undefined), "OWNER")
})

test("shared folders explain what the role allows", () => {
  assert.match(describeFolderAccess("VIEWER"), /view links and notes/)
  assert.match(describeFolderAccess("EDITOR"), /remove any item/)
})
