import { NextResponse } from 'next/server'
import { z } from 'zod'
import {
  emptyStudioSalesSnapshot,
  isStudioSalesSnapshot,
  type StudioSalesSnapshot,
} from '@/lib/studio/studioProfileSnapshot'
import { studioWorkThumbSrc } from '@/features/studio-settings/lib/studioWorkThumb'
import {
  isAuthedSession,
  requireAuthedSession,
  type AuthedSession,
} from '@/lib/supabase/authedSession'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface ProspectRow {
  id: string
  pitch_service_ids: string[] | null
  pitch_work_ids: string[] | null
  accounts: { workspace_id: string } | { workspace_id: string }[] | null
}

function workspaceIdOf(account: ProspectRow['accounts']): string | null {
  if (!account) return null
  return Array.isArray(account) ? account[0]?.workspace_id ?? null : account.workspace_id
}

async function loadProspect(
  supabase: AuthedSession['supabase'],
  prospectId: string,
): Promise<ProspectRow | null> {
  const { data, error } = await supabase
    .from('prospects')
    .select('id, pitch_service_ids, pitch_work_ids, accounts!inner(workspace_id)')
    .eq('id', prospectId)
    .maybeSingle()
  if (error) throw error
  return (data as ProspectRow | null) ?? null
}

async function loadSales(
  supabase: AuthedSession['supabase'],
  workspaceId: string,
): Promise<StudioSalesSnapshot> {
  const { data } = await supabase
    .from('workspace_studio_settings')
    .select('sales')
    .eq('workspace_id', workspaceId)
    .maybeSingle()
  return isStudioSalesSnapshot(data?.sales) ? data.sales : emptyStudioSalesSnapshot()
}

export async function GET(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAuthedSession()
  if (!isAuthedSession(auth)) return auth
  const { id: prospectId } = await ctx.params

  try {
    const row = await loadProspect(auth.supabase, prospectId)
    const ws = row ? workspaceIdOf(row.accounts) : null
    if (!row || !ws) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 })
    }
    const sales = await loadSales(auth.supabase, ws)

    const services = sales.serviceCatalog.map((s) => ({
      id: s.id,
      title: s.title,
      summary: s.summary ?? null,
      linkedWorkId: s.linkedWorkId ?? null,
    }))
    const works = sales.works
      .filter((w) => w.publicationStatus !== 'unpublished')
      .map((w) => ({
        id: w.id,
        title: w.headline?.trim() || w.title?.trim() || 'Untitled',
        clientName: w.clientName ?? null,
        categoryLabel: w.categoryLabel ?? null,
        caseUrl: w.caseUrl ?? null,
        linkedCatalogIds: w.linkedCatalogIds ?? [],
        thumbUrl: studioWorkThumbSrc(w),
      }))

    return NextResponse.json({
      workspaceId: ws,
      services,
      works,
      selectedServiceIds: Array.isArray(row.pitch_service_ids) ? row.pitch_service_ids : [],
      selectedWorkIds: Array.isArray(row.pitch_work_ids) ? row.pitch_work_ids : [],
    })
  } catch (err) {
    console.error('[api/prospects/.../studio-mapping GET]', err)
    return NextResponse.json({ error: 'query_failed' }, { status: 500 })
  }
}

const putSchema = z
  .object({
    serviceIds: z.array(z.string()).max(200).optional(),
    workIds: z.array(z.string()).max(200).optional(),
  })
  .strict()
  .refine((v) => v.serviceIds !== undefined || v.workIds !== undefined, { message: 'no_changes' })

export async function PUT(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAuthedSession()
  if (!isAuthedSession(auth)) return auth
  const { id: prospectId } = await ctx.params

  let raw: unknown
  try {
    raw = await request.json()
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }
  const parsed = putSchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_body', issues: parsed.error.issues }, { status: 400 })
  }

  try {
    const row = await loadProspect(auth.supabase, prospectId)
    const ws = row ? workspaceIdOf(row.accounts) : null
    if (!row || !ws) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 })
    }
    const sales = await loadSales(auth.supabase, ws)
    const validServiceIds = new Set(sales.serviceCatalog.map((s) => s.id))
    const validWorkIds = new Set(sales.works.map((w) => w.id))

    const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
    let nextServiceIds: string[] | undefined
    let nextWorkIds: string[] | undefined
    if (parsed.data.serviceIds !== undefined) {
      nextServiceIds = parsed.data.serviceIds.filter((id) => validServiceIds.has(id))
      update.pitch_service_ids = nextServiceIds
    }
    if (parsed.data.workIds !== undefined) {
      nextWorkIds = parsed.data.workIds.filter((id) => validWorkIds.has(id))
      update.pitch_work_ids = nextWorkIds
    }

    const { error: updErr } = await auth.supabase
      .from('prospects')
      .update(update)
      .eq('id', prospectId)
      .eq('workspace_id', ws)
    if (updErr) {
      console.error('[api/prospects/.../studio-mapping PUT] update', updErr)
      return NextResponse.json({ error: 'update_failed' }, { status: 500 })
    }

    return NextResponse.json({ ok: true, selectedServiceIds: nextServiceIds, selectedWorkIds: nextWorkIds })
  } catch (err) {
    console.error('[api/prospects/.../studio-mapping PUT]', err)
    return NextResponse.json({ error: 'update_failed' }, { status: 500 })
  }
}
