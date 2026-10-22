// Mocked auth API; exercises sign-in method status, connect errors, disconnect and account deletion without an account.
// Run: node test/account-settings.browser.mjs [screenshot-dir]
import { chromium, expect } from '@playwright/test'
import { cabinetResponse } from './fixtures/cabinet-data.mjs'

const origin = process.env.WEB_URL || 'http://localhost:3000'
const shots = process.argv[2]
const email = 'raka@cabinet.test'
const github = { id: 'acc-github', providerId: 'github', accountId: '1', userId: 'owner', createdAt: '2025-03-04T00:00:00Z', updatedAt: '2025-03-04T00:00:00Z', scopes: [] }
const google = { ...github, id: 'acc-google', providerId: 'google', accountId: '2', createdAt: '2026-09-10T00:00:00Z' }
const hoursAgo = (hours) => new Date(Date.now() - hours * 3_600_000).toISOString()

async function open(browser, state) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } })
  await context.addCookies([{ name: 'cabinet.session_token', value: 'browser-test', url: origin }])
  await context.route('**/v1/**', async (route) => {
    const request = route.request()
    const path = new URL(request.url()).pathname
    if (request.method() !== 'GET') state.writes.push(`${path.replace('/v1/auth', '')} ${request.postData() ?? ''}`.trim())
    const json = (body, status = 200) => route.fulfill({ status, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Credentials': 'true' }, body: JSON.stringify(body) })
    if (path.endsWith('/auth/get-session')) return json(state.deleted ? null : { user: { id: 'owner', name: 'Raka Pradana', email }, session: { id: 'test', createdAt: state.signedInAt, expiresAt: '2099-01-01T00:00:00Z' } })
    if (path.endsWith('/auth/list-accounts')) return json(state.accounts)
    if (path.endsWith('/auth/link-social')) return json({ url: `${origin}/cabinet/settings?tab=account&error=email_does_not_match`, redirect: true })
    if (path.endsWith('/auth/unlink-account')) {
      if (Date.now() - new Date(state.signedInAt).getTime() >= 24 * 3_600_000) return json({ code: 'SESSION_NOT_FRESH', message: 'Sign in again to continue.' }, 403)
      state.accounts = state.accounts.filter((account) => account.id !== JSON.parse(request.postData()).accountId)
      return json({ status: true })
    }
    if (path.endsWith('/auth/sign-in/social')) {
      state.signedInAt = hoursAgo(0)
      return json({ url: JSON.parse(request.postData()).callbackURL, redirect: true })
    }
    if (path.endsWith('/auth/delete-user')) {
      if (state.serverSaysStale) return json({ code: 'SESSION_EXPIRED', message: 'Session expired. Re-authenticate to perform this action.' }, 400)
      state.deleted = true
      return json({ success: true, message: 'User deleted' })
    }
    return json(cabinetResponse(request.url()))
  })
  const page = await context.newPage()
  await page.goto(`${origin}/cabinet/settings?tab=account`)
  return { context, page }
}

const browser = await chromium.launch({ headless: true })
try {
  // Only GitHub linked: it shows as connected and cannot be disconnected; Google can be connected.
  const state = { accounts: [github], signedInAt: hoursAgo(1), writes: [] }
  let { context, page } = await open(browser, state)
  const row = (name) => page.locator('ul[aria-busy] > li').filter({ hasText: name })
  await expect(page.getByRole('region', { name: /^Notifications/ })).toHaveCount(1)
  await expect(row('GitHub')).toContainText('Connected · since Mar 2025')
  await expect(row('GitHub').getByRole('button', { name: 'Disconnect' })).toBeDisabled()
  await expect(row('Google')).toContainText('Not connected')
  await expect(page.getByText("This is your only way to sign in")).toBeVisible()
  if (shots) await page.screenshot({ path: `${shots}/account-one-method.png`, fullPage: true })

  // A failed connection comes back with ?error=… and explains itself.
  await row('Google').getByRole('button', { name: 'Connect' }).click()
  await expect(page.getByRole('alert').filter({ hasText: /uses a different email/ })).toBeVisible()
  expect(state.writes[0]).toMatch(/^\/link-social .*"provider":"google".*tab=account/)
  expect(new URL(page.url()).searchParams.get('error')).toBeNull()
  expect(new URL(page.url()).searchParams.get('tab')).toBe('account')

  // Both linked: either can be disconnected after a confirmation.
  state.accounts = [github, google]
  await page.reload()
  await expect(row('Google')).toContainText('Connected · since Sep 2026')
  if (shots) await page.screenshot({ path: `${shots}/account-two-methods.png`, fullPage: true })
  await row('Google').getByRole('button', { name: 'Disconnect' }).click()
  await page.getByRole('alertdialog').getByRole('button', { name: 'Disconnect' }).click()
  await expect(page.getByText('Google disconnected')).toBeVisible()
  await expect(row('Google')).toContainText('Not connected')
  expect(state.writes.at(-1)).toBe('/unlink-account {"accountId":"acc-google"}')

  // Deleting needs the email typed out, then signs out to the login page.
  await page.getByRole('button', { name: 'Delete account' }).click()
  const dialog = page.getByRole('dialog', { name: 'Delete your Cabinet account?' })
  const confirmDelete = dialog.getByRole('button', { name: 'Delete account' })
  await expect(confirmDelete).toBeDisabled()
  await dialog.getByLabel('Type your email to confirm').fill('someone@else.test')
  await expect(confirmDelete).toBeDisabled()
  await dialog.getByLabel('Type your email to confirm').fill(` ${email.toUpperCase()} `)
  if (shots) await page.screenshot({ path: `${shots}/account-delete.png` })
  await confirmDelete.click()
  await page.waitForURL('**/login')
  await expect(page.getByText('Your account and everything in it were deleted.')).toBeVisible()
  await expect(page.getByRole('region', { name: /^Notifications/ })).toHaveCount(1)
  expect(state.writes.at(-1)).toBe('/delete-user {}')
  await context.close()

  // Disconnect also requires a recent sign-in and must leave accounts linked until then.
  const unlink = { accounts: [github, google], signedInAt: hoursAgo(72), writes: [] }
  ;({ context, page } = await open(browser, unlink))
  await row('Google').getByRole('button', { name: 'Disconnect' }).click()
  await page.getByRole('alertdialog').getByRole('button', { name: 'Disconnect' }).click()
  await page.getByRole('alertdialog').getByRole('button', { name: 'Continue with Google' }).click()
  await expect(row('Google')).toContainText('Connected · since Sep 2026')
  expect(unlink.accounts).toHaveLength(2)
  expect(unlink.writes.at(-1)).toMatch(/^\/sign-in\/social .*"provider":"google".*tab=account/)
  await row('Google').getByRole('button', { name: 'Disconnect' }).click()
  await page.getByRole('alertdialog').getByRole('button', { name: 'Disconnect' }).click()
  await expect(row('Google')).toContainText('Not connected')
  await context.close()

  // An old sign-in asks to sign in again first, then comes back to the confirmation.
  const stale = { accounts: [github, google], signedInAt: hoursAgo(72), writes: [] }
  ;({ context, page } = await open(browser, stale))
  await page.getByRole('button', { name: 'Delete account' }).click()
  const signIn = page.getByRole('dialog', { name: 'Sign in again to continue' })
  await expect(signIn.getByRole('button', { name: 'Continue with GitHub' })).toBeVisible()
  if (shots) await page.screenshot({ path: `${shots}/account-sign-in-again.png` })
  await signIn.getByRole('button', { name: 'Continue with Google' }).click()
  await expect(page.getByRole('dialog', { name: 'Delete your Cabinet account?' })).toBeVisible()
  expect(stale.writes[0]).toMatch(/^\/sign-in\/social .*"provider":"google".*tab=account&delete=1/)
  expect(new URL(page.url()).searchParams.get('delete')).toBeNull()

  // If the server still finds the sign-in too old, the dialog switches to signing in again.
  stale.serverSaysStale = true
  await page.getByLabel('Type your email to confirm').fill(email)
  await page.getByRole('button', { name: 'Delete account' }).last().click()
  await expect(page.getByRole('dialog', { name: 'Sign in again to continue' })).toBeVisible()
  await context.close()
  console.log('PASS: sign-in methods show connected state, connect errors, guarded disconnect; delete account confirms by email, signs out, and asks for a recent sign-in')
} finally {
  await browser.close()
}
