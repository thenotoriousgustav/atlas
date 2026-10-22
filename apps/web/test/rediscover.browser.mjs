// Read-only API fixtures; exercises Rediscover and highlight cards without an account.
// Run: node test/rediscover.browser.mjs [screenshot-dir]
import { chromium, expect } from '@playwright/test'
import { bookmarks, folder, cabinetResponse } from './fixtures/cabinet-data.mjs'

const origin = process.env.WEB_URL || 'http://localhost:3000'
const shots = process.argv[2]
const highlight = {
  ...bookmarks[0], id: 'highlight', type: 'NOTE', url: 'https://example.com/jazz', title: 'On improvising', imageUrl: null, description: null,
  notes: 'If you hit the wrong note, it is the next note that you play that determines if it is good or bad.\nOn improvising',
  noteDocument: { type: 'doc', content: [
    { type: 'blockquote', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'If you hit the wrong note, it is the next note that you play that determines if it is good or bad.' }] }] },
    { type: 'paragraph', content: [{ type: 'text', text: 'On improvising', marks: [{ type: 'link', attrs: { href: 'https://example.com/jazz' } }] }] },
  ] },
  isFavorite: false, tags: [],
}
bookmarks.unshift(highlight)
const old = (item, days) => ({ ...item, createdAt: new Date(Date.now() - days * 86_400_000).toISOString(), canEdit: true, access: 'owner' })
const batches = [
  [old(highlight, 400), old(bookmarks[2], 95), old(bookmarks[4], 40)],
  [old(bookmarks[6], 200)],
]

const browser = await chromium.launch({ headless: true })
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 960 } })
  await context.addCookies([{ name: 'cabinet.session_token', value: 'browser-test', url: origin }])
  await context.addInitScript(() => { if (window === window.top) localStorage.setItem('cabinet_display_preferences', JSON.stringify({ density: 'visual' })) })
  const writes = []
  let rediscovered = 0
  await context.route('**/v1/**', (route) => {
    const request = route.request()
    const url = new URL(request.url())
    if (request.method() !== 'GET') writes.push(`${request.method()} ${url.pathname} ${request.postData() ?? ''}`.trim())
    if (url.pathname.endsWith('/proxy-image')) return route.fulfill({ contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500"><rect width="100%" height="100%" fill="#8a9a6b"/></svg>' })
    const body = url.pathname.endsWith('/rediscover')
      ? { success: true, data: batches[Math.min(rediscovered++, batches.length - 1)] }
      : cabinetResponse(url.href)
    return route.fulfill({ contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Credentials': 'true' }, body: JSON.stringify(body) })
  })
  const page = await context.newPage()
  await page.goto(`${origin}/cabinet?folder=${folder.id}`)

  // A highlight reads as a quote credited to its site, and can open its page.
  const quoteCard = page.locator('[data-slot="card"]').filter({ has: page.locator('figure blockquote') })
  await expect(quoteCard.locator('blockquote')).toHaveText(/next note that you play/)
  await expect(quoteCard).toContainText('example.com')
  await quoteCard.click({ button: 'right', position: { x: 60, y: 60 } })
  await expect(page.getByRole('menuitem', { name: 'Open source page' })).toHaveAttribute('href', 'https://example.com/jazz')
  await page.keyboard.press('Escape')
  if (shots) await page.waitForTimeout(400)
  if (shots) await page.screenshot({ path: `${shots}/highlight-card.png`, clip: { x: 260, y: 200, width: 1180, height: 520 } })

  // Rediscover from the sidebar: one old save at a time.
  await page.getByRole('button', { name: 'Rediscover' }).click()
  const dialog = page.getByRole('dialog', { name: 'Rediscover' })
  await expect(dialog.getByText('1 of 3')).toBeVisible()
  await expect(dialog.locator('figure blockquote')).toHaveText(/next note that you play/)
  await expect(dialog.locator('p.text-lg')).toHaveText('On improvising')
  await expect(dialog.getByText(/example\.com · Saved (last year|1 year ago)/)).toBeVisible()
  if (shots) await page.waitForTimeout(400)
  if (shots) await page.screenshot({ path: `${shots}/rediscover-quote.png` })

  await page.keyboard.press('ArrowRight')
  await expect(dialog.getByText('2 of 3')).toBeVisible()
  await expect(dialog.locator('p.text-lg', { hasText: bookmarks[2].title })).toBeVisible()
  await expect(dialog.getByText(/Saved 3 months ago/)).toBeVisible()
  if (shots) await page.screenshot({ path: `${shots}/rediscover-link.png` })

  // Favorite toggles in place; Archive and Trash use the library actions and drop the item from the batch.
  await page.keyboard.press('f')
  await expect(dialog.getByRole('button', { name: 'Favorited' })).toHaveAttribute('aria-pressed', 'true')
  await dialog.getByRole('button', { name: 'Archive' }).click()
  await expect(page.getByText('Moved to Archive')).toBeVisible()
  await expect(dialog.getByText('2 of 2')).toBeVisible()
  await expect(dialog.locator('p.text-lg', { hasText: bookmarks[4].title })).toBeVisible()
  await dialog.getByRole('button', { name: 'Trash' }).click()
  await expect(dialog.getByText("That's this batch.")).toBeVisible()
  await expect.poll(() => writes).toEqual([
    `PATCH /v1/bookmarks/${bookmarks[2].id} {"isFavorite":true}`,
    `PATCH /v1/bookmarks/${bookmarks[2].id} {"isArchived":true}`,
    `DELETE /v1/bookmarks/${bookmarks[4].id}`,
  ])

  // Going back still works, and a new shuffle asks the server again.
  await dialog.getByRole('button', { name: 'Shuffle again' }).click()
  await expect(dialog.getByText('1 of 1')).toBeVisible()
  await expect(dialog.locator('p.text-lg', { hasText: bookmarks[6].title })).toBeVisible()
  expect(rediscovered).toBe(2)

  // Open hands the item to the library's preview and closes Rediscover.
  await dialog.getByRole('button', { name: 'Open' }).click()
  await expect(page.getByRole('dialog', { name: 'Rediscover' })).toHaveCount(0)
  await expect(page.getByRole('dialog')).toContainText(new URL(bookmarks[6].url).hostname)

  // Each visit starts fresh, also from the command menu.
  await page.keyboard.press('Escape')
  await page.keyboard.press('Meta+k')
  await page.getByRole('option', { name: 'Rediscover old saves' }).click()
  await expect(page.getByRole('dialog', { name: 'Rediscover' }).getByText('1 of 1')).toBeVisible()
  expect(rediscovered).toBe(3)
  await context.close()
  console.log('PASS: highlight quote cards with source link; Rediscover from sidebar and command menu, keep/back, favorite, archive and trash with library undo, end of batch, shuffle, open')
} finally {
  await browser.close()
}
