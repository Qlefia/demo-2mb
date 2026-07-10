import { NextRequest, NextResponse } from 'next/server'
import React from 'react'
import { renderToBuffer } from '@react-pdf/renderer'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { withUserRls } from '@/lib/db/rls'
import { isAuthedSession, requireAuthedSession } from '@/lib/supabase/authedSession'
import { proposals, proposalVersions } from '@/lib/db/schema'
import { ProposalPdfDocument } from '@/lib/proposals/pdf/ProposalPdfDocument'
import { parseSnapshotFromDiff } from '@/lib/proposals/versionPayload'
import { mergedDraftBlocks, mergeDraftOptionsFromProposalRow } from '@/lib/proposals/server/mergedDraft'
import { fetchProspectMergeContext } from '@/lib/proposals/mergeContext'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const idSchema = z.string().uuid()

interface RouteContext {
  params: Promise<{ id: string; proposalId: string }>
}

export async function GET(request: NextRequest, ctx: RouteContext) {
  const { id, proposalId } = await ctx.params
  const parsedProspect = idSchema.safeParse(id)
  const parsedProposal = idSchema.safeParse(proposalId)
  if (!parsedProspect.success || !parsedProposal.success) {
    return NextResponse.json({ error: 'invalid_id' }, { status: 400 })
  }

  const source = request.nextUrl.searchParams.get('source') ?? 'published'
  if (source !== 'published' && source !== 'draft') {
    return NextResponse.json({ error: 'invalid_query' }, { status: 400 })
  }

  const auth = await requireAuthedSession()
  if (!isAuthedSession(auth)) return auth

  try {
    const pdfBytes = await withUserRls(auth.session.access_token, async (tx) => {
      const [proposalRow] = await tx
        .select()
        .from(proposals)
        .where(
          and(
            eq(proposals.id, parsedProposal.data),
            eq(proposals.prospectId, parsedProspect.data),
          ),
        )
        .limit(1)

      if (!proposalRow) return { code: 'not_found' as const }

      const mergeCtx = await fetchProspectMergeContext(tx, parsedProspect.data)
      const accountLabel = mergeCtx?.accountName ?? 'Proposal'

      let blocks
      let versionLabel: string

      if (source === 'published') {
        if (!proposalRow.publishedVersionId) {
          return { code: 'not_published' as const }
        }
        const [ver] = await tx
          .select()
          .from(proposalVersions)
          .where(eq(proposalVersions.id, proposalRow.publishedVersionId))
          .limit(1)
        if (!ver) return { code: 'not_found' as const }
        blocks = parseSnapshotFromDiff(ver.blocksDiff)
        versionLabel = `v${ver.version}`
      } else {
        blocks = await mergedDraftBlocks(
          tx,
          parsedProspect.data,
          proposalRow.blocks,
          mergeDraftOptionsFromProposalRow(proposalRow),
        )
        versionLabel = `draft · v${proposalRow.version}`
      }

      const docTitle = `${accountLabel} — ${proposalRow.title} (${versionLabel})`
      const projectFooter = proposalRow.projectName?.trim() || accountLabel
      const metaLine = `${projectFooter} · ${proposalRow.title} · ${versionLabel}`

      const lang = proposalRow.language === 'de' ? 'de' : 'en'

      const buf = await renderToBuffer(
        React.createElement(ProposalPdfDocument, {
          documentTitle: docTitle,
          metaLine,
          blocks,
          language: lang,
        }) as Parameters<typeof renderToBuffer>[0],
      )

      return { code: 'ok' as const, buf, filename: `${accountLabel}-proposal-${versionLabel.replace(/\s+/g, '-')}.pdf` }
    })

    if (pdfBytes.code === 'not_found') {
      return NextResponse.json({ error: 'not_found' }, { status: 404 })
    }
    if (pdfBytes.code === 'not_published') {
      return NextResponse.json({ error: 'not_published' }, { status: 400 })
    }
    if (pdfBytes.code !== 'ok') {
      return NextResponse.json({ error: 'pdf_failed' }, { status: 500 })
    }

    return new NextResponse(new Uint8Array(pdfBytes.buf), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${pdfBytes.filename.replace(/"/g, '')}"`,
        'Cache-Control': 'private, no-store',
      },
    })
  } catch (err) {
    console.error('[api/.../pdf GET] failed', err)
    return NextResponse.json({ error: 'pdf_failed' }, { status: 500 })
  }
}
