import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withUserRls } from '@/lib/db/rls'
import { getSignalScanKeysStatus, runSignalScan } from '@/lib/signals/scanProspectSignals'
import { isAuthedSession, requireAuthedSession } from '@/lib/supabase/authedSession'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const bodySchema = z
  .object({
    scope: z.enum(['all', 'one']),
    prospectId: z.string().uuid().optional(),
  })
  .strict()
  .refine((v) => v.scope !== 'one' || Boolean(v.prospectId), {
    message: 'prospect_id_required',
    path: ['prospectId'],
  })

export async function GET() {
  const auth = await requireAuthedSession()
  if (!isAuthedSession(auth)) return auth

  return NextResponse.json({ keys: getSignalScanKeysStatus() })
}

export async function POST(request: NextRequest) {
  const auth = await requireAuthedSession()
  if (!isAuthedSession(auth)) return auth

  const keys = getSignalScanKeysStatus()
  if (!keys.anthropic) {
    return NextResponse.json({ error: 'missing_anthropic_api_key' }, { status: 422 })
  }
  if (!keys.newsapi && !keys.apollo) {
    return NextResponse.json({ error: 'missing_enrichment_keys' }, { status: 422 })
  }

  let raw: unknown
  try {
    raw = await request.json()
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  const parsed = bodySchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_body', issues: parsed.error.issues }, { status: 400 })
  }

  try {
    const result = await withUserRls(auth.session.access_token, (tx) =>
      runSignalScan(tx, parsed.data.scope, parsed.data.prospectId),
    )
    return NextResponse.json(result)
  } catch (err) {
    console.error('[api/signals/scan POST]', err)
    const message = err instanceof Error ? err.message : 'scan_failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
