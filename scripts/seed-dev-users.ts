import { config as loadEnv } from 'dotenv'
import { z } from 'zod'
import { createClient } from '@supabase/supabase-js'

loadEnv({ path: '.env.local' })
loadEnv()

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  DEV_TEST_USERS_PASSWORD: z
    .string()
    .min(12, 'DEV_TEST_USERS_PASSWORD must be at least 12 chars'),
})

interface SeedUser {
  email: string
  displayName: string
  role: 'ops' | 'sales_de' | 'sales_uk' | 'admin'
  territory?: 'DE' | 'UK'
}

const SEED_USERS: readonly SeedUser[] = [
  {
    email: 'ops+test@2mb.dev',
    displayName: 'Ops (test)',
    role: 'ops',
  },
  {
    email: 'sales-de+test@2mb.dev',
    displayName: 'Sales DE (test)',
    role: 'sales_de',
    territory: 'DE',
  },
  // Second DE seat reserved for Phase 7.5 round-robin assignment scenarios.
  {
    email: 'sales-de2+test@2mb.dev',
    displayName: 'Sales DE 2 (test)',
    role: 'sales_de',
    territory: 'DE',
  },
  {
    email: 'sales-uk+test@2mb.dev',
    displayName: 'Sales UK (test)',
    role: 'sales_uk',
    territory: 'UK',
  },
] as const

async function main() {
  const env = envSchema.parse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    DEV_TEST_USERS_PASSWORD: process.env.DEV_TEST_USERS_PASSWORD,
  })

  const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  })

  const { data: list, error: listError } = await supabase.auth.admin.listUsers({ perPage: 200 })
  if (listError) throw listError

  for (const spec of SEED_USERS) {
    const appMetadata: Record<string, unknown> = { role: spec.role }
    if (spec.territory) appMetadata.territory = spec.territory

    const userMetadata = {
      display_name: spec.displayName,
      language: 'de' as const,
      timezone: 'Europe/Berlin',
    }

    const existing = list.users.find(
      (u) => u.email?.toLowerCase() === spec.email.toLowerCase(),
    )

    if (existing) {
      const currentMeta = (existing.user_metadata ?? {}) as Record<string, unknown>
      const mergedMeta = { ...userMetadata, ...currentMeta }
      const { error } = await supabase.auth.admin.updateUserById(existing.id, {
        password: env.DEV_TEST_USERS_PASSWORD,
        email_confirm: true,
        app_metadata: { ...(existing.app_metadata ?? {}), ...appMetadata },
        user_metadata: mergedMeta,
      })
      if (error) throw error
      console.log(`  ✓ updated ${spec.email}  role=${spec.role}  territory=${spec.territory ?? '-'}`)
      continue
    }

    const { data, error } = await supabase.auth.admin.createUser({
      email: spec.email,
      password: env.DEV_TEST_USERS_PASSWORD,
      email_confirm: true,
      app_metadata: appMetadata,
      user_metadata: userMetadata,
    })
    if (error) throw error
    console.log(`  ✓ created ${spec.email}  role=${spec.role}  territory=${spec.territory ?? '-'} (${data.user?.id})`)
  }

  console.log('done.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
