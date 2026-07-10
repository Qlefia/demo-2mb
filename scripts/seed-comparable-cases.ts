/**
 * Idempotent seed for `comparable_cases` (49 rows) — Phase 6 / BACKLOG #10.
 * Run after migration `20260507120000_comparable_cases_pgvector.sql`.
 */
import { config as loadEnv } from 'dotenv'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { comparableCases } from '@/lib/db/schema'

loadEnv({ path: '.env.local' })
loadEnv()

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
})

type SeedRow = {
  slug: string
  name: string
  scaleUnits: number | null
  projectType: string | null
  facadeStyle: string | null
  region: string | null
  year: number | null
  summary: string
  pdfUrl: string | null
}

function buildRows(): SeedRow[] {
  const rows: SeedRow[] = [
    {
      slug: 'de-berlin-residential-65-modern-facade',
      name: 'Berlin residential 65 units — modern facade',
      scaleUnits: 65,
      projectType: 'residential',
      facadeStyle: 'modern',
      region: 'DE Berlin',
      year: 2022,
      summary:
        '65 unit residential development with modern facade in Berlin, mid-rise, energy-efficient envelope, target owner-occupiers and investors.',
      pdfUrl: null,
    },
  ]
  const regions = [
    'UK London',
    'DE Munich',
    'FR Paris',
    'NL Amsterdam',
    'AT Vienna',
    'CH Zurich',
    'DE Hamburg',
  ] as const
  for (let i = 1; i < 49; i++) {
    const r = regions[i % regions.length]!
    const city = r.split(' ')[1] ?? 'EU'
    rows.push({
      slug: `ref-case-${String(i).padStart(3, '0')}`,
      name: `Reference project ${i} — ${city}`,
      scaleUnits: 20 + (i % 80),
      projectType: i % 2 === 0 ? 'residential' : 'mixed_use',
      facadeStyle: i % 3 === 0 ? 'modern' : 'classic',
      region: r,
      year: 2015 + (i % 10),
      summary: `${20 + (i % 80)} units ${i % 2 === 0 ? 'residential' : 'mixed-use'} project in ${r}, facade ${i % 3 === 0 ? 'modern aluminum and glass' : 'brick and stone'}, comparable scale for developer-led sales.`,
      pdfUrl: null,
    })
  }
  return rows
}

async function main() {
  const env = envSchema.parse(process.env)
  const client = postgres(env.DATABASE_URL, { prepare: false, max: 1 })
  const db = drizzle(client, { casing: 'snake_case' })

  const rows = buildRows()
  let upserted = 0
  for (const r of rows) {
    const existing = await db
      .select({ id: comparableCases.id })
      .from(comparableCases)
      .where(eq(comparableCases.slug, r.slug))
      .limit(1)

    if (existing[0]) {
      await db
        .update(comparableCases)
        .set({
          name: r.name,
          scaleUnits: r.scaleUnits,
          projectType: r.projectType,
          facadeStyle: r.facadeStyle,
          region: r.region,
          year: r.year,
          summary: r.summary,
          pdfUrl: r.pdfUrl,
        })
        .where(eq(comparableCases.slug, r.slug))
    } else {
      await db.insert(comparableCases).values({
        slug: r.slug,
        name: r.name,
        scaleUnits: r.scaleUnits,
        projectType: r.projectType,
        facadeStyle: r.facadeStyle,
        region: r.region,
        year: r.year,
        summary: r.summary,
        pdfUrl: r.pdfUrl,
      })
    }
    upserted++
  }

  await client.end({ timeout: 5 })
  console.log(`seed:comparable-cases ok (${upserted} rows upserted)`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
