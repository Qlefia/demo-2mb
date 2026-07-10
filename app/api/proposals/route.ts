import { NextRequest, NextResponse } from 'next/server'
import { desc, eq } from 'drizzle-orm'
import { withUserRls } from '@/lib/db/rls'
import { isAuthedSession, requireAuthedSession } from '@/lib/supabase/authedSession'
import { accounts, prospects, proposals } from '@/lib/db/schema'
import { proposalRowToJson } from '@/lib/proposals/proposalDto'
import { parseDocumentKind } from '@/lib/proposals/documentKind'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const auth = await requireAuthedSession()
  if (!isAuthedSession(auth)) return auth

  const kind = parseDocumentKind(req.nextUrl.searchParams.get('kind') ?? 'proposal')

  try {
    const rows = await withUserRls(auth.session.access_token, async (tx) => {
      return tx
        .select({
          proposal: proposals,
          accountName: accounts.name,
          prospectStage: prospects.stage,
          prospectTerritory: prospects.territory,
        })
        .from(proposals)
        .innerJoin(prospects, eq(proposals.prospectId, prospects.id))
        .innerJoin(accounts, eq(prospects.accountId, accounts.id))
        .where(eq(proposals.documentKind, kind))
        .orderBy(desc(proposals.updatedAt))
    })

    const items = rows.map((r) => ({
      proposal: proposalRowToJson(r.proposal),
      accountName: r.accountName,
      prospectStage: r.prospectStage,
      prospectTerritory: r.prospectTerritory,
    }))

    return NextResponse.json({ items })
  } catch (err) {
    console.error('[api/proposals GET] failed', err)
    return NextResponse.json({ error: 'query_failed' }, { status: 500 })
  }
}
