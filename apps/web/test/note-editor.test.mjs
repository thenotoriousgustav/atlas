import assert from "node:assert/strict"
import test from "node:test"
import { NoteAutosave } from "../src/lib/note-autosave.ts"
import {
  legacyNoteToDocument,
  parseNoteDraft,
} from "../src/lib/note-document.ts"

const snapshot = (title) => ({
  title,
  notes: title,
  noteDocument: legacyNoteToDocument(title),
})
const deferred = () => {
  let resolve
  const promise = new Promise((done) => {
    resolve = done
  })
  return { promise, resolve }
}

test("legacy notes retain literal markup, blank lines, and Unicode", () => {
  const document = legacyNoteToDocument(
    '# Old note\r\n\r\n<script>alert("no")</script> & 日本語'
  )
  assert.equal(document.type, "doc")
  assert.equal(document.content.length, 3)
  assert.equal(document.content[0].content[0].text, "# Old note")
  assert.equal(document.content[1].content, undefined)
  assert.equal(
    document.content[2].content[0].text,
    '<script>alert("no")</script> & 日本語'
  )
})

test("drafts accept valid snapshots and ignore corrupted storage", () => {
  const value = snapshot("Recovered")
  assert.deepEqual(parseNoteDraft(JSON.stringify(value)), value)
  for (const invalid of [
    null,
    "{",
    "null",
    "{}",
    '{"title":"x","notes":"x","noteDocument":{"type":"paragraph"}}',
  ]) {
    assert.equal(parseNoteDraft(invalid), null)
  }
})

test("autosave collapses rapid edits into the latest snapshot", async () => {
  const saved = []
  const queue = new NoteAutosave(
    async (value) => {
      saved.push(value)
    },
    () => {},
    60_000
  )
  queue.schedule(snapshot("First"))
  queue.schedule(snapshot("Latest"))
  assert.equal(queue.hasUnsavedChanges, true)
  assert.equal(await queue.flush(), true)
  assert.deepEqual(
    saved.map((value) => value.title),
    ["Latest"]
  )
  assert.equal(queue.hasUnsavedChanges, false)
  queue.dispose()
})

test("edits during a request are saved serially, not overwritten by older writes", async () => {
  const first = deferred()
  const saved = []
  let concurrent = 0
  const queue = new NoteAutosave(
    async (value) => {
      assert.equal(++concurrent, 1)
      saved.push(value.title)
      if (saved.length === 1) await first.promise
      concurrent--
    },
    () => {},
    60_000
  )
  queue.schedule(snapshot("First"))
  const pending = queue.flush()
  queue.schedule(snapshot("Second"))
  queue.schedule(snapshot("Latest"))
  assert.equal(queue.flush(), pending)
  first.resolve()
  assert.equal(await pending, true)
  assert.deepEqual(saved, ["First", "Latest"])
  assert.equal(queue.hasUnsavedChanges, false)
  queue.dispose()
})

test("failed saves retain the newest draft and expose a retryable error", async () => {
  let fail = true
  const states = []
  const saved = []
  const queue = new NoteAutosave(
    async (value) => {
      if (fail) throw new Error("Offline")
      saved.push(value.title)
    },
    (state) => states.push(state),
    60_000
  )
  queue.schedule(snapshot("Keep this"))
  assert.equal(await queue.flush(), false)
  assert.equal(states.at(-1), "error")
  assert.equal(queue.hasUnsavedChanges, true)
  fail = false
  assert.equal(await queue.flush(), true)
  assert.deepEqual(saved, ["Keep this"])
  assert.equal(states.at(-1), "saved")
  queue.dispose()
})

test("a failed earlier request does not replace edits made while it was saving", async () => {
  const first = deferred()
  let fail = true
  const saved = []
  const queue = new NoteAutosave(
    async (value) => {
      if (fail) {
        await first.promise
        throw new Error("Offline")
      }
      saved.push(value.title)
    },
    () => {},
    60_000
  )
  queue.schedule(snapshot("Old"))
  const pending = queue.flush()
  queue.schedule(snapshot("Newest"))
  first.resolve()
  assert.equal(await pending, false)
  fail = false
  assert.equal(await queue.flush(), true)
  assert.deepEqual(saved, ["Newest"])
  queue.dispose()
})
