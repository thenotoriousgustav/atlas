// Read-only API fixtures; exercises the real preview component without an account.
import { chromium, expect } from '@playwright/test'
import { bookmarks, folder, cabinetResponse } from './fixtures/cabinet-data.mjs'

const origin = process.env.WEB_URL || 'http://localhost:3000'
const browser = await chromium.launch({ headless: true })
try {
  for (const mode of ['ready', 'blank', 'silent', 'crash']) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 960 } })
    await context.addCookies([{ name: 'cabinet.session_token', value: 'browser-test', url: origin }])
    await context.addInitScript(() => { if (window === window.top) localStorage.setItem('cabinet_view_mode', 'moodboard') })
    await context.route('**/v1/**', async (route) => {
      const url = new URL(route.request().url())
      if (url.pathname.endsWith('/proxy-page')) {
        const message = mode === 'ready' ? 'cabinet-preview-ready' : 'cabinet-preview-error'
        // crash: the page renders, is confirmed, then breaks while its scripts run (e.g. Next.js hydration).
        const script = mode === 'silent' ? '' : mode === 'crash'
          ? `<script>setTimeout(() => parent.postMessage({type: 'cabinet-preview-ready'}, '*'), 100); setTimeout(() => parent.postMessage({type: 'cabinet-preview-error'}, '*'), 300)</script>`
          : `<script>setTimeout(() => parent.postMessage({type: '${message}'}, '*'), 100)</script>`
        return route.fulfill({ contentType: 'text/html', body: `${mode === 'ready' || mode === 'crash' ? '<h1>Working website preview</h1>' : ''}${script}` })
      }
      const body = url.pathname.endsWith('/embeddable') ? { success: true, data: { embeddable: false } } : cabinetResponse(url.href)
      return route.fulfill({ contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Credentials': 'true' }, body: JSON.stringify(body) })
    })
    const page = await context.newPage()
    await page.clock.install()
    await page.goto(`${origin}/cabinet?folder=${folder.id}`)
    const card = page.locator('[data-slot="card"]').filter({ has: page.locator(`a[href="${bookmarks[0].url}"]`) })
    await card.getByRole('link', { name: /^Preview / }).click()
    const dialog = page.getByRole('dialog')
    if (mode === 'ready') {
      await expect(page.frameLocator('iframe').getByRole('heading', { name: 'Working website preview' })).toBeVisible()
      await expect(dialog.getByText('Loading website…', { exact: true })).toHaveCount(0)
      // Let the postMessage and React state commit before advancing the deadline.
      await page.waitForTimeout(500)
      await page.clock.fastForward(17000)
      await expect(dialog.locator('iframe')).toBeVisible()
      await expect(dialog.getByRole('region', { name: 'Saved details' })).toHaveCount(0)
    } else {
      if (mode === 'silent') {
        // An iframe load alone must not reveal the proxied page or cancel the content timeout.
        await expect(dialog.getByText('Loading website…', { exact: true })).toBeVisible()
        await expect(dialog.locator('iframe')).toBeHidden()
        await page.clock.fastForward(17000)
      }
      const details = dialog.getByRole('region', { name: 'Saved details' })
      await expect(details).toBeVisible()
      await expect(details.getByRole('link', { name: 'Open original' })).toHaveAttribute('href', bookmarks[0].url)
      await expect(dialog.locator('iframe')).toHaveCount(0)
    }
    await context.close()
  }
  console.log('PASS: rendered preview stays visible without spinner; blank/error, silent and crashed proxied frames fall back to saved details and Open original')
} finally {
  await browser.close()
}
