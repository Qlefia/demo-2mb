import { NextRequest, NextResponse } from 'next/server'
import { getRoleFromUser, type CrmRole } from '@/lib/auth/roles'
import { updatePlaybookSchema } from '@/lib/playbooks/schema'
import {
  PLAYBOOK_LIST_SELECT,
  bodyFromSectionsPatch,
  serializePlaybookDetailRow,
} from '@/lib/playbooks/serializePlaybook'
import { resolveWorkspaceId } from '@/lib/prospects/serverData'
import { isAuthedSession, requireAuthedSession } from '@/lib/supabase/authedSession'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const PLAYBOOK_WRITE_ROLES = new Set<CrmRole>(['founder', 'ops', 'sales_de', 'sales_uk'])
const PLAYBOOK_DELETE_ROLES = new Set<CrmRole>(['founder', 'ops'])

type RouteContext = { params: Promise<{ id: string }> }

function canWritePlaybooks(role: CrmRole | null): boolean {
  return role != null && PLAYBOOK_WRITE_ROLES.has(role)
}

function canDeletePlaybooks(role: CrmRole | null): boolean {
  return role != null && PLAYBOOK_DELETE_ROLES.has(role)
}

export async function GET(_request: NextRequest, context: RouteContext) {
  const auth = await requireAuthedSession()
  if (!isAuthedSession(auth)) return auth

  const { id } = await context.params
  if (!isUuid(id)) {
    return NextResponse.json({ error: 'invalid_id' }, { status: 400 })
  }

  const workspaceId = await resolveWorkspaceId(auth.supabase)
  if (!workspaceId) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }

  const { data, error } = await auth.supabase
    .from('playbooks')
    .select(PLAYBOOK_LIST_SELECT + ', created_at')
    .eq('id', id)
    .eq('workspace_id', workspaceId)
    .maybeSingle()

  if (error) {
    console.error('[api/playbooks/[id] GET] failed', error)
    return NextResponse.json({ error: 'query_failed' }, { status: 500 })
  }
  if (!data) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }

  return NextResponse.json(serializePlaybookDetailRow(data as unknown as Record<string, unknown>))
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const auth = await requireAuthedSession()
  if (!isAuthedSession(auth)) return auth

  const role = getRoleFromUser(auth.user)
  if (!canWritePlaybooks(role)) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  const { id } = await context.params
  if (!isUuid(id)) {
    return NextResponse.json({ error: 'invalid_id' }, { status: 400 })
  }

  let raw: unknown
  try {
    raw = await request.json()
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  const parsed = updatePlaybookSchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'invalid_body', issues: parsed.error.issues },
      { status: 400 },
    )
  }

  const workspaceId = await resolveWorkspaceId(auth.supabase)
  if (!workspaceId) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }

  const patch: Record<string, unknown> = {}
  if (parsed.data.name !== undefined) patch.name = parsed.data.name
  if (parsed.data.language !== undefined) patch.language = parsed.data.language
  if (parsed.data.kind !== undefined) patch.kind = parsed.data.kind
  if (parsed.data.summary !== undefined) patch.summary = parsed.data.summary
  if (parsed.data.sections !== undefined) patch.sections = parsed.data.sections

  const compiledBody = bodyFromSectionsPatch(parsed.data.sections, parsed.data.body)
  if (compiledBody !== undefined) patch.body = compiledBody

  const { data, error } = await auth.supabase
    .from('playbooks')
    .update(patch)
    .eq('id', id)
    .eq('workspace_id', workspaceId)
    .select(PLAYBOOK_LIST_SELECT + ', created_at')
    .maybeSingle()

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'duplicate_playbook' }, { status: 409 })
    }
    console.error('[api/playbooks/[id] PATCH] failed', error)
    return NextResponse.json({ error: 'update_failed' }, { status: 500 })
  }
  if (!data) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }

  return NextResponse.json(serializePlaybookDetailRow(data as unknown as Record<string, unknown>))
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const auth = await requireAuthedSession()
  if (!isAuthedSession(auth)) return auth

  const role = getRoleFromUser(auth.user)
  if (!canDeletePlaybooks(role)) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  const { id } = await context.params
  if (!isUuid(id)) {
    return NextResponse.json({ error: 'invalid_id' }, { status: 400 })
  }

  const workspaceId = await resolveWorkspaceId(auth.supabase)
  if (!workspaceId) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }

  const { data, error } = await auth.supabase
    .from('playbooks')
    .delete()
    .eq('id', id)
    .eq('workspace_id', workspaceId)
    .select('id')
    .maybeSingle()

  if (error) {
    console.error('[api/playbooks/[id] DELETE] failed', error)
    return NextResponse.json({ error: 'delete_failed' }, { status: 500 })
  }
  if (!data) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }

  return NextResponse.json({ ok: true })
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}
