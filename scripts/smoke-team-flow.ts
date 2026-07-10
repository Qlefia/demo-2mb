import { config as loadEnv } from 'dotenv'
import { z } from 'zod'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { createCookieJar, jarFetch, type CookieJar } from './lib/cookieJar'

loadEnv({ path: '.env.local' })
loadEnv()

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  BOOTSTRAP_FOUNDER_EMAIL: z.string().email(),
  CRM_BASE_URL: z.string().url().default('http://localhost:3000'),
})

const SMOKE_INVITEE_EMAIL = 'smoke-invitee+test@2mb.dev'
const SMOKE_DISPLAY_NAME = 'Smoke Invitee'

async function deleteUserByEmail(service: SupabaseClient, email: string): Promise<boolean> {
  const { data, error } = await service.auth.admin.listUsers({ perPage: 200 })
  if (error) throw error
  const target = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase())
  if (!target) return false
  const { error: delErr } = await service.auth.admin.deleteUser(target.id)
  if (delErr) throw delErr
  return true
}

async function plantSessionViaCallback(
  service: SupabaseClient,
  jar: CookieJar,
  baseUrl: string,
  email: string,
  type: 'magiclink' | 'invite',
  nextPath: string,
): Promise<void> {
  // Service-role generateLink returns a hashed_token we can verify through
  // /auth/callback. The callback handler sets the SSR cookies, exactly as the
  // browser would after clicking the email link.
  const { data, error } = await service.auth.admin.generateLink({
    type,
    email,
    options: { redirectTo: `${baseUrl}/auth/callback?next=${encodeURIComponent(nextPath)}` },
  })
  if (error || !data.properties?.hashed_token) {
    throw new Error(`generateLink(${type}) for ${email} failed: ${error?.message ?? 'no hashed_token'}`)
  }
  const hashed = data.properties.hashed_token
  const callbackUrl = `${baseUrl}/auth/callback?token_hash=${encodeURIComponent(hashed)}&type=${type}&next=${encodeURIComponent(nextPath)}`
  const res = await jarFetch(jar, callbackUrl)
  if (!res.ok && res.status !== 200) {
    throw new Error(`callback for ${email} returned ${res.status}`)
  }
}

async function main() {
  const env = envSchema.parse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    BOOTSTRAP_FOUNDER_EMAIL: process.env.BOOTSTRAP_FOUNDER_EMAIL,
    CRM_BASE_URL: process.env.CRM_BASE_URL ?? 'http://localhost:3000',
  })

  // Pre-flight: confirm dev server is reachable.
  try {
    const ping = await fetch(`${env.CRM_BASE_URL}/api/health`)
    if (!ping.ok) throw new Error(`status ${ping.status}`)
  } catch (err) {
    console.error(
      `[smoke-team-flow] dev server unreachable at ${env.CRM_BASE_URL}/api/health — start it with \`npm run dev\` first.`,
      err instanceof Error ? err.message : err,
    )
    process.exit(1)
  }

  const service = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  })

  console.log('1. Cleanup any leftover smoke invitee from previous runs')
  const cleaned = await deleteUserByEmail(service, SMOKE_INVITEE_EMAIL)
  if (cleaned) console.log('   removed previous smoke seat')

  console.log('2. Plant founder session via magiclink callback')
  const founderJar = createCookieJar()
  await plantSessionViaCallback(
    service,
    founderJar,
    env.CRM_BASE_URL,
    env.BOOTSTRAP_FOUNDER_EMAIL,
    'magiclink',
    '/',
  )

  console.log('3. Founder POST /api/team/seats invite')
  const inviteRes = await jarFetch(founderJar, `${env.CRM_BASE_URL}/api/team/seats`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: SMOKE_INVITEE_EMAIL,
      displayName: SMOKE_DISPLAY_NAME,
      role: 'sales_de',
      territory: 'DE',
    }),
  })
  if (inviteRes.status !== 201) {
    throw new Error(`invite failed: ${inviteRes.status} ${(await inviteRes.text()).slice(0, 200)}`)
  }
  const invitePayload = (await inviteRes.json()) as { seat: { id: string; email: string; status: string; role: string; territory: string | null } }
  console.log(`   invited seat id=${invitePayload.seat.id} status=${invitePayload.seat.status} role=${invitePayload.seat.role} territory=${invitePayload.seat.territory}`)
  if (invitePayload.seat.status !== 'invited') throw new Error(`expected status=invited, got ${invitePayload.seat.status}`)

  console.log('4. Plant invitee session via invite callback (= clicking email link)')
  const inviteeJar = createCookieJar()
  await plantSessionViaCallback(
    service,
    inviteeJar,
    env.CRM_BASE_URL,
    SMOKE_INVITEE_EMAIL,
    'invite',
    '/auth/accept-invite',
  )

  console.log('5. Invitee PATCH /api/me { displayName: "Smoke Confirmed" }')
  // Stand-in for the AcceptInviteForm which calls supabase.auth.updateUser
  // with both password and display_name. /api/me PATCH covers the metadata
  // half; setting a real password from a Node smoke is more involved and not
  // needed to assert the flow.
  const meRes = await jarFetch(inviteeJar, `${env.CRM_BASE_URL}/api/me`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ displayName: 'Smoke Confirmed' }),
  })
  if (!meRes.ok) {
    throw new Error(`PATCH /api/me failed: ${meRes.status} ${(await meRes.text()).slice(0, 200)}`)
  }
  const mePayload = (await meRes.json()) as { user: { displayName: string }; role: string | null; territory: string | null }
  if (mePayload.user.displayName !== 'Smoke Confirmed') {
    throw new Error(`PATCH /api/me unexpected displayName: ${mePayload.user.displayName}`)
  }
  if (mePayload.role !== 'sales_de' || mePayload.territory !== 'DE') {
    throw new Error(`invitee role/territory wrong: ${mePayload.role}/${mePayload.territory}`)
  }
  console.log(`   /api/me role=${mePayload.role} territory=${mePayload.territory} displayName=${mePayload.user.displayName}`)

  console.log('6. Founder GET /api/team/seats — invitee should now be active')
  const seatsRes = await jarFetch(founderJar, `${env.CRM_BASE_URL}/api/team/seats`)
  if (!seatsRes.ok) {
    throw new Error(`GET /api/team/seats failed: ${seatsRes.status} ${(await seatsRes.text()).slice(0, 200)}`)
  }
  const seatsPayload = (await seatsRes.json()) as { seats: Array<{ id: string; email: string; status: string; displayName: string }> }
  const seat = seatsPayload.seats.find((s) => s.email === SMOKE_INVITEE_EMAIL)
  if (!seat) throw new Error('smoke seat missing from /api/team/seats')
  if (seat.status !== 'active') throw new Error(`smoke seat status=${seat.status}, expected active`)
  console.log(`   seat status=${seat.status} displayName=${seat.displayName}`)

  console.log('7. GET /register — public registration page (200, no redirect to /login)')
  const regRes = await fetch(`${env.CRM_BASE_URL}/register`, { redirect: 'manual' })
  if (regRes.status !== 200) {
    throw new Error(`expected /register to return 200, got ${regRes.status}`)
  }
  console.log(`   /register → ${regRes.status}`)

  console.log('8. Cleanup: delete smoke seat via service role')
  await deleteUserByEmail(service, SMOKE_INVITEE_EMAIL)

  console.log('\nSMOKE: PASS')
}

main().catch(async (err) => {
  console.error('\nSMOKE: FAIL')
  console.error(err)
  process.exit(1)
})
