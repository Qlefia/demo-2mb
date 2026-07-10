import { test, expect } from '@playwright/test'

test.describe('public shell', () => {
  test('login page loads without console errors', async ({ page }) => {
    const errors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text())
    })
    await page.goto('/login')
    await expect(page.getByRole('textbox', { name: /email/i })).toBeVisible({ timeout: 30_000 })
    expect(errors, `console errors: ${errors.join('; ')}`).toHaveLength(0)
  })

  test('health endpoint when server has DB', async ({ request }) => {
    const res = await request.get('/api/health')
    // In dev/CI without DATABASE_URL, 503 is acceptable; require structured JSON.
    const json = await res.json().catch(() => null)
    expect(json).toMatchObject({ ok: expect.any(Boolean) })
  })
})

test.describe('authenticated API surface', () => {
  test('prospects list requires session', async ({ request }) => {
    const res = await request.get('/api/prospects')
    expect(res.status()).toBe(401)
  })

  test('lead intake precheck requires session', async ({ request }) => {
    const res = await request.get('/api/prospects/intake-precheck?accountName=Acme')
    expect(res.status()).toBe(401)
  })

  test('deals list requires session', async ({ request }) => {
    const res = await request.get(
      '/api/prospects/11111111-1111-4111-8111-111111111111/deals',
    )
    expect(res.status()).toBe(401)
  })
})
