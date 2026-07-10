import { NextRequest, NextResponse } from 'next/server'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { withUserRls } from '@/lib/db/rls'
import { accountCoaccessRequests, accounts } from '@/lib/db/schema'
import { isAuthedSession, requireAuthedSession } from '@/lib/supabase/authedSession'
import { resolvePrimaryWorkspaceId } from '@/lib/workspace/resolvePrimaryWorkspaceId'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const postSchema = z
  .object({
    accountId: z.string().uuid(),
    note: z.string().max(2000).optional(),
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

  try {
    const result = await withUserRls(auth.session.access_token, async (tx) => {
      const workspaceId = await resolvePrimaryWorkspaceId(tx, auth.user.id)
      const [acc] = await tx
        .select({ id: accounts.id })
        .from(accounts)
        .where(and(eq(accounts.id, parsed.data.accountId), eq(accounts.workspaceId, workspaceId)))
        .limit(1)
      if (!acc) return { error: 'not_found' as const }

      const [pending] = await tx
        .select({ id: accountCoaccessRequests.id })
        .from(accountCoaccessRequests)
        .where(
          and(
            eq(accountCoaccessRequests.accountId, parsed.data.accountId),
            eq(accountCoaccessRequests.requesterId, auth.user.id),
            eq(accountCoaccessRequests.status, 'pending'),
          ),
        )
        .limit(1)
      if (pending) return { error: 'already_pending' as const }

      const [row] = await tx
        .insert(accountCoaccessRequests)
        .values({
          workspaceId,
          accountId: parsed.data.accountId,
          requesterId: auth.user.id,
          note: parsed.data.note ?? null,
          status: 'pending',
        })
        .returning({ id: accountCoaccessRequests.id })
      return { id: row.id }
    })

    if (result && 'error' in result) {
      if (result.error === 'not_found') {
        return NextResponse.json({ error: 'not_found' }, { status: 404 })
      }
      return NextResponse.json({ error: 'already_pending' }, { status: 409 })
    }
    return NextResponse.json({ id: (result as { id: string }).id }, { status: 201 })
  } catch (err) {
    console.error('[api/account-coaccess-requests]', err)
    return NextResponse.json({ error: 'create_failed' }, { status: 500 })
  }
}
