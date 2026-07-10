import { NextResponse } from 'next/server'
import { desc, eq } from 'drizzle-orm'
import { withUserRls } from '@/lib/db/rls'
import { isAuthedSession, requireAuthedSession } from '@/lib/supabase/authedSession'
import { accounts, prospects, proposals } from '@/lib/db/schema'
import { proposalRowToJson } from '@/lib/proposals/proposalDto'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** Workspace-wide list of commercial offers (document_kind = offer). */
export async function GET() {
  const auth = await requireAuthedSession()
  if (!isAuthedSession(auth)) return auth

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
        .where(eq(proposals.documentKind, 'offer'))
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
    console.error('[api/offers GET] failed', err)
    return NextResponse.json({ error: 'query_failed' }, { status: 500 })
  }
}
