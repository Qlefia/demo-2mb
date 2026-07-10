/**
 * Phase 9 smoke: proposals RLS + optional HTTP checks for public `/p/[token]`.
 *
 * Uses JWT-as-authenticated against Postgres (same pattern as smoke-rls-prospects).
 */
import { config as loadEnv } from 'dotenv'
import { drizzle } from 'drizzle-orm/postgres-js'
import { eq, sql } from 'drizzle-orm'
import postgres from 'postgres'
import { z } from 'zod'
import { proposals } from '@/lib/db/schema'

loadEnv({ path: '.env.local' })
loadEnv()

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  DATABASE_URL: z.string().url(),
  BOOTSTRAP_FOUNDER_EMAIL: z.string().email(),
  BOOTSTRAP_FOUNDER_PASSWORD: z.string().min(1),
  DEV_TEST_USERS_PASSWORD: z.string().min(1),
})

interface SignInResult {
  access_token: string
  user: { id: string; email: string }
}

async function signIn(supabaseUrl: string, anonKey: string, email: string, password: string) {
  const res = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: anonKey,
    },
    body: JSON.stringify({ email, password }),
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`sign-in failed for ${email}: ${res.status} ${text}`)
  }
  return (await res.json()) as SignInResult
}

function decodeJwtPayload(token: string): Record<string, unknown> {
  const [, payload] = token.split('.')
  const base64 = payload.replace(/-/g, '+').replace(/_/g, '/')
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4)
  return JSON.parse(Buffer.from(padded, 'base64').toString('utf-8')) as Record<string, unknown>
}

interface ProspectRow {
  id: string
  territory: string
  owner_id: string | null
}

async function main() {
  const env = envSchema.parse(process.env)

  const client = postgres(env.DATABASE_URL, {
    prepare: false,
    max: 1,
    idle_timeout: 5,
    connect_timeout: 10,
  })
  const db = drizzle(client, { casing: 'snake_case' })

  async function countProposals(accessToken: string, prospectId: string): Promise<number> {
    const claims = decodeJwtPayload(accessToken)
    return db.transaction(async (tx) => {
      await tx.execute(sql`set local role authenticated`)
      await tx.execute(sql`select set_config('request.jwt.claims', ${JSON.stringify(claims)}, true)`)
      const rows = await tx.select({ id: proposals.id }).from(proposals).where(eq(proposals.prospectId, prospectId))
      return rows.length
    })
  }

  async function maybeHttpSmoke() {
    const baseUrl = process.env.SMOKE_BASE_URL
    if (baseUrl) {
      const invalid = await fetch(`${baseUrl.replace(/\/$/, '')}/p/not-a-real-token`, {
        redirect: 'manual',
      })
      const html = await invalid.text()
      const okHint =
        html.includes('noindex') ||
        html.includes('nofollow') ||
        html.includes('robots') ||
        invalid.status === 404
      if (!okHint) {
        console.warn('  WARN: public /p/* missing obvious noindex or not 404 — check metadata.')
      } else {
        console.log(`  HTTP ${invalid.status} on invalid token (smoke hint OK)`)
      }
    } else {
      console.log('  (Set SMOKE_BASE_URL to smoke public HTML / noindex via HTTP.)')
    }
  }

  const founder = await signIn(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    env.BOOTSTRAP_FOUNDER_EMAIL,
    env.BOOTSTRAP_FOUNDER_PASSWORD,
  )
  const salesDe = await signIn(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    'sales-de+test@2mb.dev',
    env.DEV_TEST_USERS_PASSWORD,
  )
  const salesUk = await signIn(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    'sales-uk+test@2mb.dev',
    env.DEV_TEST_USERS_PASSWORD,
  )

  const founderClaims = decodeJwtPayload(founder.access_token)
  const prospectRows = await db.transaction(async (tx) => {
    await tx.execute(sql`set local role authenticated`)
    await tx.execute(sql`select set_config('request.jwt.claims', ${JSON.stringify(founderClaims)}, true)`)
    const r = await tx.execute(sql`
      select id::text, territory::text, owner_id::text as owner_id from prospects
    `)
    return r as unknown as ProspectRow[]
  })

  const ownedDeTarget = prospectRows.find(
    (p) => p.territory === 'DE' && p.owner_id === salesDe.user.id,
  )
  const anyDe = prospectRows.find((p) => p.territory === 'DE')

  if (!anyDe) {
    console.error('SMOKE: FAIL — no DE prospects in database.')
    await client.end()
    process.exit(1)
  }

  const ukPeekOnAnyDe = await countProposals(salesUk.access_token, anyDe.id)
  if (ukPeekOnAnyDe !== 0) {
    console.error(
      'SMOKE: FAIL — sales_uk should not see proposals on foreign DE prospects.',
    )
    await client.end()
    process.exit(1)
  }

  if (!ownedDeTarget) {
    console.log('SMOKE proposals RLS: PASS (partial)')
    console.log('  sales_uk sees 0 proposals on sampled DE prospect — OK')
    console.log(
      '  SKIP insert/delete: assign a DE prospect owner to sales-de+test@2mb.dev for full coverage.',
    )
    await maybeHttpSmoke()
    await client.end()
    process.exit(0)
  }

  const beforeDe = await countProposals(salesDe.access_token, ownedDeTarget.id)
  const ukPeek = await countProposals(salesUk.access_token, ownedDeTarget.id)

  if (ukPeek !== 0) {
    console.error('SMOKE: FAIL — sales_uk should not see proposals on foreign prospect before insert.')
    await client.end()
    process.exit(1)
  }

  let createdId: string | null = null
  await db.transaction(async (tx) => {
    const claims = decodeJwtPayload(salesDe.access_token)
    await tx.execute(sql`set local role authenticated`)
    await tx.execute(sql`select set_config('request.jwt.claims', ${JSON.stringify(claims)}, true)`)
    const [row] = await tx
      .insert(proposals)
      .values({
        prospectId: ownedDeTarget.id,
        title: 'SMOKE_TEMP_PROPOSAL',
        blocks: [],
        language: 'en',
        version: 1,
        status: 'draft',
        createdBy: salesDe.user.id,
      })
      .returning({ id: proposals.id })
    createdId = row?.id ?? null
  })

  if (!createdId) {
    console.error('SMOKE: FAIL — sales_de could not insert proposal.')
    await client.end()
    process.exit(1)
  }

  const afterDe = await countProposals(salesDe.access_token, ownedDeTarget.id)
  const afterUk = await countProposals(salesUk.access_token, ownedDeTarget.id)

  if (afterDe !== beforeDe + 1) {
    console.error('SMOKE: FAIL — sales_de visible proposal count mismatch.')
    await db.transaction(async (tx) => {
      await tx.execute(sql`set local role authenticated`)
      await tx.execute(sql`select set_config('request.jwt.claims', ${JSON.stringify(founderClaims)}, true)`)
      await tx.delete(proposals).where(eq(proposals.id, createdId!))
    })
    await client.end()
    process.exit(1)
  }

  if (afterUk !== 0) {
    console.error('SMOKE: FAIL — sales_uk must not see proposals for DE prospect they do not own.')
    await db.transaction(async (tx) => {
      await tx.execute(sql`set local role authenticated`)
      await tx.execute(sql`select set_config('request.jwt.claims', ${JSON.stringify(founderClaims)}, true)`)
      await tx.delete(proposals).where(eq(proposals.id, createdId!))
    })
    await client.end()
    process.exit(1)
  }

  await db.transaction(async (tx) => {
    const claims = decodeJwtPayload(founder.access_token)
    await tx.execute(sql`set local role authenticated`)
    await tx.execute(sql`select set_config('request.jwt.claims', ${JSON.stringify(claims)}, true)`)
    await tx.delete(proposals).where(eq(proposals.id, createdId!))
  })

  console.log('SMOKE proposals RLS: PASS')
  console.log(`  sales_de insert/read on owned DE prospect OK (cleaned id=${createdId})`)
  console.log(`  sales_uk sees ${afterUk} proposals for that prospect (expected 0)`)

  await maybeHttpSmoke()
  await client.end()
}

main().catch(async (err) => {
  console.error(err)
  process.exit(1)
})
