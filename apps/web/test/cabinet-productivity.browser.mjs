// Explicit stateful API fixtures; never writes to a real account.
import assert from 'node:assert/strict'
import { chromium, expect } from '@playwright/test'
import { bookmarks as samples, folder, cabinetResponse } from './fixtures/cabinet-data.mjs'

const origin = process.env.WEB_URL || 'http://localhost:3000'
const otherFolder = { ...folder, id: '22222222-2222-4222-8222-222222222222', name: 'Elsewhere' }
const rows = structuredClone(samples).map((item) => ({ ...item, imageUrl: null, isArchived: false }))
rows.push({ ...rows[3], id: 'outside-note', title: 'A distant reading note', notes: 'ginkgo needle', folderId: otherFolder.id, folder: otherFolder, isArchived: true })
for (let i = 0; i < 25; i++) rows.push({ ...rows[0], id: `outside-${i}`, title: `UX paging ${i}`, url: `https://example.org/paging/${i}`, folderId: otherFolder.id, folder: otherFolder, isArchived: true })
const requests = [], writes = [], errors = []
let failWrites = false, failSearch = false, slowFrame = false, releaseFrame
const browser = await chromium.launch({ headless: true })
try {
  const context = await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 1440, height: 960 } })
  await context.addCookies([{ name: 'cabinet.session_token', value: 'browser-test', url: origin }])
  await context.addInitScript(() => { if (window === window.top) { try { localStorage.setItem('cabinet_view_mode', 'moodboard') } catch {} } })
  await context.route('https://jdan.github.io/**', async (route) => {
    if (slowFrame) await new Promise((resolve) => { releaseFrame = resolve })
    await route.fulfill({ contentType: 'text/html', headers: { 'Content-Security-Policy': "frame-ancestors 'none'" }, body: '<h1>Embedding is intentionally blocked in this fixture</h1>' }).catch(() => {})
  })
  await context.route('**/v1/**', async (route) => {
    const request = route.request(), url = new URL(request.url()), path = url.pathname, params = url.searchParams
    requests.push({ method: request.method(), path, params: Object.fromEntries(params) })
    const reply = (body, status = 200) => route.fulfill({ status, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Credentials': 'true', 'Access-Control-Allow-Headers': 'content-type' }, body: JSON.stringify(body) })
    if (request.method() === 'OPTIONS') return reply({})
    if (path.endsWith('/folders')) return reply({ data: [folder, otherFolder] })
    if (path.endsWith('/bookmarks') && request.method() === 'GET') {
      if (failSearch && params.has('search')) return reply({}, 500)
      let result = rows.filter((item) => (!params.has('folderId') || item.folderId === params.get('folderId')) && (!params.has('isArchived') || item.isArchived === (params.get('isArchived') === 'true')) && (!params.has('search') || `${item.title} ${item.url} ${item.description} ${item.notes}`.toLowerCase().includes(params.get('search').toLowerCase())))
      const totalCount = result.length, start = params.has('cursor') ? result.findIndex((item) => item.id === params.get('cursor')) + 1 : 0, limit = Number(params.get('limit') || 50)
      const page = result.slice(start, start + limit)
      return reply({ data: { data: page, totalCount, nextCursor: start + limit < totalCount ? page.at(-1).id : null } })
    }
    if (path.endsWith('/bookmarks') && request.method() === 'POST') {
      const data = request.postDataJSON()
      const item = { ...rows[0], ...data, id: 'pasted-reference', title: data.title || 'Pasted reference', tags: [], folder: data.folderId === folder.id ? folder : null }
      rows.push(item); writes.push({ method: 'POST', data }); return reply({ data: item })
    }
    if (path.includes('/bookmarks/') && request.method() === 'PATCH') {
      const data = request.postDataJSON(), id = path.split('/').at(-1)
      writes.push({ method: 'PATCH', id, data })
      if (failWrites) return reply({}, 500)
      const item = rows.find((item) => item.id === id)
      Object.assign(item, data, { tags: (data.tags || item.tags).map((tag) => typeof tag === 'string' ? { name: tag } : tag) })
      if ('folderId' in data) item.folder = data.folderId === folder.id ? folder : data.folderId === otherFolder.id ? otherFolder : null
      return reply({ data: item })
    }
    const note = rows.find((item) => path.endsWith(`/bookmarks/${item.id}`))
    return reply(note ? { data: note } : cabinetResponse(url.href))
  })
  const page = await context.newPage()
  page.on('pageerror', (error) => errors.push(error.message))
  // Expected HTTP 500/CSP logs belong to these failure fixtures; React render warnings do not.
  page.on('console', (message) => {
    if (message.type() === 'error' && /hydration|cannot be a descendant|each child.*key|cannot update a component|uncontrolled input|controlled input/i.test(message.text())) errors.push(message.text())
  })
  const home = async () => {
    await page.goto(`${origin}/cabinet?folder=${folder.id}`)
    await expect(page.getByRole('heading', { name: folder.name, exact: true })).toBeVisible()
  }
  const inspector = page.getByLabel('Bookmark inspector', { exact: true })
  const openFirst = async () => {
    const card = page.locator('[data-slot="card"]').filter({ has: page.locator(`a[href="${rows[0].url}"]`) })
    await card.getByRole('link', { name: /^Preview / }).click()
    await expect(inspector).toBeVisible()
  }
  await home(); await openFirst()
  await inspector.getByRole('textbox', { name: 'Title', exact: true }).fill('Saved automatically')
  await expect.poll(() => rows[0].title).toBe('Saved automatically')
  await expect(inspector.getByRole('status')).toHaveText('All changes saved')
  await inspector.getByRole('textbox', { name: 'Personal Note', exact: true }).fill('Save before navigating')
  await page.getByRole('button', { name: 'Next bookmark (Right arrow)', exact: true }).click()
  await expect(page.getByRole('heading', { name: rows[1].title, exact: true })).toBeVisible()
  assert.equal(rows[0].notes, 'Save before navigating')
  await page.getByRole('button', { name: 'Previous bookmark (Left arrow)', exact: true }).click()
  await expect(inspector.getByRole('textbox', { name: 'Personal Note', exact: true })).toHaveValue('Save before navigating')
  failWrites = true
  await inspector.getByRole('textbox', { name: 'Description', exact: true }).fill('Keep my offline changes')
  await page.getByRole('button', { name: 'Next bookmark (Right arrow)', exact: true }).click()
  await expect(inspector.getByRole('status')).toHaveText('Not saved. Your changes are still here.')
  await expect(inspector.getByRole('textbox', { name: 'Title', exact: true })).toHaveValue('Saved automatically')
  assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('cabinet:inspector-draft:v1:owner:sample-0')).description), 'Keep my offline changes')
  failWrites = false
  await inspector.getByRole('button', { name: 'Retry save', exact: true }).click()
  await expect(inspector.getByRole('status')).toHaveText('All changes saved')
  await inspector.getByRole('textbox', { name: 'Personal Note', exact: true }).fill('')
  await inspector.getByRole('textbox', { name: 'Description', exact: true }).fill('')
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toHaveCount(0)
  assert.equal(rows[0].notes, ''); assert.equal(rows[0].description, '')
  await openFirst()
  failWrites = true
  await inspector.getByRole('textbox', { name: 'Title', exact: true }).fill('Recovered draft')
  await inspector.getByRole('textbox', { name: 'Description', exact: true }).fill('A useful saved reference')
  await inspector.getByRole('textbox', { name: 'Personal Note', exact: true }).fill('Recovered notes')
  await page.keyboard.press('Escape')
  await expect(inspector.getByRole('button', { name: 'Close & keep draft', exact: true })).toBeVisible()
  await inspector.getByRole('button', { name: 'Close & keep draft', exact: true }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  failWrites = false
  await openFirst()
  await expect(inspector.getByRole('button', { name: 'Restore draft' })).toBeVisible()
  assert.equal(rows[0].title, 'Saved automatically')
  await inspector.getByRole('button', { name: 'Restore draft' }).click()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toHaveCount(0)
  assert.equal(rows[0].title, 'Recovered draft')

  await page.keyboard.press('Control+k')
  const command = page.getByRole('combobox', { name: 'Search commands and bookmarks' })
  await expect(page.getByRole('option', { name: /Add new bookmark/ })).toContainText('B')
  await command.fill('UX paging')
  await expect(page.getByRole('option', { name: 'UX paging 19', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'More results', exact: true }).click()
  await expect(page.getByRole('option', { name: 'UX paging 24', exact: true })).toBeVisible()
  assert.ok(requests.some((request) => request.params.cursor && request.params.search === 'UX paging'))
  await command.fill('ginkgo needle')
  await expect(page.getByRole('option', { name: 'A distant reading note', exact: true })).toBeVisible()
  const globalRequests = requests.filter((request) => ['UX paging', 'ginkgo needle'].includes(request.params.search))
  assert.ok(globalRequests.every((request) => !request.params.folderId && !request.params.type && !request.params.isArchived && !request.params.tag))
  await page.keyboard.press('Enter')
  await page.waitForURL('**/cabinet/notes/outside-note')
  await home(); await page.keyboard.press('Control+k')
  failSearch = true
  await page.getByRole('combobox', { name: 'Search commands and bookmarks' }).fill('retry this search')
  await expect(page.getByRole('button', { name: 'Retry search' })).toBeVisible({ timeout: 15000 })
  failSearch = false; await page.getByRole('button', { name: 'Retry search' }).click()
  await expect(page.getByText('No matching results.', { exact: true })).toBeVisible()
  await page.keyboard.press('Escape')

  await page.getByRole('button', { name: 'Add bookmark', exact: true }).click()
  await page.getByRole('textbox', { name: 'URL', exact: true }).fill(`${rows[0].url}#part`)
  await expect(page.getByText('Already in your Cabinet', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Cancel', exact: true }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  const paste = (text) => page.evaluate((text) => { document.activeElement?.blur(); const data = new DataTransfer(); data.setData('text/plain', text); return document.dispatchEvent(new ClipboardEvent('paste', { clipboardData: data, bubbles: true, cancelable: true })) }, text)
  const initialPosts = writes.filter((request) => request.method === 'POST').length
  await paste(rows[0].url)
  await expect(page.getByText('This link is already in your Cabinet', { exact: true })).toBeVisible()
  assert.equal(writes.filter((request) => request.method === 'POST').length, initialPosts)
  await page.getByRole('button', { name: 'Edit', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Edit bookmark', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Cancel', exact: true }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  assert.equal(await paste('https://example.org/new-reference#chapter'), false)
  await expect(page.getByText('Saved: Pasted reference', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Edit', exact: true }).last().click()
  await page.getByRole('textbox', { name: 'Title (Optional)', exact: true }).fill('Edited pasted reference')
  await page.getByRole('combobox', { name: 'Folder', exact: true }).click()
  await page.getByRole('option', { name: 'None (Root)', exact: true }).click()
  await page.getByRole('button', { name: 'Save bookmark', exact: true }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  assert.equal(rows.find((item) => item.id === 'pasted-reference').folderId, null)

  await page.setViewportSize({ width: 390, height: 960 })
  await page.getByRole('button', { name: 'Add to Cabinet', exact: true }).click()
  await page.getByRole('menuitem', { name: 'Add bookmark', exact: true }).click()
  await page.getByRole('textbox', { name: 'URL', exact: true }).fill(rows[0].url)
  await expect(page.getByText('Already in your Cabinet', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Close bookmark form', exact: true }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await openFirst()
  await page.getByRole('button', { name: 'Show saved reference', exact: true }).click()
  await expect(page.getByRole('region', { name: 'Saved reference' })).toContainText('A useful saved reference')
  await expect(page.getByRole('link', { name: 'Open original link', exact: true })).toHaveAttribute('target', '_blank')
  await page.screenshot({ path: '/tmp/cabinet-productivity-mobile.png', animations: 'disabled' })
  await page.keyboard.press('Escape'); await expect(page.getByRole('dialog')).toHaveCount(0)
  await page.setViewportSize({ width: 1440, height: 960 })
  slowFrame = true
  const card = page.locator('[data-slot="card"]').filter({ has: page.locator(`a[href="${rows[0].url}"]`) })
  await card.getByRole('link', { name: /^Preview / }).evaluate((node) => node.click())
  await expect(page.getByRole('region', { name: 'Saved reference' })).toBeVisible({ timeout: 10000 })
  await expect(page.getByText(/taking longer than expected/)).toBeVisible()
  await page.screenshot({ path: '/tmp/cabinet-productivity-desktop.png', animations: 'disabled' })
  slowFrame = false; releaseFrame?.()
  await page.getByRole('button', { name: 'Reload website', exact: true }).click()
  await expect(page.getByRole('region', { name: 'Saved reference' })).toHaveCount(0)
  await page.keyboard.press('Escape')
  assert.deepEqual(errors, [])
  console.log('PASS productivity: serial inspector autosave/navigation/clears/offline retry/recovery; global search across folders, Archive, private note content and result pages; search retry; duplicate warnings desktop/mobile; clipboard dedupe/Edit/root move; blocked/slow preview summary and reload')
} finally { releaseFrame?.(); await browser.close() }
