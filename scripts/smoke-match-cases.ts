/**
 * Phase 6 smoke: semantic match for "Berlin residential 65 units modern facade"
 * — expects the seeded Berlin slug in rank 1 with similarity ≥ 0.65 when embeddings exist.
 */
import { config as loadEnv } from 'dotenv'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { z } from 'zod'
import { embedText } from '@/lib/ai/embeddings'
import { matchComparableCases } from '@/lib/dossiers/match-cases'
import type { Database } from '@/lib/db/client'

loadEnv({ path: '.env.local' })
loadEnv()

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  OPENAI_API_KEY: z.string().min(1),
})

const QUERY =
  '65 unit residential modern facade Berlin Germany developer mid-rise residential units'

async function main() {
  envSchema.parse(process.env)
  const client = postgres(process.env.DATABASE_URL!, { prepare: false, max: 1 })
  const db = drizzle(client, { casing: 'snake_case' })

  const vec = await embedText(QUERY)
  const top = await matchComparableCases(db as unknown as Database, vec, { minSimilarity: 0 })

  await client.end({ timeout: 5 })

  const first = top[0]
  if (!first) {
    console.error('SMOKE: FAIL — no matches (seed + embed comparable cases first)')
    process.exit(1)
  }

  const okSlug = first.slug === 'de-berlin-residential-65-modern-facade'
  const okSim = first.similarity >= 0.65
  if (okSlug && okSim) {
    console.log(`SMOKE: PASS top=${first.slug} sim=${first.similarity.toFixed(3)}`)
    process.exit(0)
  }

  console.error(
    `SMOKE: FAIL top=${first.slug} sim=${first.similarity.toFixed(3)} (expected Berlin slug + sim>=0.65)`,
  )
  process.exit(1)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
