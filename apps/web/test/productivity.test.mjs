import assert from 'node:assert/strict'
import test from 'node:test'
import { bookmarkUrl } from '../src/lib/bookmark-url.ts'
import { bookmarkDraft, parseBookmarkDraft } from '../src/lib/bookmark-draft.ts'
import { NoteAutosave } from '../src/lib/note-autosave.ts'

test('duplicate matching normalizes host, default ports, fragments and a trailing slash, not query/path semantics', () => {
  assert.equal(bookmarkUrl(' HTTPS://EXAMPLE.COM:443/guide/#section '), 'https://example.com/guide')
  assert.equal(bookmarkUrl('example.com'), 'https://example.com')
  assert.equal(bookmarkUrl('http://localhost:4000/reference'), 'http://localhost:4000/reference')
  assert.notEqual(bookmarkUrl('https://example.com/A?q=1'), bookmarkUrl('https://example.com/a?q=2'))
  for (const value of ['', 'hello', 'javascript:alert(1)', 'data:text/html,hello', 'file:///etc/passwd', 'example.com/has space']) assert.equal(bookmarkUrl(value), null)
})

test('inspector drafts preserve clearing fields and reject malformed stored values', () => {
  const draft = bookmarkDraft({ title: 'Keep', tags: [{ name: 'design' }] })
  assert.deepEqual(parseBookmarkDraft(JSON.stringify(draft)), { title: 'Keep', description: '', notes: '', folderId: 'none', tags: ['design'] })
  for (const raw of [null, '{', '[]', '{}', JSON.stringify({ ...draft, tags: [123] }), JSON.stringify({ ...draft, notes: null })]) assert.equal(parseBookmarkDraft(raw), null)
})

test('the existing serial autosave also drains inspector snapshots before navigation and retains failed edits for retry', async () => {
  let release
  let fail = false
  const first = new Promise((resolve) => { release = resolve })
  const saved = []
  const queue = new NoteAutosave(async (snapshot) => {
    if (!saved.length) await first
    if (fail) throw new Error('Offline')
    saved.push(snapshot)
  }, () => {}, 60000)
  const original = bookmarkDraft({ title: 'Original' })
  queue.schedule(original)
  const flush = queue.flush()
  const latest = { ...original, title: 'Latest', notes: '', description: '', tags: [] }
  queue.schedule(latest)
  release()
  assert.equal(await flush, true)
  assert.deepEqual(saved, [original, latest])
  fail = true
  queue.schedule({ ...latest, notes: 'Recover this' })
  assert.equal(await queue.flush(), false)
  assert.equal(queue.hasUnsavedChanges, true)
  fail = false
  assert.equal(await queue.flush(), true)
  assert.equal(saved.at(-1).notes, 'Recover this')
  queue.dispose()
})
