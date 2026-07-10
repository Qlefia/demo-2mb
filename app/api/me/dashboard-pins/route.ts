import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withUserRls } from '@/lib/db/rls'
import {
  fetchUserProspectPins,
  replaceUserProspectPins,
  toggleUserProspectPin,
} from '@/lib/dashboard/userProspectPins'
import { MAX_USER_PROSPECT_PINS } from '@/lib/db/schema/userProspectPins'
import { isAuthedSession, requireAuthedSession } from '@/lib/supabase/authedSession'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const putSchema = z
  .object({
    prospectIds: z.array(z.string().uuid()).max(MAX_USER_PROSPECT_PINS),
  })
  .strict()

const toggleSchema = z
  .object({
    prospectId: z.string().uuid(),
  })
  .strict()

export async function GET() {
  const auth = await requireAuthedSession()
  if (!isAuthedSession(auth)) return auth

  try {
    const items = await withUserRls(auth.session.access_token, (tx) =>
      fetchUserProspectPins(tx, auth.user.id),
    )
    return NextResponse.json({ items })
  } catch (err) {
    console.error('[api/me/dashboard-pins GET]', err)
    return NextResponse.json({ error: 'query_failed' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const auth = await requireAuthedSession()
  if (!isAuthedSession(auth)) return auth

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
    const items = await withUserRls(auth.session.access_token, async (tx) => {
      await replaceUserProspectPins(tx, auth.user.id, parsed.data.prospectIds)
      return fetchUserProspectPins(tx, auth.user.id)
    })
    return NextResponse.json({ items })
  } catch (err) {
    console.error('[api/me/dashboard-pins PUT]', err)
    return NextResponse.json({ error: 'update_failed' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAuthedSession()
  if (!isAuthedSession(auth)) return auth

  let raw: unknown
  try {
    raw = await request.json()
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  const parsed = toggleSchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_body', issues: parsed.error.issues }, { status: 400 })
  }

  try {
    const result = await withUserRls(auth.session.access_token, (tx) =>
      toggleUserProspectPin(tx, auth.user.id, parsed.data.prospectId, MAX_USER_PROSPECT_PINS),
    )
    return NextResponse.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'toggle_failed'
    if (message === 'pin_limit_reached') {
      return NextResponse.json({ error: 'pin_limit_reached', limit: MAX_USER_PROSPECT_PINS }, { status: 422 })
    }
    if (message === 'prospect_not_found') {
      return NextResponse.json({ error: 'prospect_not_found' }, { status: 404 })
    }
    console.error('[api/me/dashboard-pins POST]', err)
    return NextResponse.json({ error: 'toggle_failed' }, { status: 500 })
  }
}
