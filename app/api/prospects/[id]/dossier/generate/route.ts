import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { embedText } from '@/lib/ai/embeddings'
import { buildGroundingPack } from '@/lib/ai/grounding'
import { completeDossierDraftFromGrounding } from '@/lib/ai/llm'
import { collectEnrichmentMergeInput } from '@/lib/enrichment/collectMergeInput'
import type { EnrichmentAccountContext } from '@/lib/enrichment/types'
import { mergeAccountRowIntoSnapshot } from '@/lib/enrichment/types'
import { buildCaseSearchText } from '@/lib/dossiers/caseSearchText'
import { mergeAiDraftOver } from '@/lib/dossiers/aiMerge'
import { matchComparableCases } from '@/lib/dossiers/match-cases'
import {
  EMPTY_SECTIONS,
  dossierSectionsSchema,
  type DossierSections,
} from '@/lib/dossiers/schema'
import {
  ensureProspectExists,
  loadDossierByProspect,
  saveDossierSections,
} from '@/lib/dossiers/service'
import { stripUngroundedUrls } from '@/lib/dossiers/ungrounded'
import { db, type Database } from '@/lib/db/client'
import { accounts, prospects } from '@/lib/db/schema'
import { withUserRls } from '@/lib/db/rls'
import { env } from '@/lib/env'
import { isAuthedSession, requireAuthedSession } from '@/lib/supabase/authedSession'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const OPS_ROLES = new Set(['founder', 'ops', 'admin'])

const idSchema = z.string().uuid()

interface RouteContext {
  params: Promise<{ id: string }>
}

function isInternalGenerateRequest(request: Request): boolean {
  if (!env.ENRICH_INTERNAL_SECRET) return false
  const got = request.headers.get('x-enrichment-secret')
  return got != null && got === env.ENRICH_INTERNAL_SECRET
}

async function runWithDbAccess<T>(
  internal: boolean,
  accessToken: string | null,
  fn: (tx: Database) => Promise<T>,
): Promise<T> {
  if (internal) {
    return db.transaction(async (tx) => fn(tx as unknown as Database))
  }
  if (!accessToken) throw new Error('missing_access_token')
  return withUserRls(accessToken, fn)
}

export async function POST(request: Request, ctx: RouteContext) {
  const { id } = await ctx.params
  const parsedId = idSchema.safeParse(id)
  if (!parsedId.success) {
    return NextResponse.json({ error: 'invalid_id' }, { status: 400 })
  }

  const internal = isInternalGenerateRequest(request)

  let accessToken: string | null = null
  let actorId: string | null = null

  if (internal) {
    /* trusted proxy (Supabase Edge + shared secret) — no end-user JWT */
  } else {
    const auth = await requireAuthedSession()
    if (!isAuthedSession(auth)) return auth
    const role = (auth.user.app_metadata as { role?: string } | undefined)?.role
    if (!role || !OPS_ROLES.has(role)) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 })
    }
    accessToken = auth.session.access_token
    actorId = auth.user.id
  }

  try {
    const prospectPack = await runWithDbAccess(internal, accessToken, async (tx) => {
      const exists = await ensureProspectExists(tx, parsedId.data)
      if (!exists.exists) return { ok: false as const, status: 404 as const }

      const rows = await tx
        .select({
          prospectId: prospects.id,
          accountId: prospects.accountId,
          accountName: accounts.name,
          website: accounts.website,
          legalForm: accounts.legalForm,
          hqCountry: accounts.hqCountry,
          hqCity: accounts.hqCity,
          employees: accounts.employees,
          foundedYear: accounts.foundedYear,
          publicPrivate: accounts.publicPrivate,
        })
        .from(prospects)
        .innerJoin(accounts, eq(accounts.id, prospects.accountId))
        .where(eq(prospects.id, parsedId.data))
        .limit(1)

      const row = rows[0]
      if (!row) return { ok: false as const, status: 404 as const }

      const existingDossier = await loadDossierByProspect(tx, parsedId.data)
      return {
        ok: true as const,
        ctx: {
          prospectId: row.prospectId,
          accountId: row.accountId,
          accountName: row.accountName,
          website: row.website,
        } satisfies EnrichmentAccountContext,
        account: {
          legalForm: row.legalForm,
          hqCountry: row.hqCountry,
          hqCity: row.hqCity,
          employees: row.employees,
          foundedYear: row.foundedYear,
          publicPrivate: row.publicPrivate,
        },
        existingSections: existingDossier?.sections ?? EMPTY_SECTIONS,
      }
    })

    if (!prospectPack.ok) {
      return NextResponse.json({ error: 'not_found' }, { status: prospectPack.status })
    }

    const mergeInput = await collectEnrichmentMergeInput(prospectPack.ctx)

    let topCases: unknown[] = []
    if (process.env.OPENAI_API_KEY?.trim()) {
      try {
        const searchText = buildCaseSearchText({
          accountName: prospectPack.ctx.accountName,
          website: prospectPack.ctx.website,
          enrichment: mergeInput,
        })
        const vec = await embedText(searchText)
        topCases = await runWithDbAccess(internal, accessToken, async (tx) =>
          matchComparableCases(tx as unknown as Database, vec, {
            hqCountry: prospectPack.account.hqCountry,
            hqCity: prospectPack.account.hqCity,
          }),
        )
      } catch (e) {
        console.warn('[dossier/generate] top_cases unavailable', e)
      }
    }

    const grounding = buildGroundingPack({
      prospectId: prospectPack.ctx.prospectId,
      accountId: prospectPack.ctx.accountId,
      accountName: prospectPack.ctx.accountName,
      website: prospectPack.ctx.website,
      enrichment: mergeInput,
      topCases,
    })

    let draft: DossierSections
    let usagePayload: Record<string, unknown>
    try {
      const result = await completeDossierDraftFromGrounding(grounding)
      draft = result.sections
      usagePayload = {
        model: result.usage.model,
        prompt_id: result.usage.promptId,
        prompt_version: result.usage.promptVersion,
        tokens_in: result.usage.tokensIn,
        tokens_out: result.usage.tokensOut,
        cost_usd: result.usage.costUsd,
        latency_ms: result.usage.latencyMs,
        called_at: result.usage.calledAt,
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'ai_failed'
      console.error('[dossier/generate]', err)
      return NextResponse.json({ error: 'ai_failed', detail: msg }, { status: 422 })
    }

    draft = stripUngroundedUrls(draft, grounding.serializedForAllowlist)
    draft = mergeAccountRowIntoSnapshot(draft, prospectPack.account)

    let merged = mergeAiDraftOver(prospectPack.existingSections, draft)
    const parsedSections = dossierSectionsSchema.safeParse(merged)
    if (!parsedSections.success) {
      return NextResponse.json(
        { error: 'invalid_sections_shape', issues: parsedSections.error.issues },
        { status: 422 },
      )
    }
    merged = parsedSections.data

    const saveResult = await runWithDbAccess(internal, accessToken, async (tx) => {
      return saveDossierSections(tx, parsedId.data, merged, actorId, {
        aiMetadata: usagePayload,
      })
    })

    return NextResponse.json({
      dossier: saveResult.dossier,
      sections: saveResult.dossier.sections,
      versionWritten: saveResult.versionWritten,
      versionNumber: saveResult.versionNumber,
      changedKeys: saveResult.changedKeys,
    })
  } catch (err) {
    console.error('[api/dossier/generate]', err)
    return NextResponse.json({ error: 'server_error' }, { status: 500 })
  }
}
