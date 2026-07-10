import { NextRequest, NextResponse } from 'next/server'
import { getRoleFromUser, type CrmRole } from '@/lib/auth/roles'
import {
  createPlaybookSchema,
  emptyPlaybookSections,
  resolvePlaybookBody,
} from '@/lib/playbooks/schema'
import {
  PLAYBOOK_LIST_SELECT,
  serializePlaybookDetailRow,
  serializePlaybookListRow,
} from '@/lib/playbooks/serializePlaybook'
import { resolveWorkspaceId } from '@/lib/prospects/serverData'
import { isAuthedSession, requireAuthedSession } from '@/lib/supabase/authedSession'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const PLAYBOOK_WRITE_ROLES = new Set<CrmRole>(['founder', 'ops', 'sales_de', 'sales_uk'])

function canWritePlaybooks(role: CrmRole | null): boolean {
  return role != null && PLAYBOOK_WRITE_ROLES.has(role)
}

export async function GET() {
  const auth = await requireAuthedSession()
  if (!isAuthedSession(auth)) return auth

  const workspaceId = await resolveWorkspaceId(auth.supabase)
  if (!workspaceId) {
    return NextResponse.json({ items: [] })
  }

  const { data, error } = await auth.supabase
    .from('playbooks')
    .select(PLAYBOOK_LIST_SELECT)
    .eq('workspace_id', workspaceId)
    .order('name')
    .order('language')
    .order('version', { ascending: false })

  if (error) {
    console.error('[api/playbooks GET] failed', error)
    return NextResponse.json({ error: 'query_failed' }, { status: 500 })
  }

  const items = (data ?? []).map((row) =>
    serializePlaybookListRow(row as unknown as Record<string, unknown>),
  )
  return NextResponse.json({ items })
}

export async function POST(request: NextRequest) {
  const auth = await requireAuthedSession()
  if (!isAuthedSession(auth)) return auth

  const role = getRoleFromUser(auth.user)
  if (!canWritePlaybooks(role)) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  const workspaceId = await resolveWorkspaceId(auth.supabase)
  if (!workspaceId) {
    return NextResponse.json({ error: 'no_workspace' }, { status: 403 })
  }

  let raw: unknown
  try {
    raw = await request.json()
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  const parsed = createPlaybookSchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'invalid_body', issues: parsed.error.issues },
      { status: 400 },
    )
  }

  const input = parsed.data
  const sections = input.sections ?? emptyPlaybookSections()
  const body = resolvePlaybookBody(sections, input.body)

  const { data, error } = await auth.supabase
    .from('playbooks')
    .insert({
      workspace_id: workspaceId,
      name: input.name,
      language: input.language,
      kind: input.kind,
      summary: input.summary ?? '',
      sections,
      body,
      version: 1,
    })
    .select(PLAYBOOK_LIST_SELECT + ', created_at')
    .single()

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'duplicate_playbook' }, { status: 409 })
    }
    console.error('[api/playbooks POST] failed', error)
    return NextResponse.json({ error: 'create_failed' }, { status: 500 })
  }

  return NextResponse.json(serializePlaybookDetailRow(data as unknown as Record<string, unknown>), {
    status: 201,
  })
}
