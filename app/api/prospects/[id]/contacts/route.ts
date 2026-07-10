import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { sql } from 'drizzle-orm'
import { withUserRls } from '@/lib/db/rls'
import { isAuthedSession, requireAuthedSession } from '@/lib/supabase/authedSession'
import { contacts } from '@/lib/db/schema'
import {
  createContactSchema,
} from '@/lib/contacts/schema'
import {
  listContactsForProspect,
  loadProspectAccount,
  rowToDto,
} from '@/lib/contacts/service'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const idSchema = z.string().uuid()

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function GET(_req: NextRequest, ctx: RouteContext) {
  const { id } = await ctx.params
  const parsedId = idSchema.safeParse(id)
  if (!parsedId.success) {
    return NextResponse.json({ error: 'invalid_id' }, { status: 400 })
  }
  const auth = await requireAuthedSession()
  if (!isAuthedSession(auth)) return auth
  try {
    const items = await withUserRls(auth.session.access_token, (tx) =>
      listContactsForProspect(tx, parsedId.data),
    )
    return NextResponse.json({ items })
  } catch (err) {
    console.error('[api/prospects/:id/contacts GET] failed', err)
    return NextResponse.json({ error: 'query_failed' }, { status: 500 })
  }
}

export async function POST(request: NextRequest, ctx: RouteContext) {
  const { id } = await ctx.params
  const parsedId = idSchema.safeParse(id)
  if (!parsedId.success) {
    return NextResponse.json({ error: 'invalid_id' }, { status: 400 })
  }
  const auth = await requireAuthedSession()
  if (!isAuthedSession(auth)) return auth
  let raw: unknown
  try {
    raw = await request.json()
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }
  const parsed = createContactSchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'invalid_body', issues: parsed.error.issues },
      { status: 400 },
    )
  }
  const body = parsed.data

  try {
    const result = await withUserRls(auth.session.access_token, async (tx) => {
      const ctx = await loadProspectAccount(tx, parsedId.data)
      if (!ctx) {
        return { ok: false as const, status: 404, body: { error: 'prospect_not_found' } }
      }
      const inserted = await tx
        .insert(contacts)
        .values({
          accountId: ctx.accountId,
          workspaceId: ctx.workspaceId,
          fullName: body.fullName,
          role: body.role,
          email: body.email,
          phone: body.phone,
          linkedinUrl: body.linkedinUrl,
          languages: body.languages,
          optOutAt: body.optedOut ? sql`now()` : null,
        })
        .returning()
      return { ok: true as const, contact: rowToDto(inserted[0]) }
    })

    if (!result.ok) {
      return NextResponse.json(result.body, { status: result.status })
    }
    return NextResponse.json({ contact: result.contact }, { status: 201 })
  } catch (err) {
    console.error('[api/prospects/:id/contacts POST] failed', err)
    // RLS denies for sales/admin → no rows returned, postgres throws.
    return NextResponse.json({ error: 'create_failed' }, { status: 500 })
  }
}
