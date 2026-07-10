/**
 * Smoke: POST /api/prospects/:id/enrich — internal secret + auth edge cases.
 * Does not run full provider fan-out (avoids cost); uses a non-existent UUID → 422.
 *
 * Requires: dev server on CRM_BASE_URL, ENRICH_INTERNAL_SECRET in `.env.local`.
 */
import { config as loadEnv } from 'dotenv'
import { z } from 'zod'

loadEnv({ path: '.env.local' })
loadEnv()

const envSchema = z.object({
  ENRICH_INTERNAL_SECRET: z.string().min(16),
  CRM_BASE_URL: z.string().url().default('http://127.0.0.1:3000'),
})

const FAKE_UUID = '00000000-0000-4000-8000-000000000001'

async function main() {
  const parsed = envSchema.safeParse(process.env)
  if (!parsed.success) {
    console.error('smoke-enrich-api: invalid env', parsed.error.flatten().fieldErrors)
    process.exit(1)
  }
  const { ENRICH_INTERNAL_SECRET, CRM_BASE_URL } = parsed.data
  const base = CRM_BASE_URL.replace(/\/$/, '')

  // No session + no secret: middleware redirects anonymous users away from /api (302 → login HTML).
  const r1 = await fetch(`${base}/api/prospects/${FAKE_UUID}/enrich`, {
    method: 'POST',
    redirect: 'manual',
  })
  if (r1.status !== 302 && r1.status !== 307) {
    console.error(`smoke-enrich-api: unauthenticated (no secret) must redirect 302, got ${r1.status}`)
    process.exit(1)
  }

  // Wrong secret header reaches the route (middleware allows POST + header); handler returns 401.
  const r2 = await fetch(`${base}/api/prospects/${FAKE_UUID}/enrich`, {
    method: 'POST',
    headers: { 'X-Enrichment-Secret': 'definitely-wrong' },
  })
  if (r2.status !== 401) {
    console.error(`smoke-enrich-api: wrong secret (no session) must be 401, got ${r2.status}`)
    process.exit(1)
  }

  const r3 = await fetch(`${base}/api/prospects/${FAKE_UUID}/enrich`, {
    method: 'POST',
    headers: { 'X-Enrichment-Secret': ENRICH_INTERNAL_SECRET },
  })
  if (r3.status !== 422) {
    const body = await r3.text()
    console.error(`smoke-enrich-api: internal+missing prospect must be 422, got ${r3.status}`, body)
    process.exit(1)
  }
  const j3 = (await r3.json()) as { error?: string }
  if (j3.error !== 'prospect_not_found') {
    console.error('smoke-enrich-api: expected error prospect_not_found, got', j3)
    process.exit(1)
  }

  console.log('SMOKE: PASS (enrich API wiring)')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
