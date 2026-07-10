import { config as loadEnv } from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'

loadEnv({ path: '.env.local' })
loadEnv()

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  BOOTSTRAP_FOUNDER_EMAIL: z.string().email(),
  BOOTSTRAP_FOUNDER_PASSWORD: z
    .string()
    .min(12, 'BOOTSTRAP_FOUNDER_PASSWORD must be at least 12 chars'),
})

async function main() {
  const env = envSchema.parse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    BOOTSTRAP_FOUNDER_EMAIL: process.env.BOOTSTRAP_FOUNDER_EMAIL,
    BOOTSTRAP_FOUNDER_PASSWORD: process.env.BOOTSTRAP_FOUNDER_PASSWORD,
  })

  const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  })

  const appMetadata = { role: 'founder' as const }
  const defaultUserMetadata = {
    display_name: 'Founder',
    language: 'de' as const,
    timezone: 'Europe/Berlin',
  }

  const { data: list, error: listError } = await supabase.auth.admin.listUsers({ perPage: 200 })
  if (listError) throw listError

  const existing = list.users.find(
    (u) => u.email?.toLowerCase() === env.BOOTSTRAP_FOUNDER_EMAIL.toLowerCase(),
  )

  if (existing) {
    // Only fill in metadata defaults that are missing — never overwrite values
    // the user has already customised via PATCH /api/me.
    const currentMeta = (existing.user_metadata ?? {}) as Record<string, unknown>
    const mergedMeta = { ...defaultUserMetadata, ...currentMeta }
    const { error } = await supabase.auth.admin.updateUserById(existing.id, {
      password: env.BOOTSTRAP_FOUNDER_PASSWORD,
      email_confirm: true,
      app_metadata: { ...(existing.app_metadata ?? {}), ...appMetadata },
      user_metadata: mergedMeta,
    })
    if (error) throw error
    console.log(`founder updated: ${existing.email} (${existing.id})`)
    return
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email: env.BOOTSTRAP_FOUNDER_EMAIL,
    password: env.BOOTSTRAP_FOUNDER_PASSWORD,
    email_confirm: true,
    app_metadata: appMetadata,
    user_metadata: defaultUserMetadata,
  })
  if (error) throw error
  if (!data.user) throw new Error('createUser returned no user')

  console.log(`founder created: ${data.user.email} (${data.user.id})`)
  console.log('REMINDER: clear BOOTSTRAP_FOUNDER_* from your .env after first run.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
