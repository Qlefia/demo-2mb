/**
 * Compute OpenAI embeddings for rows in `comparable_cases` missing `case_embeddings`.
 */
import { config as loadEnv } from 'dotenv'
import { drizzle } from 'drizzle-orm/postgres-js'
import { sql } from 'drizzle-orm'
import postgres from 'postgres'
import { z } from 'zod'
import { embedText } from '@/lib/ai/embeddings'

loadEnv({ path: '.env.local' })
loadEnv()

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  OPENAI_API_KEY: z.string().min(1),
})

function vectorSqlLiteral(vec: number[]): string {
  if (vec.length !== 1536) throw new Error('bad_dim')
  const inner = vec.map((n) => Number(n.toFixed(8))).join(',')
  return `'[${inner}]'::vector(1536)`
}

async function main() {
  const env = envSchema.parse(process.env)
  const client = postgres(env.DATABASE_URL, { prepare: false, max: 1 })
  const db = drizzle(client, { casing: 'snake_case' })

  const pending = await db.execute(sql`
    select cc.id::text as id, cc.name::text as name, cc.summary::text as summary
    from comparable_cases cc
    where not exists (select 1 from case_embeddings ce where ce.case_id = cc.id)
    order by cc.slug
  `)
  const rows = pending as unknown as Array<{ id: string; name: string; summary: string }>

  console.log(`backfill: ${rows.length} cases without embeddings`)

  for (const row of rows) {
    const text = `${row.name}\n${row.summary}`.slice(0, 8000)
    const vec = await embedText(text)
    const lit = vectorSqlLiteral(vec)
    await db.execute(sql.raw(`
      insert into case_embeddings (case_id, embedding, model)
      values ('${row.id}'::uuid, ${lit}, 'text-embedding-3-large')
      on conflict (case_id) do update set
        embedding = excluded.embedding,
        model = excluded.model,
        updated_at = now()
    `))
    await new Promise((r) => setTimeout(r, 150))
  }

  await client.end({ timeout: 5 })
  console.log('embed:comparable-cases ok')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
