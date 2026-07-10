/**
 * End-to-end-ish check: POST /api/inbound with X-Webhook-Secret, then verify
 * prospect row via privileged DATABASE_URL read.
 *
 * Requires: dev server on SMOKE_BASE_URL (default http://127.0.0.1:3000),
 * DATABASE_URL, INBOUND_WEBHOOK_SECRET (min 8 chars) in `.env.local` or env.
 */
import { config as loadEnv } from 'dotenv'
import { z } from 'zod'
import postgres from 'postgres'

loadEnv({ path: '.env.local' })
loadEnv()

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  INBOUND_WEBHOOK_SECRET: z.string().min(8),
  SMOKE_BASE_URL: z.string().url().optional(),
})

async function main() {
  const parsed = envSchema.safeParse(process.env)
  if (!parsed.success) {
    console.error('smoke-ops-today: invalid env', parsed.error.flatten().fieldErrors)
    process.exit(1)
  }

  const { DATABASE_URL, INBOUND_WEBHOOK_SECRET } = parsed.data
  const base = parsed.data.SMOKE_BASE_URL ?? 'http://127.0.0.1:3000'
  const suffix = String(Date.now())

  const body = {
    integration: 'inbound_form' as const,
    companyName: `Smoke Inbound Co ${suffix}`,
    source: 'inbound_form' as const,
    triggerText: `smoke-ops-today ${suffix}`,
    territory: 'EU_other' as const,
  }

  const url = `${base.replace(/\/$/, '')}/api/inbound`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Webhook-Secret': INBOUND_WEBHOOK_SECRET,
    },
    body: JSON.stringify(body),
  })

  const text = await res.text()
  if (!res.ok) {
    console.error(`smoke-ops-today: inbound ${res.status}`, text)
    process.exit(1)
  }

  let json: { prospectId?: string }
  try {
    json = JSON.parse(text) as { prospectId?: string }
  } catch {
    console.error('smoke-ops-today: invalid JSON', text)
    process.exit(1)
  }

  if (!json.prospectId) {
    console.error('smoke-ops-today: missing prospectId', text)
    process.exit(1)
  }

  const client = postgres(DATABASE_URL, { max: 1 })
  try {
    const rows = await client<{ stage: string; source: string }[]>`
      select stage::text, source::text from prospects where id = ${json.prospectId}::uuid
    `
    const row = rows[0]
    if (!row || row.stage !== 'new' || row.source !== 'inbound_form') {
      console.error('smoke-ops-today: unexpected row', row)
      process.exit(1)
    }
    console.log('smoke-ops-today: PASS', json.prospectId)
  } finally {
    await client.end({ timeout: 2 })
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
