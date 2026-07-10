import { NextRequest, NextResponse } from 'next/server'
import { and, desc, eq } from 'drizzle-orm'
import { z } from 'zod'
import { withUserRls } from '@/lib/db/rls'
import { isAuthedSession, requireAuthedSession } from '@/lib/supabase/authedSession'
import { prospects, proposals, accounts, workspaceStudioSettings } from '@/lib/db/schema'
import { proposalVersions } from '@/lib/db/schema/proposalVersions'
import { blocksForPreset, type ProposalPresetId } from '@/lib/proposals/presets'
import { parseProposalBlocks } from '@/lib/proposals/blockSchema'
import {
  mergeDraftOptionsFromProposalRow,
  mergedDraftBlocks,
} from '@/lib/proposals/server/mergedDraft'
import { snapshotPayload } from '@/lib/proposals/versionPayload'
import { proposalRowToJson } from '@/lib/proposals/proposalDto'
import { buildMergePackageFromContext } from '@/lib/proposals/mergeFields'
import { fetchProspectMergeContext } from '@/lib/proposals/mergeContext'
import {
  buildStudioProposalDefaults,
  resolveProposalValidityDays,
} from '@/lib/proposals/studioProposalDefaults'
import { PROPOSAL_DEFAULT_VALIDITY_DAYS } from '@/lib/proposals/proposalDefaults'
import {
  blocksFromDocumentTemplate,
  resolveDocumentTemplateFromStudio,
  validityDaysFromDocumentTemplate,
} from '@/lib/proposals/blocksFromDocumentTemplate'
import { parseDocumentKind } from '@/lib/proposals/documentKind'
import { assertProjectBelongsToProspect } from '@/lib/client-projects/service'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const idSchema = z.string().uuid()

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function GET(req: NextRequest, ctx: RouteContext) {
  const { id } = await ctx.params
  const parsedId = idSchema.safeParse(id)
  if (!parsedId.success) {
    return NextResponse.json({ error: 'invalid_id' }, { status: 400 })
  }
  const kind = parseDocumentKind(req.nextUrl.searchParams.get('kind'))
  const projectIdParam = req.nextUrl.searchParams.get('projectId')
  const projectFilter = projectIdParam ? idSchema.safeParse(projectIdParam) : null
  const auth = await requireAuthedSession()
  if (!isAuthedSession(auth)) return auth

  try {
    const result = await withUserRls(auth.session.access_token, async (tx) => {
      const ok = await tx
        .select({ id: prospects.id })
        .from(prospects)
        .where(eq(prospects.id, parsedId.data))
        .limit(1)
      if (ok.length === 0) return null

      const proposalConditions = [
        eq(proposals.prospectId, parsedId.data),
        eq(proposals.documentKind, kind),
      ]
      if (projectFilter?.success) {
        proposalConditions.push(eq(proposals.projectId, projectFilter.data))
      }

      const rows = await tx
        .select()
        .from(proposals)
        .where(and(...proposalConditions))
        .orderBy(desc(proposals.updatedAt))

      const withMerged = await Promise.all(
        rows.map(async (row) => {
          let mergedBlocks: Awaited<ReturnType<typeof mergedDraftBlocks>> | null = null
          try {
            mergedBlocks = await mergedDraftBlocks(
              tx,
              parsedId.data,
              row.blocks,
              mergeDraftOptionsFromProposalRow(row),
            )
          } catch {
            mergedBlocks = null
          }
          return {
            proposal: proposalRowToJson(row),
            mergedBlocks,
          }
        }),
      )

      return withMerged
    })

    if (result === null) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 })
    }
    return NextResponse.json({ items: result })
  } catch (err) {
    console.error('[api/prospects/:id/proposals GET] failed', err)
    return NextResponse.json({ error: 'query_failed' }, { status: 500 })
  }
}

const postSchema = z
  .object({
    title: z.string().min(1).max(300),
    preset: z.enum(['developer', 'architect', 'custom']).optional(),
    templateId: z.string().min(1).max(120).optional(),
    language: z.enum(['de', 'en']).optional(),
    documentKind: z.enum(['proposal', 'offer']).optional(),
    projectId: z.string().uuid().optional(),
  })
  .strict()

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
  const parsed = postSchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'invalid_body', issues: parsed.error.issues },
      { status: 400 },
    )
  }
  const body = parsed.data
  const documentKind = body.documentKind ?? 'proposal'
  const presetId = (body.preset ?? 'developer') as ProposalPresetId

  if (documentKind === 'offer' && !body.projectId) {
    return NextResponse.json({ error: 'project_required' }, { status: 422 })
  }

  try {
    const created = await withUserRls(auth.session.access_token, async (tx) => {
      const ok = await tx
        .select({ id: prospects.id })
        .from(prospects)
        .where(eq(prospects.id, parsedId.data))
        .limit(1)
      if (ok.length === 0) return { notFound: true as const }

      if (body.projectId) {
        const projectOk = await assertProjectBelongsToProspect(
          tx,
          parsedId.data,
          body.projectId,
        )
        if (!projectOk) return { notFound: true as const, invalidProject: true as const }
      }

      const mergeCtx = await fetchProspectMergeContext(tx, parsedId.data)
      const issuedAt = new Date()
      const projectName =
        mergeCtx?.projectPhaseLabel?.trim() ||
        mergeCtx?.primaryTriggerLabel?.trim() ||
        mergeCtx?.accountName?.trim() ||
        body.title.trim()

      const [prospectRow] = await tx
        .select({ territory: prospects.territory })
        .from(prospects)
        .where(eq(prospects.id, parsedId.data))
        .limit(1)

      const language =
        body.language ?? (prospectRow?.territory === 'DE' ? 'de' : 'en')

      const studioDefaults = mergeCtx
        ? buildStudioProposalDefaults(mergeCtx.studioGeneral, language)
        : null

      let validityDays = resolveProposalValidityDays(
        PROPOSAL_DEFAULT_VALIDITY_DAYS,
        studioDefaults,
      )

      let presetBlocks = blocksForPreset(presetId)
      const templateUsed = resolveDocumentTemplateFromStudio(
        mergeCtx?.studioGeneral,
        documentKind,
        body.templateId,
      )
      const useStudioTemplate =
        documentKind === 'offer' || Boolean(body.templateId || templateUsed.template)

      if (useStudioTemplate) {
        const [salesRow] = await tx
          .select({ sales: workspaceStudioSettings.sales })
          .from(prospects)
          .innerJoin(accounts, eq(prospects.accountId, accounts.id))
          .innerJoin(
            workspaceStudioSettings,
            eq(accounts.workspaceId, workspaceStudioSettings.workspaceId),
          )
          .where(eq(prospects.id, parsedId.data))
          .limit(1)

        presetBlocks = blocksFromDocumentTemplate({
          template: templateUsed.template,
          sections: templateUsed.sections,
          documentKind,
          language,
          studioGeneral: mergeCtx?.studioGeneral,
          studioSales: salesRow?.sales,
        })
        const templateValidity = validityDaysFromDocumentTemplate(templateUsed.template)
        if (templateValidity) validityDays = templateValidity
        else if (studioDefaults?.validityDays) validityDays = studioDefaults.validityDays
      }

      const initialBlocks = await mergedDraftBlocks(tx, parsedId.data, presetBlocks, {
        language,
        proposalMeta: {
          issuedAt,
          validityDays,
          projectName,
        },
      })

      const [inserted] = await tx
        .insert(proposals)
        .values({
          prospectId: parsedId.data,
          projectId: body.projectId ?? null,
          documentKind,
          title: body.title.trim(),
          blocks: initialBlocks as unknown as Record<string, unknown>,
          language,
          version: 1,
          status: 'draft',
          issuedAt,
          validityDays,
          projectName,
          createdBy: auth.user.id,
        })
        .returning()

      await tx.insert(proposalVersions).values({
        proposalId: inserted.id,
        version: 1,
        blocksDiff: snapshotPayload(initialBlocks) as unknown as Record<string, unknown>,
        generatedBy: auth.user.id,
      })

      return { notFound: false as const, row: inserted }
    })

    if ('invalidProject' in created && created.invalidProject) {
      return NextResponse.json({ error: 'invalid_project' }, { status: 422 })
    }
    if (created.notFound) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 })
    }

    let mergedBlocks: ReturnType<typeof parseProposalBlocks> | null = null
    let mergePackage = null as ReturnType<typeof buildMergePackageFromContext> | null
    let studioDefaults = null as ReturnType<typeof buildStudioProposalDefaults> | null
    try {
      mergedBlocks = await withUserRls(auth.session.access_token, async (tx) =>
        mergedDraftBlocks(
          tx,
          parsedId.data,
          created.row.blocks,
          mergeDraftOptionsFromProposalRow(created.row),
        ),
      )
      mergePackage = await withUserRls(auth.session.access_token, async (tx) => {
        const mergeCtx = await fetchProspectMergeContext(tx, parsedId.data)
        return mergeCtx
          ? buildMergePackageFromContext(mergeCtx, mergeDraftOptionsFromProposalRow(created.row))
          : null
      })
      studioDefaults = await withUserRls(auth.session.access_token, async (tx) => {
        const mergeCtx = await fetchProspectMergeContext(tx, parsedId.data)
        const lang = created.row.language === 'de' ? 'de' : 'en'
        return mergeCtx ? buildStudioProposalDefaults(mergeCtx.studioGeneral, lang) : null
      })
    } catch {
      mergedBlocks = null
      mergePackage = null
      studioDefaults = null
    }

    return NextResponse.json(
      {
        proposal: proposalRowToJson(created.row),
        mergedBlocks,
        mergePackage,
        studioDefaults,
      },
      { status: 201 },
    )
  } catch (err) {
    console.error('[api/prospects/:id/proposals POST] failed', err)
    return NextResponse.json({ error: 'create_failed' }, { status: 500 })
  }
}
