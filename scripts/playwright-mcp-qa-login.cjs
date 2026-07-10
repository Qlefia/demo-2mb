/**
 * Playwright MCP: `browser_run_code_unsafe` with `filename` pointing here (CommonJS + dotenv).
 */
const path = require('path')
const fs = require('fs')
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') })

module.exports = async function playwrightMcpQaLogin(page) {
  const email = process.env.BOOTSTRAP_FOUNDER_EMAIL
  const password = process.env.BOOTSTRAP_FOUNDER_PASSWORD
  if (!email || !password) {
    throw new Error('BOOTSTRAP_FOUNDER_EMAIL / BOOTSTRAP_FOUNDER_PASSWORD missing in .env.local')
  }
  const base = 'http://127.0.0.1:3000'
  const outDir = path.join(__dirname, '..', '.playwright-mcp')
  await fs.promises.mkdir(outDir, { recursive: true })

  await page.goto(`${base}/login`, { waitUntil: 'domcontentloaded' })
  await page.locator('#email').fill(email)
  await page.locator('#password').fill(password)
  await page.locator('form button[type="submit"]').click()
  await page.waitForURL((u) => !u.pathname.includes('/login'), { timeout: 45000 })

  await page.goto(`${base}/prospects`, { waitUntil: 'networkidle' })
  const prospectsPng = path.join(outDir, 'qa-prospects-list.png')
  await page.screenshot({ path: prospectsPng, fullPage: true })

  const firstRow = page.locator('tbody tr').first()
  await firstRow.waitFor({ state: 'visible', timeout: 15000 })
  await firstRow.click()

  await page.getByRole('link', { name: /Open full prospect view/i }).click()
  await page.waitForURL(/\/prospects\/[0-9a-f-]{36}/i, { timeout: 15000 })

  const detailPng = path.join(outDir, 'qa-prospect-detail.png')
  await page.screenshot({ path: detailPng, fullPage: true })

  const enrichBtn = page.getByRole('button', { name: /Run enrichment/i })
  const hasEnrich = (await enrichBtn.count()) > 0

  await page.goto(`${base}/`, { waitUntil: 'networkidle' })
  const dashboardPng = path.join(outDir, 'qa-dashboard.png')
  await page.screenshot({ path: dashboardPng, fullPage: true })

  return {
    prospectsPng,
    detailPng,
    dashboardPng,
    enrichButtonVisible: hasEnrich,
  }
}
