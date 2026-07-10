import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { isAuthedSession, requireAuthedSession } from '@/lib/supabase/authedSession'
import { findMatchingAccountPostgrest, normalizeWebsite } from '@/lib/prospects/accountDedupe'
import { resolveWorkspaceId } from '@/lib/prospects/serverData'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const querySchema = z.object({
  accountName: z.string().optional(),
  website: z.string().optional(),
})

/** Lightweight duplicate check for lead intake (debounced client). */
export async function GET(request: NextRequest) {
  const auth = await requireAuthedSession()
  if (!isAuthedSession(auth)) return auth

  const accountName = request.nextUrl.searchParams.get('accountName') ?? ''
  const websiteRaw = request.nextUrl.searchParams.get('website') ?? ''
  const parsed = querySchema.safeParse({ accountName, website: websiteRaw || undefined })
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_query' }, { status: 400 })
  }

  if (accountName.trim().length < 2 && !normalizeWebsite(websiteRaw)) {
    return NextResponse.json({ duplicate: false, account: null })
  }

  try {
    const workspaceId = await resolveWorkspaceId(auth.supabase)
    if (!workspaceId) {
      return NextResponse.json({ error: 'workspace_access_denied' }, { status: 403 })
    }

    const account = await findMatchingAccountPostgrest(
      auth.supabase,
      workspaceId,
      accountName,
      websiteRaw || undefined,
    )
    return NextResponse.json({ duplicate: Boolean(account), account })
  } catch (err) {
    console.error('[api/prospects/intake-precheck] failed', err)
    return NextResponse.json({ error: 'query_failed' }, { status: 500 })
  }
}
