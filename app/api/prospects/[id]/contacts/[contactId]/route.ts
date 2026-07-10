import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { eq, sql } from 'drizzle-orm'
import { withUserRls } from '@/lib/db/rls'
import { isAuthedSession, requireAuthedSession } from '@/lib/supabase/authedSession'
import { contacts } from '@/lib/db/schema'
import { updateContactSchema } from '@/lib/contacts/schema'
import { getContactWithGuard, rowToDto } from '@/lib/contacts/service'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const idSchema = z.string().uuid()

interface RouteContext {
  params: Promise<{ id: string; contactId: string }>
}

export async function PATCH(request: NextRequest, ctx: RouteContext) {
  const { id, contactId } = await ctx.params
  const parsedId = idSchema.safeParse(id)
  const parsedContact = idSchema.safeParse(contactId)
  if (!parsedId.success || !parsedContact.success) {
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
  const parsed = updateContactSchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'invalid_body', issues: parsed.error.issues },
      { status: 400 },
    )
  }
  const body = parsed.data
  if (Object.keys(body).length === 0) {
    return NextResponse.json({ error: 'no_changes' }, { status: 400 })
  }

  try {
    const outcome = await withUserRls(auth.session.access_token, async (tx) => {
      const guard = await getContactWithGuard(tx, parsedId.data, parsedContact.data)
      if (!guard) {
        return { ok: false as const, status: 404, body: { error: 'not_found' } }
      }
      const patch: Record<string, unknown> = { updatedAt: sql`now()` }
      if (body.fullName !== undefined) patch.fullName = body.fullName
      if (body.role !== undefined) patch.role = body.role ?? null
      if (body.email !== undefined) patch.email = body.email ?? null
      if (body.phone !== undefined) patch.phone = body.phone ?? null
      if (body.linkedinUrl !== undefined) patch.linkedinUrl = body.linkedinUrl ?? null
      if (body.languages !== undefined) patch.languages = body.languages ?? null
      if (body.optedOut !== undefined) {
        patch.optOutAt = body.optedOut ? sql`now()` : null
      }
      const updated = await tx
        .update(contacts)
        .set(patch)
        .where(eq(contacts.id, parsedContact.data))
        .returning()
      if (updated.length === 0) {
        return { ok: false as const, status: 403, body: { error: 'forbidden' } }
      }
      return { ok: true as const, contact: rowToDto(updated[0]) }
    })

    if (!outcome.ok) {
      return NextResponse.json(outcome.body, { status: outcome.status })
    }
    return NextResponse.json({ contact: outcome.contact })
  } catch (err) {
    console.error('[api/prospects/:id/contacts/:contactId PATCH] failed', err)
    return NextResponse.json({ error: 'update_failed' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, ctx: RouteContext) {
  const { id, contactId } = await ctx.params
  const parsedId = idSchema.safeParse(id)
  const parsedContact = idSchema.safeParse(contactId)
  if (!parsedId.success || !parsedContact.success) {
    return NextResponse.json({ error: 'invalid_id' }, { status: 400 })
  }
  const auth = await requireAuthedSession()
  if (!isAuthedSession(auth)) return auth

  try {
    const outcome = await withUserRls(auth.session.access_token, async (tx) => {
      const guard = await getContactWithGuard(tx, parsedId.data, parsedContact.data)
      if (!guard) {
        return { ok: false as const, status: 404, body: { error: 'not_found' } }
      }
      const deleted = await tx
        .delete(contacts)
        .where(eq(contacts.id, parsedContact.data))
        .returning({ id: contacts.id })
      if (deleted.length === 0) {
        return { ok: false as const, status: 403, body: { error: 'forbidden' } }
      }
      return { ok: true as const }
    })

    if (!outcome.ok) {
      return NextResponse.json(outcome.body, { status: outcome.status })
    }
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[api/prospects/:id/contacts/:contactId DELETE] failed', err)
    return NextResponse.json({ error: 'delete_failed' }, { status: 500 })
  }
}
