import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withUserRls } from '@/lib/db/rls'
import { createTriggerInTx } from '@/lib/triggers/createTriggerInTx'
import { pickCrmRole } from '@/lib/auth/roles'
import { isAuthedSession, requireAuthedSession } from '@/lib/supabase/authedSession'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const OPS_ROLES = new Set(['founder', 'ops', 'admin'])

const postSchema = z
  .object({
    prospectId: z.string().uuid(),
    text: z.string().min(1).max(2000),
    sourceUrl: z
      .string()
      .url()
      .max(500)
      .optional()
      .or(z.literal('').transform(() => undefined)),
    type: z.string().min(1).max(80).default('manual'),
    occurredAt: z.string().datetime().optional(),
  })
  .strict()

export async function POST(request: NextRequest) {
  const auth = await requireAuthedSession()
  if (!isAuthedSession(auth)) return auth

  const role = pickCrmRole((auth.user.app_metadata ?? {}).role)
  if (!role || !OPS_ROLES.has(role)) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  let raw: unknown
  try {
    raw = await request.json()
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  const parsed = postSchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'invalid_body', issues: parsed.error.issues },
      { status: 400 },
    )
  }

  const body = parsed.data
  const occurredAt = body.occurredAt ? new Date(body.occurredAt) : null

  try {
    const out = await withUserRls(auth.session.access_token, async (tx) => {
      const created = await createTriggerInTx(tx, {
        prospectId: body.prospectId,
        text: body.text,
        sourceUrl: body.sourceUrl,
        type: body.type,
        occurredAt,
      })
      if (!created.ok) {
        return { ok: false as const, status: 404, body: { error: 'prospect_not_found' } }
      }
      return { ok: true as const, triggerId: created.triggerId }
    })

    if (!out.ok) {
      return NextResponse.json(out.body, { status: out.status })
    }

    return NextResponse.json({ ok: true, triggerId: out.triggerId }, { status: 201 })
  } catch (err) {
    console.error('[api/triggers POST]', err)
    return NextResponse.json({ error: 'create_failed' }, { status: 500 })
  }
}
