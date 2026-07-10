import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { isAuthedSession, requireAuthedSession } from '@/lib/supabase/authedSession'
import { PROSPECT_SOURCES, TERRITORIES } from '@/lib/db/schema/enums'
import { findMatchingAccountPostgrest } from '@/lib/prospects/accountDedupe'
import { insertProspectWithTriggerPostgrest } from '@/lib/prospects/createProspectWithTrigger'
import { loadProspectsForUser, resolveWorkspaceId } from '@/lib/prospects/serverData'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const auth = await requireAuthedSession()
  if (!isAuthedSession(auth)) return auth

  try {
    const items = await loadProspectsForUser(auth.supabase)
    if (items === null) {
      return NextResponse.json({ error: 'workspace_access_denied' }, { status: 403 })
    }
    return NextResponse.json({ items })
  } catch (err) {
    console.error('[api/prospects GET] query failed', err)
    return NextResponse.json({ error: 'query_failed' }, { status: 500 })
  }
}

const postSchema = z
  .object({
    accountName: z.string().min(2).max(200),
    website: z
      .string()
      .url()
      .max(500)
      .optional()
      .or(z.literal('').transform(() => undefined)),
    territory: z.enum(TERRITORIES),
    source: z.enum(PROSPECT_SOURCES),
    triggerText: z.string().min(3).max(2000),
    triggerType: z.string().min(1).max(80).default('manual'),
    triggerSourceUrl: z
      .string()
      .url()
      .max(500)
      .optional()
      .or(z.literal('').transform(() => undefined)),
    priority: z.number().int().min(1).max(5).default(3),
    acknowledgeDuplicate: z.boolean().optional(),
  })
  .strict()

export async function POST(request: NextRequest) {
  const auth = await requireAuthedSession()
  if (!isAuthedSession(auth)) return auth

  let raw: unknown
  try {
    raw = await request.json()
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  const parsed = postSchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_body', issues: parsed.error.issues }, { status: 400 })
  }
  const body = parsed.data

  try {
    const workspaceId = await resolveWorkspaceId(auth.supabase)
    if (!workspaceId) {
      return NextResponse.json({ error: 'workspace_access_denied' }, { status: 403 })
    }

    const match = await findMatchingAccountPostgrest(
      auth.supabase,
      workspaceId,
      body.accountName,
      body.website,
    )
    if (match && !body.acknowledgeDuplicate) {
      return NextResponse.json({ error: 'duplicate_account', account: match }, { status: 409 })
    }

    const { prospectId } = await insertProspectWithTriggerPostgrest(auth.supabase, {
      workspaceId,
      accountName: body.accountName,
      website: body.website,
      territory: body.territory,
      source: body.source,
      priority: body.priority,
      triggerText: body.triggerText,
      triggerType: body.triggerType,
      triggerSourceUrl: body.triggerSourceUrl,
      createdByUserId: auth.user.id,
    })
    return NextResponse.json({ prospect: { id: prospectId } }, { status: 201 })
  } catch (err) {
    console.error('[api/prospects POST] failed', err)
    return NextResponse.json({ error: 'create_failed' }, { status: 500 })
  }
}
