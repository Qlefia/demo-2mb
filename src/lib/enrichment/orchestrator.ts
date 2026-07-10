import 'server-only'

import { randomUUID } from 'node:crypto'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db/client'
import { contacts, dossiers, enrichmentJobs, prospects, accounts } from '@/lib/db/schema'
import { dossierSectionsSchema, EMPTY_SECTIONS, type DossierSections } from '@/lib/dossiers/schema'
import { enrichApollo } from '@/lib/enrichment/providers/apollo'
import { enrichBrowseAi } from '@/lib/enrichment/providers/browseai'
import { enrichNewsApi } from '@/lib/enrichment/providers/news'
import { enrichWayback } from '@/lib/enrichment/providers/wayback'
import {
  mergeAccountRowIntoSnapshot,
  mergeEnrichmentDraft,
  type ApolloPersonRow,
  type EnrichmentAccountContext,
  type EnrichmentMergeInput,
} from '@/lib/enrichment/types'

export interface RunEnrichmentResult {
  ok: boolean
  error?: string
}

function parseSections(raw: unknown): DossierSections {
  const parsed = dossierSectionsSchema.safeParse(raw)
  return parsed.success ? parsed.data : EMPTY_SECTIONS
}

async function insertApolloContacts(
  accountId: string,
  workspaceId: string,
  people: ApolloPersonRow[] | undefined,
): Promise<string[]> {
  if (!people?.length) return []
  const existing = await db
    .select({ email: contacts.email })
    .from(contacts)
    .where(eq(contacts.accountId, accountId))
  const seen = new Set(
    existing.map((r) => (r.email ? String(r.email).toLowerCase() : '')).filter(Boolean),
  )
  const createdIds: string[] = []
  for (const p of people) {
    if (!p.email?.trim()) continue
    const lower = p.email.trim().toLowerCase()
    if (seen.has(lower)) continue
    seen.add(lower)
    const inserted = await db
      .insert(contacts)
      .values({
        accountId,
        workspaceId,
        fullName: p.fullName,
        role: p.role,
        email: lower,
        phone: p.phone,
        linkedinUrl: p.linkedinUrl,
        sourceProvider: 'apollo',
        sourceFetchedAt: new Date(),
      })
      .returning({ id: contacts.id })
    if (inserted[0]) createdIds.push(inserted[0].id)
  }
  return createdIds
}

export async function runProspectEnrichment(prospectId: string): Promise<RunEnrichmentResult> {
  const runId = randomUUID()

  try {
    const prow = await db
      .select({
        id: prospects.id,
        accountId: prospects.accountId,
        workspaceId: prospects.workspaceId,
      })
      .from(prospects)
      .where(eq(prospects.id, prospectId))
      .limit(1)

    if (prow.length === 0) {
      return { ok: false, error: 'prospect_not_found' }
    }

    const acc = await db
      .select({
        name: accounts.name,
        website: accounts.website,
        legalForm: accounts.legalForm,
        hqCountry: accounts.hqCountry,
        hqCity: accounts.hqCity,
        employees: accounts.employees,
        foundedYear: accounts.foundedYear,
        publicPrivate: accounts.publicPrivate,
      })
      .from(accounts)
      .where(eq(accounts.id, prow[0].accountId))
      .limit(1)

    const dos = await db
      .select({ id: dossiers.id, sections: dossiers.sections })
      .from(dossiers)
      .where(eq(dossiers.prospectId, prospectId))
      .limit(1)

    const ctx: EnrichmentAccountContext = {
      prospectId,
      accountId: prow[0].accountId,
      accountName: acc[0]?.name ?? 'Unknown',
      website: acc[0]?.website ?? null,
    }

    const mergeInput: EnrichmentMergeInput = {}

    const steps: Array<{
      jobProvider: string
      run: () => Promise<void>
    }> = [
      {
        jobProvider: 'apollo',
        run: async () => {
          mergeInput.apollo = await enrichApollo(ctx)
        },
      },
      {
        jobProvider: 'browse_ai',
        run: async () => {
          mergeInput.browseAi = await enrichBrowseAi(ctx)
        },
      },
      {
        jobProvider: 'newsapi',
        run: async () => {
          mergeInput.newsapi = await enrichNewsApi(ctx)
        },
      },
      {
        jobProvider: 'wayback',
        run: async () => {
          mergeInput.wayback = await enrichWayback(ctx)
        },
      },
    ]

    for (const step of steps) {
      const jobKey = `${prospectId}:${step.jobProvider}:${runId}`
      await db.insert(enrichmentJobs).values({
        prospectId,
        provider: step.jobProvider,
        jobKey,
        status: 'running',
        startedAt: new Date(),
      })

      try {
        await step.run()
        await db
          .update(enrichmentJobs)
          .set({
            status: 'success',
            finishedAt: new Date(),
            error: null,
          })
          .where(eq(enrichmentJobs.jobKey, jobKey))
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        await db
          .update(enrichmentJobs)
          .set({
            status: 'failed',
            finishedAt: new Date(),
            error: message,
          })
          .where(eq(enrichmentJobs.jobKey, jobKey))
      }
    }

    let base = parseSections(dos[0]?.sections ?? {})
    base = mergeEnrichmentDraft(base, mergeInput)
    base = mergeAccountRowIntoSnapshot(base, acc[0])

    const newIds = await insertApolloContacts(
      prow[0].accountId,
      prow[0].workspaceId,
      mergeInput.apollo?.people,
    )
    if (newIds.length) {
      const dm = base.decision_makers ?? { contactIds: [] }
      base = {
        ...base,
        decision_makers: {
          ...dm,
          contactIds: [...(dm.contactIds ?? []), ...newIds].slice(0, 20),
        },
      }
    }

    if (dos[0]?.id) {
      await db
        .update(dossiers)
        .set({
          sections: base as unknown as Record<string, unknown>,
          updatedAt: new Date(),
        })
        .where(eq(dossiers.id, dos[0].id))
    } else {
      await db.insert(dossiers).values({
        prospectId,
        status: 'draft',
        version: 1,
        sections: base as unknown as Record<string, unknown>,
      })
    }

    return { ok: true }
  } catch (err) {
    console.error('[enrichment] runProspectEnrichment', err)
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'enrichment_failed',
    }
  }
}
