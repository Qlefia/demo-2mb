import { config as loadEnv } from 'dotenv'
import { z } from 'zod'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'
import { sql } from 'drizzle-orm'
import { createCookieJar, jarFetch, type CookieJar } from './lib/cookieJar'

loadEnv({ path: '.env.local' })
loadEnv()

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  DATABASE_URL: z.string().url(),
  BOOTSTRAP_FOUNDER_EMAIL: z.string().email(),
  DEV_TEST_USERS_PASSWORD: z.string().min(1),
  CRM_BASE_URL: z.string().url().default('http://localhost:3000'),
})

interface ProspectRow {
  id: string
  account_id: string
  territory: string
  stage: string
  owner_id: string | null
}

async function pickOpsTestProspect(
  db: ReturnType<typeof drizzle>,
): Promise<ProspectRow> {
  const result = await db.execute(sql`
    select id::text, account_id::text, territory::text, stage::text, owner_id::text
    from prospects
    where territory = 'DE'
    order by created_at asc
    limit 1
  `)
  const rows = result as unknown as ProspectRow[]
  if (!rows[0]) {
    throw new Error('no DE prospect found — run npm run seed:dev-prospects first')
  }
  return rows[0]
}

async function plantSession(
  service: SupabaseClient,
  jar: CookieJar,
  baseUrl: string,
  email: string,
): Promise<void> {
  const { data, error } = await service.auth.admin.generateLink({
    type: 'magiclink',
    email,
    options: { redirectTo: `${baseUrl}/auth/callback?next=/` },
  })
  if (error || !data.properties?.hashed_token) {
    throw new Error(`generateLink for ${email} failed: ${error?.message ?? 'no hashed_token'}`)
  }
  const callbackUrl = `${baseUrl}/auth/callback?token_hash=${encodeURIComponent(data.properties.hashed_token)}&type=magiclink&next=/`
  const res = await jarFetch(jar, callbackUrl)
  if (!res.ok && res.status !== 200) {
    throw new Error(`callback for ${email} returned ${res.status}`)
  }
}

async function userIdByEmail(service: SupabaseClient, email: string): Promise<string> {
  const { data, error } = await service.auth.admin.listUsers({ perPage: 200 })
  if (error) throw error
  const u = data.users.find((u) => u.email === email)
  if (!u) throw new Error(`no user with email ${email}`)
  return u.id
}

const FILLED_SECTIONS = {
  snapshot: {
    legalForm: 'GmbH',
    hqCity: 'Berlin',
    hqCountry: 'Germany',
    employees: 250,
    foundedYear: 2014,
    publicPrivate: 'private' as const,
    notes: 'Smoke fixture',
  },
  what_they_do: {
    summary: 'Build interactive product configurators for premium German real-estate developers.',
    segments: ['Residential', 'Mixed-use'],
    flagshipOffering: '3D unit picker for residential pre-sales',
    targetCustomer: 'Mid-market developers, 100-500 units per year',
  },
  signals: {
    items: [
      {
        text: 'Ausschreibung published for new residential project in Munich',
        sourceUrl: 'https://example.com/tender/123',
        occurredAt: new Date().toISOString().slice(0, 10),
        type: 'tender',
      },
    ],
  },
  decision_makers: { contactIds: [] },
  tech_clues: {
    siteStack: ['WordPress', 'Custom React'],
    visibleVendors: ['HubSpot'],
    notes: 'Mature web stack',
  },
  competitive: {
    currentVendors: ['In-house dev team', 'External agency for 3D'],
    inHouseTeam: 'Small product team, 3 devs',
  },
  hooks: {
    items: [
      'Open Munich tender mentions interactive 3D walkthroughs as nice-to-have.',
      'Their last case study cited slow configurator load times as user complaint.',
      'Careers page lists Three.js skills hint they value interactive UX.',
    ],
  },
  cases: {
    items: [
      { name: 'Bahnhofsplatz Hamburg', why: 'Same residential premium segment, similar unit-count.' },
      { name: 'Quartier Süd Berlin', why: 'Same city, same buyer persona, our config drove +12% pre-sales.' },
      { name: 'Lakeside Munich', why: 'Local case directly comparable, used in initial pitch.' },
    ],
  },
  risks: {
    summary: 'Existing in-house dev team may feel threatened by external configurator.',
    blockers: ['Vendor-lock with current 3D agency until Q3'],
  },
  next_step: {
    channel: 'email' as const,
    notes: 'Reference Munich tender + Quartier Süd case in opener',
  },
}

async function main() {
  const env = envSchema.parse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    DATABASE_URL: process.env.DATABASE_URL,
    BOOTSTRAP_FOUNDER_EMAIL: process.env.BOOTSTRAP_FOUNDER_EMAIL,
    DEV_TEST_USERS_PASSWORD: process.env.DEV_TEST_USERS_PASSWORD,
    CRM_BASE_URL: process.env.CRM_BASE_URL ?? 'http://localhost:3000',
  })

  // Pre-flight ping
  try {
    const ping = await fetch(`${env.CRM_BASE_URL}/api/health`)
    if (!ping.ok) throw new Error(`status ${ping.status}`)
  } catch (err) {
    console.error(
      `[smoke-dossier-flow] dev server unreachable at ${env.CRM_BASE_URL}/api/health — start it with \`npm run dev\` first.`,
      err instanceof Error ? err.message : err,
    )
    process.exit(1)
  }

  const service = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  })

  const client = postgres(env.DATABASE_URL, {
    prepare: false,
    max: 1,
    idle_timeout: 5,
    connect_timeout: 10,
  })
  const db = drizzle(client, { casing: 'snake_case' })

  console.log('1. Pick a DE prospect')
  const prospect = await pickOpsTestProspect(db)
  console.log(`   prospect=${prospect.id} territory=${prospect.territory} stage=${prospect.stage}`)

  console.log('2. Reset dossier state for clean slate (delete cascades versions + activities)')
  await db.execute(sql`delete from dossiers where prospect_id = ${prospect.id}::uuid`)
  await db.execute(sql`
    delete from tasks
    where prospect_id = ${prospect.id}::uuid
      and title like '1st touch —%'
  `)
  await db.execute(sql`
    delete from activities
    where prospect_id = ${prospect.id}::uuid
      and (
        type = 'dossier_delivered'
        or (type = 'note' and (payload ->> 'kind') in ('handoff_task_created', 'dossier_reopened'))
      )
  `)
  await db.execute(sql`
    update prospects
    set owner_id = null,
        stage = 'dossier_in_progress'
    where id = ${prospect.id}::uuid
  `)

  console.log('3. Plant ops session')
  const opsJar = createCookieJar()
  await plantSession(service, opsJar, env.CRM_BASE_URL, 'ops+test@2mb.dev')

  console.log('4. Ops PUT /dossier with all 10 sections (4 stays minimal as in 2.1)')
  const putRes = await jarFetch(opsJar, `${env.CRM_BASE_URL}/api/prospects/${prospect.id}/dossier`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sections: FILLED_SECTIONS }),
  })
  if (!putRes.ok) {
    throw new Error(`PUT failed: ${putRes.status} ${(await putRes.text()).slice(0, 300)}`)
  }
  const putPayload = (await putRes.json()) as {
    versionWritten: boolean
    versionNumber: number
    changedKeys: string[]
    dossier: { id: string; status: string; version: number }
  }
  if (!putPayload.versionWritten) throw new Error('first PUT did not write a version')
  if (putPayload.versionNumber !== 1) throw new Error(`expected version 1, got ${putPayload.versionNumber}`)
  console.log(`   dossier=${putPayload.dossier.id} version=${putPayload.versionNumber} changed=${putPayload.changedKeys.length} keys`)

  console.log('5. Idempotent re-PUT (same content) — must NOT bump version')
  const putRes2 = await jarFetch(opsJar, `${env.CRM_BASE_URL}/api/prospects/${prospect.id}/dossier`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sections: FILLED_SECTIONS }),
  })
  if (!putRes2.ok) throw new Error(`PUT(idempotent) failed: ${putRes2.status}`)
  const putPayload2 = (await putRes2.json()) as { versionWritten: boolean; versionNumber: number }
  if (putPayload2.versionWritten) throw new Error('idempotent PUT wrote a duplicate version')
  if (putPayload2.versionNumber !== 1) throw new Error(`version drifted on no-op: ${putPayload2.versionNumber}`)
  console.log('   ✓ no version bump on identical save')

  console.log('6. Mark ready WITHOUT contacts → 422 with no_contact_method failure')
  const mrRes = await jarFetch(opsJar, `${env.CRM_BASE_URL}/api/prospects/${prospect.id}/dossier/mark-ready`, {
    method: 'POST',
  })
  if (mrRes.status !== 422) {
    throw new Error(`expected 422 (section 4 missing), got ${mrRes.status}`)
  }
  const mrPayload = (await mrRes.json()) as { failures: Array<{ code: string; sectionId?: number }> }
  const has4Failure = mrPayload.failures.some((f) => f.code === 'no_contact_method' && f.sectionId === 4)
  if (!has4Failure) throw new Error('expected no_contact_method failure on section 4')
  console.log('   ✓ Mark Ready blocked on Section 4 until contact added')

  console.log('7. Add a contact via API and link via decision_makers')
  const createContactRes = await jarFetch(opsJar, `${env.CRM_BASE_URL}/api/prospects/${prospect.id}/contacts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fullName: 'Smoke Decision Maker',
      role: 'Geschäftsführer',
      email: 'smoke-dm@example.com',
    }),
  })
  if (createContactRes.status !== 201) {
    throw new Error(`POST contact failed: ${createContactRes.status} ${(await createContactRes.text()).slice(0, 200)}`)
  }
  const createPayload = (await createContactRes.json()) as { contact: { id: string } }
  const contactId = createPayload.contact.id
  console.log(`   ✓ contact created via API id=${contactId}`)

  const sectionsWithContacts = {
    ...FILLED_SECTIONS,
    decision_makers: { contactIds: [contactId] },
  }
  const putRes3 = await jarFetch(opsJar, `${env.CRM_BASE_URL}/api/prospects/${prospect.id}/dossier`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sections: sectionsWithContacts }),
  })
  if (!putRes3.ok) throw new Error(`PUT(with contact) failed: ${putRes3.status}`)
  const putPayload3 = (await putRes3.json()) as { versionNumber: number }
  if (putPayload3.versionNumber !== 2) throw new Error(`expected version 2, got ${putPayload3.versionNumber}`)
  console.log(`   ✓ version bumped to ${putPayload3.versionNumber} after contact link`)

  console.log('8. Mark ready (now should pass — contact has email) + Phase 7 handoff')
  const salesDeIds = [
    await userIdByEmail(service, 'sales-de+test@2mb.dev'),
    await userIdByEmail(service, 'sales-de2+test@2mb.dev'),
  ]
  const mrRes2 = await jarFetch(opsJar, `${env.CRM_BASE_URL}/api/prospects/${prospect.id}/dossier/mark-ready`, {
    method: 'POST',
  })
  if (!mrRes2.ok) {
    throw new Error(`mark-ready failed: ${mrRes2.status} ${(await mrRes2.text()).slice(0, 200)}`)
  }
  const mrPayload2 = (await mrRes2.json()) as {
    dossier: { status: string; version: number }
    handoff: {
      stageUpdated: boolean
      ownerAssigned: boolean
      assigneeId: string | null
      taskCreated: boolean
    } | null
  }
  if (mrPayload2.dossier.status !== 'ready') {
    throw new Error(`expected status=ready, got ${mrPayload2.dossier.status}`)
  }
  if (!mrPayload2.handoff?.taskCreated) {
    throw new Error('expected handoff.taskCreated=true after mark-ready')
  }
  if (!mrPayload2.handoff.assigneeId || !salesDeIds.includes(mrPayload2.handoff.assigneeId)) {
    throw new Error(
      `expected assignee in DE sales seats, got ${mrPayload2.handoff.assigneeId ?? 'null'}`,
    )
  }
  const assignedSalesId = mrPayload2.handoff.assigneeId
  console.log(
    `   ✓ dossier status=${mrPayload2.dossier.status} handoff stage=${mrPayload2.handoff.stageUpdated} owner=${mrPayload2.handoff.ownerAssigned} task=${mrPayload2.handoff.taskCreated}`,
  )

  const prospectAfterHandoff = (await db.execute(sql`
    select stage::text, owner_id::text
    from prospects
    where id = ${prospect.id}::uuid
  `)) as unknown as Array<{ stage: string; owner_id: string | null }>
  const rowAfter = prospectAfterHandoff[0]
  if (!rowAfter || rowAfter.stage !== 'dossier_ready') {
    throw new Error(`expected prospect stage=dossier_ready, got ${rowAfter?.stage ?? 'missing'}`)
  }
  if (rowAfter.owner_id !== assignedSalesId) {
    throw new Error(`expected owner_id=${assignedSalesId}, got ${rowAfter.owner_id ?? 'null'}`)
  }

  const taskRows = (await db.execute(sql`
    select id::text, title, assignee_id::text, due_at
    from tasks
    where prospect_id = ${prospect.id}::uuid
      and status = 'open'
      and title like '1st touch —%'
  `)) as unknown as Array<{ id: string; title: string; assignee_id: string; due_at: Date }>
  if (taskRows.length !== 1) {
    throw new Error(`expected 1 open 1st-touch task, got ${taskRows.length}`)
  }
  if (taskRows[0]!.assignee_id !== assignedSalesId) {
    throw new Error(`task assignee mismatch: ${taskRows[0]!.assignee_id}`)
  }
  const dueMs = new Date(taskRows[0]!.due_at).getTime() - Date.now()
  if (dueMs < 20 * 60 * 60 * 1000 || dueMs > 28 * 60 * 60 * 1000) {
    throw new Error(`1st-touch due_at not ~+24h (delta ${Math.round(dueMs / 3600000)}h)`)
  }
  console.log(`   ✓ 1st-touch task "${taskRows[0]!.title}" due ~+24h`)

  console.log('9. Activity dossier_delivered logged?')
  const actRes = await db.execute(sql`
    select type from activities
    where prospect_id = ${prospect.id}::uuid
      and type = 'dossier_delivered'
  `)
  const actCount = (actRes as unknown as Array<{ type: string }>).length
  if (actCount < 1) throw new Error('no dossier_delivered activity written')
  console.log(`   ✓ ${actCount} dossier_delivered activity row(s)`)

  console.log('10. Versions endpoint returns history')
  const versionsRes = await jarFetch(opsJar, `${env.CRM_BASE_URL}/api/prospects/${prospect.id}/dossier/versions`)
  if (!versionsRes.ok) throw new Error(`versions GET failed: ${versionsRes.status}`)
  const versionsPayload = (await versionsRes.json()) as { versions: Array<{ version: number }> }
  if (versionsPayload.versions.length < 2) {
    throw new Error(`expected ≥2 versions, got ${versionsPayload.versions.length}`)
  }
  console.log(`   ✓ ${versionsPayload.versions.length} versions in history`)

  console.log('11. Assigned sales seat plants session, GET dossier should return ready dossier')
  const salesJar = createCookieJar()
  const salesEmail =
    assignedSalesId === salesDeIds[0] ? 'sales-de+test@2mb.dev' : 'sales-de2+test@2mb.dev'
  await plantSession(service, salesJar, env.CRM_BASE_URL, salesEmail)
  const salesGetRes = await jarFetch(salesJar, `${env.CRM_BASE_URL}/api/prospects/${prospect.id}/dossier`)
  if (!salesGetRes.ok) {
    throw new Error(`sales GET dossier failed: ${salesGetRes.status} (RLS may need owner reassignment)`)
  }
  const salesGetPayload = (await salesGetRes.json()) as { dossier: { status: string } | null }
  if (!salesGetPayload.dossier || salesGetPayload.dossier.status !== 'ready') {
    throw new Error(`sales did not see ready dossier (got ${salesGetPayload.dossier?.status ?? 'null'})`)
  }
  console.log(`   ✓ sales_de sees dossier status=${salesGetPayload.dossier.status}`)

  console.log('13. Sales_de PUT dossier should be 403/blocked by RLS (sales has no write on dossiers)')
  const salesPutRes = await jarFetch(salesJar, `${env.CRM_BASE_URL}/api/prospects/${prospect.id}/dossier`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sections: { snapshot: { hqCity: 'Hijack' } } }),
  })
  if (salesPutRes.ok) {
    throw new Error('sales_de was able to PUT dossier — RLS bug')
  }
  console.log(`   ✓ sales_de PUT denied: ${salesPutRes.status}`)

  console.log('13a. Sales_de GET contacts should succeed (read-only)')
  const salesContactsRes = await jarFetch(salesJar, `${env.CRM_BASE_URL}/api/prospects/${prospect.id}/contacts`)
  if (!salesContactsRes.ok) {
    throw new Error(`sales GET contacts failed: ${salesContactsRes.status}`)
  }
  const salesContactsPayload = (await salesContactsRes.json()) as { items: Array<{ id: string }> }
  if (!salesContactsPayload.items.find((c) => c.id === contactId)) {
    throw new Error(`sales did not see synthetic contact ${contactId}`)
  }
  console.log(`   ✓ sales_de sees ${salesContactsPayload.items.length} contact(s)`)

  console.log('13b. Sales_de POST contact should fail')
  const salesCreateRes = await jarFetch(salesJar, `${env.CRM_BASE_URL}/api/prospects/${prospect.id}/contacts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fullName: 'Sales Hijack' }),
  })
  if (salesCreateRes.ok) throw new Error('sales_de was able to POST contact — RLS bug')
  console.log(`   ✓ sales_de POST contact denied: ${salesCreateRes.status}`)

  console.log('13c. Sales_de DELETE contact should fail')
  const salesDeleteRes = await jarFetch(salesJar, `${env.CRM_BASE_URL}/api/prospects/${prospect.id}/contacts/${contactId}`, {
    method: 'DELETE',
  })
  if (salesDeleteRes.ok) throw new Error('sales_de was able to DELETE contact — RLS bug')
  console.log(`   ✓ sales_de DELETE contact denied: ${salesDeleteRes.status}`)

  console.log('14. Founder reopens dossier (mark-in-review)')
  const founderJar = createCookieJar()
  await plantSession(service, founderJar, env.CRM_BASE_URL, env.BOOTSTRAP_FOUNDER_EMAIL)
  const reopenRes = await jarFetch(founderJar, `${env.CRM_BASE_URL}/api/prospects/${prospect.id}/dossier/mark-in-review`, {
    method: 'POST',
  })
  // mark-in-review checks `stageRank > stageRank('dossier_ready')`.
  // We just set stage=dossier_ready so this should be allowed.
  if (!reopenRes.ok) {
    throw new Error(`reopen failed: ${reopenRes.status} ${(await reopenRes.text()).slice(0, 200)}`)
  }
  const reopenPayload = (await reopenRes.json()) as { dossier: { status: string } }
  if (reopenPayload.dossier.status !== 'in_review') {
    throw new Error(`expected in_review, got ${reopenPayload.dossier.status}`)
  }
  console.log(`   ✓ dossier reopened: status=${reopenPayload.dossier.status}`)

  console.log('15. Cleanup: drop synthetic contact, restore prospect stage/owner, drop dossier + handoff artifacts')
  await db.execute(sql`delete from contacts where id = ${contactId}::uuid`)
  await db.execute(sql`
    delete from tasks
    where prospect_id = ${prospect.id}::uuid
      and title like '1st touch —%'
  `)
  await db.execute(sql`
    update prospects
    set stage = ${prospect.stage}::prospect_stage,
        owner_id = ${prospect.owner_id}::uuid
    where id = ${prospect.id}::uuid
  `)
  await db.execute(sql`delete from dossiers where prospect_id = ${prospect.id}::uuid`)
  await db.execute(sql`
    delete from activities
    where prospect_id = ${prospect.id}::uuid
      and (
        type = 'dossier_delivered'
        or (type = 'note' and (payload ->> 'kind') in ('handoff_task_created', 'dossier_reopened'))
      )
  `)

  await client.end()
  console.log('\nSMOKE: PASS')
}

main().catch(async (err) => {
  console.error('\nSMOKE: FAIL')
  console.error(err)
  process.exit(1)
})
