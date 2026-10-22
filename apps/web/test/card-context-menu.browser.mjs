// Read-only API fixtures; exercises the card right-click menu without an account.
import { chromium, expect } from '@playwright/test'
import { folder, cabinetResponse } from './fixtures/cabinet-data.mjs'

const origin = process.env.WEB_URL || 'http://localhost:3000'
const fulfill = (route, writes) => {
  const url = new URL(route.request().url())
  if (route.request().method() !== 'GET') writes?.push(`${route.request().method()} ${url.pathname}`)
  return route.fulfill({ contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Credentials': 'true' }, body: JSON.stringify(cabinetResponse(url.href)) })
}
const browser = await chromium.launch({ headless: true })
try {
  for (const density of ['comfortable', 'compact', 'visual']) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 960 } })
    await context.addCookies([{ name: 'cabinet.session_token', value: 'browser-test', url: origin }])
    await context.addInitScript((value) => { if (window === window.top) localStorage.setItem('cabinet_display_preferences', JSON.stringify({ density: value })) }, density)
    const writes = []
    await context.route('**/v1/**', (route) => fulfill(route, writes))
    const page = await context.newPage()
    await page.goto(`${origin}/cabinet?folder=${folder.id}`)
    const card = page.locator('[data-slot="card"]').first()
    await card.click({ button: 'right', position: { x: 120, y: 120 } })
    const menu = page.getByRole('menu')
    await expect(menu.getByRole('menuitem')).toHaveText(['Open preview', 'Open original', 'Copy link', 'Pin to top', 'Remove from favorites', 'Select', 'Edit details', 'Duplicate', 'Archive', 'Move to Trash'])
    await menu.getByRole('menuitem', { name: 'Remove from favorites' }).click()
    await expect(menu).toHaveCount(0)
    await expect.poll(() => writes).toContain('PATCH /v1/bookmarks/sample-0')
    // A menu click must not also open the card behind it.
    await expect(page.getByRole('dialog')).toHaveCount(0)
    await card.click({ button: 'right', position: { x: 120, y: 120 } })
    await page.keyboard.press('Escape')
    await expect(page.getByRole('menu')).toHaveCount(0)
    // ⋯ keeps the shorter list; pin and favorite have their own buttons there.
    await card.hover()
    await card.getByTitle('More actions').click()
    await expect(page.getByRole('menu').getByRole('menuitem')).toHaveText(['Open original', 'Copy link', 'Edit details', 'Duplicate', 'Archive', 'Move to Trash'])
    await context.close()
  }
  // On touch, long-press belongs to drag and ⋯ opens the action sheet.
  const touch = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true })
  await touch.addCookies([{ name: 'cabinet.session_token', value: 'browser-test', url: origin }])
  await touch.route('**/v1/**', (route) => fulfill(route))
  const page = await touch.newPage()
  await page.goto(`${origin}/cabinet?folder=${folder.id}`)
  const box = await page.locator('[data-slot="card"]').first().boundingBox()
  const cdp = await touch.newCDPSession(page)
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: box.x + 60, y: box.y + 60 }] })
  await page.waitForTimeout(1000)
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  await expect(page.getByRole('menu')).toHaveCount(0)
  await touch.close()
  console.log('PASS: right-click menu in every card style runs actions without opening the card; ⋯ keeps its short list; touch long-press opens no menu')
} finally {
  await browser.close()
}
