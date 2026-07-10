import { config as loadEnv } from 'dotenv'
import { z } from 'zod'
import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'
import { sql } from 'drizzle-orm'

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

interface UserSpec {
  label: string
  email: string
  password: string
  expectMin?: number
  expectExactly?: number
}

interface SignInResult {
  access_token: string
  refresh_token: string
  user: { id: string; email: string }
}

async function signIn(
  supabaseUrl: string,
  anonKey: string,
  spec: UserSpec,
): Promise<SignInResult> {
  const res = await fetch(
    `${supabaseUrl}/auth/v1/token?grant_type=password`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: anonKey,
      },
      body: JSON.stringify({ email: spec.email, password: spec.password }),
    },
  )
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`sign-in failed for ${spec.email}: ${res.status} ${text}`)
  }
  return (await res.json()) as SignInResult
}

function decodeJwtPayload(token: string): Record<string, unknown> {
  const [, payload] = token.split('.')
  const base64 = payload.replace(/-/g, '+').replace(/_/g, '/')
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4)
  return JSON.parse(Buffer.from(padded, 'base64').toString('utf-8')) as Record<string, unknown>
}

interface ProspectVisibility {
  id: string
  territory: string
  stage: string
  ownerId: string | null
}

async function listProspectsAsUser(
  db: ReturnType<typeof drizzle>,
  accessToken: string,
): Promise<ProspectVisibility[]> {
  const claims = decodeJwtPayload(accessToken)
  return db.transaction(async (tx) => {
    await tx.execute(sql`set local role authenticated`)
    await tx.execute(
      sql`select set_config('request.jwt.claims', ${JSON.stringify(claims)}, true)`,
    )
    const result = await tx.execute(sql`
      select id::text, territory::text, stage::text, owner_id::text as owner_id from prospects
    `)
    const rows = result as unknown as {
      id: string
      territory: string
      stage: string
      owner_id: string | null
    }[]
    return rows.map((r) => ({
      id: r.id,
      territory: r.territory,
      stage: r.stage,
      ownerId: r.owner_id,
    }))
  })
}

async function tryUpdateForeignProspect(
  db: ReturnType<typeof drizzle>,
  accessToken: string,
  prospectId: string,
): Promise<{ allowed: boolean; rowsAffected: number; error?: string }> {
  const claims = decodeJwtPayload(accessToken)
  try {
    return await db.transaction(async (tx) => {
      await tx.execute(sql`set local role authenticated`)
      await tx.execute(
        sql`select set_config('request.jwt.claims', ${JSON.stringify(claims)}, true)`,
      )
      const r = await tx.execute(
        sql`update prospects set priority = priority where id = ${prospectId}::uuid returning id`,
      )
      const rows = (r as unknown as { id: string }[]) ?? []
      return { allowed: true, rowsAffected: rows.length }
    })
  } catch (err) {
    return {
      allowed: false,
      rowsAffected: 0,
      error: err instanceof Error ? err.message : String(err),
    }
  }
}

async function main() {
  const env = envSchema.parse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    DATABASE_URL: process.env.DATABASE_URL,
    BOOTSTRAP_FOUNDER_EMAIL: process.env.BOOTSTRAP_FOUNDER_EMAIL,
    BOOTSTRAP_FOUNDER_PASSWORD: process.env.BOOTSTRAP_FOUNDER_PASSWORD,
    DEV_TEST_USERS_PASSWORD: process.env.DEV_TEST_USERS_PASSWORD,
  })

  const users: readonly UserSpec[] = [
    {
      label: 'founder',
      email: env.BOOTSTRAP_FOUNDER_EMAIL,
      password: env.BOOTSTRAP_FOUNDER_PASSWORD,
    },
    {
      label: 'ops',
      email: 'ops+test@2mb.dev',
      password: env.DEV_TEST_USERS_PASSWORD,
    },
    {
      label: 'sales_de',
      email: 'sales-de+test@2mb.dev',
      password: env.DEV_TEST_USERS_PASSWORD,
    },
    {
      label: 'sales_uk',
      email: 'sales-uk+test@2mb.dev',
      password: env.DEV_TEST_USERS_PASSWORD,
    },
  ] as const

  const client = postgres(env.DATABASE_URL, {
    prepare: false,
    max: 1,
    idle_timeout: 5,
    connect_timeout: 10,
  })
  const db = drizzle(client, { casing: 'snake_case' })

  console.log('signing in...')
  const sessions: Record<string, SignInResult> = {}
  for (const u of users) {
    sessions[u.label] = await signIn(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, u)
    console.log(`  ✓ ${u.label}  (${u.email})`)
  }

  console.log('\nrls visibility matrix:')
  const visibility: Record<string, ProspectVisibility[]> = {}
  for (const u of users) {
    visibility[u.label] = await listProspectsAsUser(db, sessions[u.label].access_token)
  }

  const founderTotal = visibility.founder.length
  const opsTotal = visibility.ops.length
  const salesDeTotal = visibility.sales_de.length
  const salesUkTotal = visibility.sales_uk.length

  const expectedForSales = (uid: string, territory: string) =>
    visibility.founder.filter((p) => p.territory === territory && p.ownerId === uid)

  const expectedSalesDeRows = expectedForSales(sessions.sales_de.user.id, 'DE')
  const expectedSalesUkRows = expectedForSales(sessions.sales_uk.user.id, 'UK')

  const idSet = (rows: ProspectVisibility[]) => new Set(rows.map((p) => p.id))
  const salesDeExpectedIds = idSet(expectedSalesDeRows)
  const salesUkExpectedIds = idSet(expectedSalesUkRows)
  const salesDeActualIds = idSet(visibility.sales_de)
  const salesUkActualIds = idSet(visibility.sales_uk)

  const lines: string[] = []
  lines.push(`  founder      sees  ${founderTotal} (expected: all)`)
  lines.push(`  ops          sees  ${opsTotal} (expected: ${founderTotal})`)
  lines.push(
    `  sales_de     sees  ${salesDeTotal} (expected: exactly ${salesDeExpectedIds.size} owned DE)`,
  )
  lines.push(
    `  sales_uk     sees  ${salesUkTotal} (expected: exactly ${salesUkExpectedIds.size} owned UK)`,
  )

  let pass = true
  if (opsTotal !== founderTotal) {
    pass = false
    lines.push('  FAIL: ops should see same set as founder.')
  }

  const sameSet = (a: Set<string>, b: Set<string>) =>
    a.size === b.size && [...a].every((id) => b.has(id))

  if (!sameSet(salesDeActualIds, salesDeExpectedIds)) {
    pass = false
    lines.push('  FAIL: sales_de prospect set must equal founder-visible DE rows owned by sales_de.')
  }
  if (!sameSet(salesUkActualIds, salesUkExpectedIds)) {
    pass = false
    lines.push('  FAIL: sales_uk prospect set must equal founder-visible UK rows owned by sales_uk.')
  }

  console.log(lines.join('\n'))

  console.log('\ncross-territory write test:')
  const ukProspect = visibility.founder.find((p) => p.territory === 'UK')
  if (ukProspect) {
    const result = await tryUpdateForeignProspect(
      db,
      sessions.sales_de.access_token,
      ukProspect.id,
    )
    if (result.allowed && result.rowsAffected === 0) {
      console.log(`  ✓ sales_de cannot UPDATE UK prospect ${ukProspect.id} (0 rows affected, RLS denied silently).`)
    } else if (!result.allowed) {
      console.log(`  ✓ sales_de denied UPDATE on UK prospect ${ukProspect.id} (error: ${result.error}).`)
    } else {
      pass = false
      console.log(
        `  FAIL: sales_de updated UK prospect ${ukProspect.id} (rowsAffected=${result.rowsAffected}).`,
      )
    }
  } else {
    console.log('  skipped (no UK prospect to test).')
  }

  await client.end()

  if (!pass) {
    console.log('\nSMOKE: FAIL')
    process.exit(1)
  }
  console.log('\nSMOKE: PASS')
}

main().catch(async (err) => {
  console.error(err)
  process.exit(1)
})
