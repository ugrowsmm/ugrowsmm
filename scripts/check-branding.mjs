import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'

const BASE = 'http://localhost:3000'
mkdirSync('artifacts', { recursive: true })

const browser = await chromium.launch()
const errors = []
const results = []

function report(name, ok, extra = '') {
  results.push(`${ok ? 'PASS' : 'FAIL'}  ${name}${extra ? ` — ${extra}` : ''}`)
  if (!ok) process.exitCode = 1
}

async function attach(page) {
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(`console: ${m.text()}`)
  })
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`))
}

const desktop = await browser.newContext({ viewport: { width: 1440, height: 950 } })
const page = await desktop.newPage()
await attach(page)

await page.goto(`${BASE}/#/`, { waitUntil: 'networkidle' })
await page.waitForTimeout(900)
const homeText = await page.locator('body').innerText()
report('home wordmark visible', (await page.getByText('UGrowSMM').first().isVisible()) === true)
report('home title branded', (await page.title()) === 'UGrowSMM — Premium SMM Panel')
report('home hero heading', await page.getByRole('heading', { level: 1 }).first().isVisible())
report('home nav + footer brand', (homeText.match(/UGrowSMM/g) || []).length >= 3)
report('home install action', await page.getByRole('button', { name: /install/i }).first().isVisible())
report('home no horizontal overflow', await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1))
await page.screenshot({ path: 'artifacts/50-home-desktop.png' })
await page.screenshot({ path: 'artifacts/59-home-full.png', fullPage: true })

await page.getByRole('button', { name: /how it works/i }).click()
await page.waitForTimeout(900)
report('home in-page scroll works', (await page.evaluate(() => window.scrollY)) > 200)
await page.evaluate(() => window.scrollTo(0, 0))
await page.waitForTimeout(400)

await page.goto(`${BASE}/#/login`, { waitUntil: 'networkidle' })
await page.waitForTimeout(500)
const loginText = await page.locator('body').innerText()
report('login wordmark visible', await page.locator('.auth-visual .brand-name').isVisible())
report('login title branded', (await page.title()) === 'Sign in — UGrowSMM')
report('login homepage link', await page.getByRole('link', { name: /homepage/i }).isVisible())
report('login install action', await page.getByRole('button', { name: /install/i }).first().isVisible())
await page.screenshot({ path: 'artifacts/51-login-branded.png' })

await page.getByRole('link', { name: /homepage/i }).click()
await page.waitForTimeout(700)
report(
  'login homepage link works',
  (await page.getByRole('heading', { level: 1 }).first().isVisible()) &&
    (await page.title()) === 'UGrowSMM — Premium SMM Panel',
)

await page.goto(`${BASE}/#/terms`, { waitUntil: 'networkidle' })
await page.waitForTimeout(500)
report('terms wordmark visible', await page.getByText('UGrowSMM').first().isVisible())
report('terms title branded', (await page.title()).startsWith('Terms of Service — UGrowSMM'))
await page.screenshot({ path: 'artifacts/52-terms-branded.png' })

await page.goto(`${BASE}/#/login`, { waitUntil: 'networkidle' })
await page.getByRole('button', { name: /explore demo instantly/i }).click()
await page.waitForTimeout(1200)
for (const [route, title] of [
  ['/', 'Overview — UGrowSMM'],
  ['/new-order', 'New order — UGrowSMM'],
  ['/orders', 'Order history — UGrowSMM'],
  ['/services', 'Services — UGrowSMM'],
  ['/add-funds', 'Add funds — UGrowSMM'],
  ['/api', 'API & keys — UGrowSMM'],
  ['/settings', 'Account settings — UGrowSMM'],
]) {
  await page.goto(`${BASE}/#${route}`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(350)
  const sidebarBrand = await page.locator('.sidebar .brand-name').innerText()
  const footerBrand = await page.locator('.footer-name').innerText()
  report(
    `app ${route} branded`,
    sidebarBrand.replace(/\s+/g, '') === 'UGrowSMM' &&
      footerBrand.replace(/\s+/g, '') === 'UGrowSMM' &&
      (await page.title()) === title,
    `${sidebarBrand} / ${footerBrand} / ${await page.title()}`,
  )
}
await page.goto(`${BASE}/#/`, { waitUntil: 'networkidle' })
await page.waitForTimeout(500)
await page.screenshot({ path: 'artifacts/53-dashboard-branded.png' })
report(
  'app footer website link',
  (await page.locator('.footer-links').innerText()).includes('Website'),
)
await page.goto(`${BASE}/#/home`, { waitUntil: 'networkidle' })
await page.waitForTimeout(700)
report(
  'signed-in homepage reachable',
  (await page.title()) === 'UGrowSMM — Premium SMM Panel' &&
    (await page.getByRole('link', { name: /open panel/i }).isVisible()),
)
await page.screenshot({ path: 'artifacts/62-home-signed-in.png' })

const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })
const m = await mobile.newPage()
await attach(m)
await m.goto(`${BASE}/#/`, { waitUntil: 'networkidle' })
await m.waitForTimeout(900)
report('mobile home wordmark', await m.getByText('UGrowSMM').first().isVisible())
report('mobile home no overflow', await m.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1))
await m.screenshot({ path: 'artifacts/54-home-mobile.png' })
await m.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
await m.waitForTimeout(900)
await m.screenshot({ path: 'artifacts/55-home-mobile-footer.png' })

await m.goto(`${BASE}/#/login`, { waitUntil: 'networkidle' })
await m.waitForTimeout(500)
report('mobile login wordmark', await m.locator('.auth-mobile-brand .brand-name').isVisible())
report('mobile login no overflow', await m.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1))
await m.screenshot({ path: 'artifacts/56-login-mobile.png' })

await m.getByRole('button', { name: /explore demo instantly/i }).click()
await m.waitForTimeout(1200)
for (const route of ['/', '/orders', '/services', '/add-funds', '/api', '/settings']) {
  await m.goto(`${BASE}/#${route}`, { waitUntil: 'networkidle' })
  await m.waitForTimeout(300)
  report(
    `mobile app ${route} topbar brand`,
    (await m.locator('.topbar-brand .brand-name').isVisible()) &&
      (await m.locator('.topbar-brand .brand-name').innerText()).replace(/\s+/g, '') === 'UGrowSMM',
  )
}
await m.goto(`${BASE}/#/`, { waitUntil: 'networkidle' })
await m.waitForTimeout(500)
await m.screenshot({ path: 'artifacts/57-dashboard-mobile.png' })

await m.goto(`${BASE}/#/terms`, { waitUntil: 'networkidle' })
await m.waitForTimeout(500)
report('mobile legal wordmark', await m.locator('.legal-topbar .brand-name').isVisible())
await m.screenshot({ path: 'artifacts/58-terms-mobile.png' })

report('no console/page errors', errors.length === 0, errors.slice(0, 4).join(' | '))

console.log(results.join('\n'))
await browser.close()
