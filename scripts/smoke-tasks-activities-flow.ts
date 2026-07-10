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
  territory: string
  stage: string
  owner_id: string | null
}

async function pickDeProspect(db: ReturnType<typeof drizzle>): Promise<ProspectRow> {
  const rows = (await db.execute(sql`
    select id::text, territory::text, stage::text, owner_id::text
    from prospects
    where territory = 'DE'
    order by created_at asc
    limit 1
  `)) as unknown as ProspectRow[]
  if (!rows[0]) throw new Error('no DE prospect — run npm run seed:dev-prospects')
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
  const callbackUrl = `${baseUrl}/auth/callback?token_hash=${encodeURIComponent(
    data.properties.hashed_token,
  )}&type=magiclink&next=/`
  const res = await jarFetch(jar, callbackUrl)
  if (!res.ok && res.status !== 200) {
    throw new Error(`callback for ${email} returned ${res.status}`)
  }
}

async function userIdByEmail(
  service: SupabaseClient,
  email: string,
): Promise<string> {
  const { data, error } = await service.auth.admin.listUsers({ perPage: 200 })
  if (error) throw error
  const u = data.users.find((u) => u.email === email)
  if (!u) throw new Error(`no user with email ${email}`)
  return u.id
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
      `[smoke-tasks-activities-flow] dev server unreachable at ${env.CRM_BASE_URL}/api/health — start it with \`npm run dev\` first.`,
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

  console.log('1. Pick a DE prospect, prep clean state')
  const prospect = await pickDeProspect(db)
  console.log(`   prospect=${prospect.id}`)

  // Clean any leftovers from prior runs (including any system task_completed rows)
  await db.execute(sql`
    delete from tasks where prospect_id = ${prospect.id}::uuid
  `)
  await db.execute(sql`
    delete from activities
    where prospect_id = ${prospect.id}::uuid
      and type in ('note','call','email','linkedin','task_completed')
  `)

  // Bump stage so sales_de can see + write activities (rule:
  // stage_rank ≥ stage_rank('dossier_ready')) without needing dossier setup
  const originalStage = prospect.stage
  await db.execute(sql`
    update prospects set stage = 'dossier_ready'
    where id = ${prospect.id}::uuid
  `)

  console.log('2. Plant ops + sales_de + sales_uk + founder sessions')
  const opsJar = createCookieJar()
  await plantSession(service, opsJar, env.CRM_BASE_URL, 'ops+test@2mb.dev')
  const opsId = await userIdByEmail(service, 'ops+test@2mb.dev')

  const salesDeJar = createCookieJar()
  await plantSession(service, salesDeJar, env.CRM_BASE_URL, 'sales-de+test@2mb.dev')
  const salesDeId = await userIdByEmail(service, 'sales-de+test@2mb.dev')

  const salesUkJar = createCookieJar()
  await plantSession(service, salesUkJar, env.CRM_BASE_URL, 'sales-uk+test@2mb.dev')

  // ---------- Activities ----------
  console.log('\n--- Activities ---')

  console.log('3. Ops POST note → 201')
  const noteRes = await jarFetch(
    opsJar,
    `${env.CRM_BASE_URL}/api/prospects/${prospect.id}/activities`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'note',
        payload: { summary: 'Ops smoke: kicked off discovery for the Munich tender.' },
      }),
    },
  )
  if (noteRes.status !== 201) throw new Error(`Ops POST note expected 201, got ${noteRes.status}`)
  const noteCreated = (await noteRes.json()) as { activity: { id: string; actorId: string } }
  if (noteCreated.activity.actorId !== opsId) {
    throw new Error(`note actor mismatch: ${noteCreated.activity.actorId} vs ops ${opsId}`)
  }
  console.log(`   ✓ note id=${noteCreated.activity.id}`)

  console.log('4. Ops POST call (with duration)')
  const callRes = await jarFetch(
    opsJar,
    `${env.CRM_BASE_URL}/api/prospects/${prospect.id}/activities`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'call',
        payload: { summary: 'Discovery call', durationMinutes: 25 },
      }),
    },
  )
  if (callRes.status !== 201) throw new Error(`Ops POST call expected 201, got ${callRes.status}`)
  console.log('   ✓ call logged')

  console.log('5. Ops POST email (with subject)')
  const emailRes = await jarFetch(
    opsJar,
    `${env.CRM_BASE_URL}/api/prospects/${prospect.id}/activities`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'email',
        payload: { summary: 'Sent intro deck', subject: '2mb x prospect — intro deck' },
      }),
    },
  )
  if (emailRes.status !== 201) throw new Error(`Ops POST email expected 201, got ${emailRes.status}`)
  console.log('   ✓ email logged')

  console.log('6. Ops POST stage_change (system type) → 422')
  const sysRes = await jarFetch(
    opsJar,
    `${env.CRM_BASE_URL}/api/prospects/${prospect.id}/activities`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'stage_change', payload: {} }),
    },
  )
  if (sysRes.ok) throw new Error('Ops POST stage_change should be rejected as invalid_body or 422')
  console.log(`   ✓ system type rejected (status=${sysRes.status})`)

  console.log('7. Ops PATCH own note → 200')
  const patchOwnRes = await jarFetch(
    opsJar,
    `${env.CRM_BASE_URL}/api/prospects/${prospect.id}/activities/${noteCreated.activity.id}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'note',
        payload: { summary: 'Ops smoke: edited note text.' },
      }),
    },
  )
  if (!patchOwnRes.ok) throw new Error(`Ops PATCH own note failed: ${patchOwnRes.status}`)
  console.log('   ✓ ops edited note')

  console.log('8. Sales_de POST note for own DE prospect → 201')
  const salesNoteRes = await jarFetch(
    salesDeJar,
    `${env.CRM_BASE_URL}/api/prospects/${prospect.id}/activities`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'note', payload: { summary: 'Sales smoke: nice fit, will pitch.' } }),
    },
  )
  if (salesNoteRes.status !== 201) throw new Error(`Sales POST note expected 201, got ${salesNoteRes.status}`)
  const salesNote = (await salesNoteRes.json()) as { activity: { id: string; actorId: string } }
  if (salesNote.activity.actorId !== salesDeId) {
    throw new Error(`sales note actor mismatch: ${salesNote.activity.actorId}`)
  }
  console.log(`   ✓ sales_de logged note id=${salesNote.activity.id}`)

  console.log('9. Sales_de DELETE Ops note → 403/404 (RLS denies others)')
  const salesDelOpsRes = await jarFetch(
    salesDeJar,
    `${env.CRM_BASE_URL}/api/prospects/${prospect.id}/activities/${noteCreated.activity.id}`,
    { method: 'DELETE' },
  )
  if (salesDelOpsRes.ok) throw new Error('Sales_de should not be able to DELETE ops note')
  console.log(`   ✓ denied (status=${salesDelOpsRes.status})`)

  console.log('10. Sales_de DELETE own note → 200')
  const salesDelOwnRes = await jarFetch(
    salesDeJar,
    `${env.CRM_BASE_URL}/api/prospects/${prospect.id}/activities/${salesNote.activity.id}`,
    { method: 'DELETE' },
  )
  if (!salesDelOwnRes.ok) throw new Error(`Sales_de DELETE own failed: ${salesDelOwnRes.status}`)
  console.log('   ✓ sales_de deleted own note')

  console.log('11. Sales_uk POST activity for DE prospect → 403/500 (RLS denies)')
  const salesUkRes = await jarFetch(
    salesUkJar,
    `${env.CRM_BASE_URL}/api/prospects/${prospect.id}/activities`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'note', payload: { summary: 'cross-territory leak attempt' } }),
    },
  )
  if (salesUkRes.ok) throw new Error('Sales_uk should not be able to POST for DE prospect')
  console.log(`   ✓ cross-territory denied (status=${salesUkRes.status})`)

  // ---------- Tasks ----------
  console.log('\n--- Tasks ---')

  console.log('12. Ops POST task assigned to sales_de → 201')
  const dueAt = new Date(Date.now() + 24 * 3600 * 1000).toISOString()
  const taskRes = await jarFetch(
    opsJar,
    `${env.CRM_BASE_URL}/api/prospects/${prospect.id}/tasks`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Prepare discovery deck',
        assigneeId: salesDeId,
        dueAt,
      }),
    },
  )
  if (taskRes.status !== 201) {
    throw new Error(`Ops POST task expected 201, got ${taskRes.status} ${(await taskRes.text()).slice(0, 200)}`)
  }
  const taskCreated = (await taskRes.json()) as { task: { id: string; status: string; assigneeId: string } }
  if (taskCreated.task.assigneeId !== salesDeId) {
    throw new Error(`task assignee mismatch: ${taskCreated.task.assigneeId}`)
  }
  if (taskCreated.task.status !== 'open') {
    throw new Error(`task should default to open, got ${taskCreated.task.status}`)
  }
  console.log(`   ✓ task id=${taskCreated.task.id}`)

  console.log('13. Sales_uk GET tasks for DE prospect → empty list (RLS scopes)')
  const ukTasksRes = await jarFetch(
    salesUkJar,
    `${env.CRM_BASE_URL}/api/prospects/${prospect.id}/tasks`,
  )
  if (!ukTasksRes.ok) throw new Error(`Sales_uk GET tasks failed: ${ukTasksRes.status}`)
  const ukTasks = (await ukTasksRes.json()) as { items: Array<{ id: string }> }
  if (ukTasks.items.find((tk) => tk.id === taskCreated.task.id)) {
    throw new Error('Sales_uk should not see DE prospect tasks')
  }
  console.log(`   ✓ sales_uk sees ${ukTasks.items.length} tasks (none of ours)`)

  console.log('14. Sales_de PATCH status=in_progress → 200')
  const startRes = await jarFetch(
    salesDeJar,
    `${env.CRM_BASE_URL}/api/prospects/${prospect.id}/tasks/${taskCreated.task.id}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'in_progress' }),
    },
  )
  if (!startRes.ok) throw new Error(`Sales_de PATCH status failed: ${startRes.status}`)
  console.log('   ✓ task moved to in_progress')

  console.log('15. Sales_de PATCH status=done → 200 + task_completed activity logged')
  const doneRes = await jarFetch(
    salesDeJar,
    `${env.CRM_BASE_URL}/api/prospects/${prospect.id}/tasks/${taskCreated.task.id}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'done' }),
    },
  )
  if (!doneRes.ok) throw new Error(`Sales_de PATCH done failed: ${doneRes.status}`)
  const donePayload = (await doneRes.json()) as {
    task: { status: string; completedAt: string | null }
  }
  if (donePayload.task.status !== 'done') throw new Error(`expected status=done`)
  if (!donePayload.task.completedAt) throw new Error('completedAt should be set on done')
  console.log(`   ✓ done at=${donePayload.task.completedAt}`)

  const tcRows = (await db.execute(sql`
    select payload->>'taskId' as task_id from activities
    where prospect_id = ${prospect.id}::uuid and type = 'task_completed'
  `)) as unknown as Array<{ task_id: string }>
  if (!tcRows.find((r) => r.task_id === taskCreated.task.id)) {
    throw new Error('task_completed activity not logged for the task')
  }
  console.log('   ✓ task_completed activity logged')

  console.log('16. Sales_de DELETE task → 403/404 (only ops/founder can delete)')
  const salesDelTaskRes = await jarFetch(
    salesDeJar,
    `${env.CRM_BASE_URL}/api/prospects/${prospect.id}/tasks/${taskCreated.task.id}`,
    { method: 'DELETE' },
  )
  if (salesDelTaskRes.ok) throw new Error('Sales_de should not be able to DELETE task')
  console.log(`   ✓ sales_de DELETE denied (status=${salesDelTaskRes.status})`)

  console.log('17. Ops DELETE task → 200')
  const opsDelTaskRes = await jarFetch(
    opsJar,
    `${env.CRM_BASE_URL}/api/prospects/${prospect.id}/tasks/${taskCreated.task.id}`,
    { method: 'DELETE' },
  )
  if (!opsDelTaskRes.ok) throw new Error(`Ops DELETE task failed: ${opsDelTaskRes.status}`)
  console.log('   ✓ ops deleted the task')

  console.log('\n18. Cleanup')
  await db.execute(sql`
    delete from activities
    where prospect_id = ${prospect.id}::uuid
      and type in ('note','call','email','linkedin','task_completed')
  `)
  await db.execute(sql`
    delete from tasks where prospect_id = ${prospect.id}::uuid
  `)
  await db.execute(sql`
    update prospects set stage = ${originalStage}::prospect_stage
    where id = ${prospect.id}::uuid
  `)

  await client.end()
  console.log('\nSMOKE: PASS')
}

main().catch(async (err) => {
  console.error('\nSMOKE: FAIL')
  console.error(err)
  process.exit(1)
})
