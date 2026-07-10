/**
 * Authenticated Impeccable URL scan (Playwright + impeccable browser detector).
 *
 * Usage (dev server must be running on :3000):
 *   IMPECCABLE_AUTH_EMAIL=you@example.com IMPECCABLE_AUTH_PASSWORD=secret npm run design:impeccable:auth
 *
 * Optional:
 *   IMPECCABLE_BASE_URL=http://127.0.0.1:3000
 *   IMPECCABLE_HEADED=1  — show browser window
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from '@playwright/test'
import { config as loadDotenv } from 'dotenv'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')

loadDotenv({ path: path.join(ROOT, '.env.local'), quiet: true })

const BASE_URL = (process.env.IMPECCABLE_BASE_URL ?? 'http://127.0.0.1:3000').replace(/\/$/, '')
const EMAIL = process.env.IMPECCABLE_AUTH_EMAIL?.trim()
const PASSWORD = process.env.IMPECCABLE_AUTH_PASSWORD
const HEADED = process.env.IMPECCABLE_HEADED === '1'

const STATIC_ROUTES = [
  '/',
  '/prospects',
  '/offers',
  '/settings',
  '/settings/studio',
  '/settings/team',
  '/settings/notifications',
  '/profile',
]

const BROWSER_SCRIPT_PATH = path.join(
  ROOT,
  'node_modules',
  'impeccable',
  'cli',
  'engine',
  'detect-antipatterns-browser.js',
)

const DESCRIPTIONS = {
  'side-tab': 'Thick colored border on one side of a card — use a subtler accent or remove it.',
  'border-accent-on-rounded': 'Thick accent border on a rounded card — remove border or border-radius.',
  'overused-font': 'Inter and similar faces are overused in AI UIs — intentional for this product unless you change DESIGN.md.',
  'single-font': 'Only one font family on the page — pair display + body if you want more hierarchy.',
  'pure-black-white': 'Pure #000 backgrounds look harsh — use tinted scrim tokens.',
  'gradient-text': 'Gradient text is a common AI tell.',
  'low-contrast': 'Text contrast below WCAG AA (4.5:1).',
  'layout-transition': 'Animating layout properties causes jank — prefer transform/opacity.',
  'bounce-easing': 'Bounce/elastic easing feels dated.',
}

function loadBrowserScript() {
  if (!fs.existsSync(BROWSER_SCRIPT_PATH)) {
    throw new Error(`Impeccable browser script not found at ${BROWSER_SCRIPT_PATH}. Run: npm install`)
  }
  return fs.readFileSync(BROWSER_SCRIPT_PATH, 'utf-8')
}

async function scanPage(page, url, browserScript) {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60_000 })
  await page.waitForLoadState('networkidle', { timeout: 30_000 }).catch(() => {})
  await page.waitForTimeout(400)
  await page.evaluate(browserScript)
  return page.evaluate(() => {
    if (typeof window.impeccableScan !== 'function') return []
    return window.impeccableScan().flatMap(({ findings }) =>
      findings.map((f) => ({ id: f.type, snippet: f.detail })),
    )
  })
}

async function discoverProspectRoute(page) {
  await page.goto(`${BASE_URL}/prospects`, { waitUntil: 'domcontentloaded', timeout: 60_000 })
  await page.waitForLoadState('networkidle', { timeout: 30_000 }).catch(() => {})
  const href = await page
    .locator('a[href^="/prospects/"]:not([href="/prospects"])')
    .first()
    .getAttribute('href')
    .catch(() => null)
  if (!href || href === '/prospects') return null
  return href.split('?')[0]
}

async function signIn(page) {
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded', timeout: 60_000 })
  await page.locator('#email').fill(EMAIL)
  await page.locator('#password').fill(PASSWORD)
  await Promise.all([
    page.waitForURL((u) => !u.pathname.startsWith('/login'), { timeout: 120_000 }),
    page.locator('form button[type="submit"]').click(),
  ])
  const finalUrl = page.url()
  if (finalUrl.includes('/login')) {
    const err = await page.locator('[class*="destructive"]').first().textContent().catch(() => '')
    throw new Error(`Login failed — still on login page.${err ? ` UI: ${err.trim()}` : ''}`)
  }
  return finalUrl
}

async function main() {
  if (!EMAIL || !PASSWORD) {
    console.error(
      'Set IMPECCABLE_AUTH_EMAIL and IMPECCABLE_AUTH_PASSWORD (do not commit passwords).\n' +
        'Example: IMPECCABLE_AUTH_EMAIL=you@example.com IMPECCABLE_AUTH_PASSWORD=*** npm run design:impeccable:auth',
    )
    process.exit(1)
  }

  const browserScript = loadBrowserScript()
  const browser = await chromium.launch({ headless: !HEADED })
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } })
  const page = await context.newPage()

  console.error(`Signing in at ${BASE_URL}/login as ${EMAIL}…`)
  const landing = await signIn(page)
  console.error(`Signed in → ${landing}\n`)

  const routes = [...STATIC_ROUTES]
  const prospectPath = await discoverProspectRoute(page)
  if (prospectPath) {
    routes.push(prospectPath)
    console.error(`Discovered prospect detail: ${prospectPath}`)
  }

  const allFindings = []
  for (const route of routes) {
    const url = `${BASE_URL}${route}`
    process.stderr.write(`Scanning ${url}…\n`)
    try {
      const findings = await scanPage(page, url, browserScript)
      for (const f of findings) {
        allFindings.push({ ...f, url })
      }
    } catch (e) {
      process.stderr.write(`  Warning: ${route} — ${e.message}\n`)
    }
  }

  await browser.close()

  if (allFindings.length === 0) {
    console.log('\nNo anti-patterns found across authenticated routes.')
    process.exit(0)
  }

  const byUrl = new Map()
  for (const f of allFindings) {
    if (!byUrl.has(f.url)) byUrl.set(f.url, [])
    byUrl.get(f.url).push(f)
  }

  let total = 0
  for (const [url, items] of byUrl) {
    console.log(`\n${url}`)
    const seen = new Set()
    for (const { id, snippet } of items) {
      const key = `${id}|${snippet}`
      if (seen.has(key)) continue
      seen.add(key)
      total++
      console.log(`  [${id}] ${snippet}`)
      if (DESCRIPTIONS[id]) console.log(`    → ${DESCRIPTIONS[id]}`)
    }
  }

  console.log(`\n${total} anti-pattern(s) across ${byUrl.size} page(s).`)
  process.exit(2)
}

main().catch((e) => {
  console.error(e.message || e)
  process.exit(1)
})
