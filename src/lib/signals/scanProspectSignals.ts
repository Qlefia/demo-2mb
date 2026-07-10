import 'server-only'

import { createHash } from 'node:crypto'
import { asc, eq, notInArray, sql } from 'drizzle-orm'
import type { Database } from '@/lib/db/client'
import { accounts, prospects, triggers } from '@/lib/db/schema'
import { enrichApollo } from '@/lib/enrichment/providers/apollo'
import { enrichNewsApi } from '@/lib/enrichment/providers/news'
import type { EnrichmentAccountContext } from '@/lib/enrichment/types'
import { extractSignalsFromNews } from '@/lib/signals/extractSignalsLlm'
import { createTriggerInTx } from '@/lib/triggers/createTriggerInTx'

export const SIGNAL_SCAN_ALL_CAP = 25

export interface SignalScanPreview {
  prospectId: string
  accountName: string
  text: string
  triggerId: string
}

export interface SignalScanError {
  prospectId: string
  accountName: string
  message: string
}

export interface SignalScanResult {
  scanned: number
  newTriggers: number
  skipped: number
  previews: SignalScanPreview[]
  errors: SignalScanError[]
}

interface ScanTarget {
  prospectId: string
  accountId: string
  accountName: string
  website: string | null
}

function dedupeKey(text: string, sourceUrl: string | null | undefined): string {
  const norm = `${text.trim().toLowerCase()}|${(sourceUrl ?? '').trim().toLowerCase()}`
  return createHash('sha256').update(norm).digest('hex')
}

async function loadExistingDedupeKeys(tx: Database, accountId: string): Promise<Set<string>> {
  const rows = await tx
    .select({
      text: sql<string>`coalesce(${triggers.payload} ->> 'text', '')`,
      sourceUrl: triggers.sourceUrl,
    })
    .from(triggers)
    .where(eq(triggers.accountId, accountId))

  const keys = new Set<string>()
  for (const row of rows) {
    keys.add(dedupeKey(row.text, row.sourceUrl))
  }
  return keys
}

async function resolveScanTargets(
  tx: Database,
  scope: 'all' | 'one',
  prospectId: string | undefined,
): Promise<ScanTarget[]> {
  if (scope === 'one') {
    if (!prospectId) return []
    const rows = await tx
      .select({
        prospectId: prospects.id,
        accountId: prospects.accountId,
        accountName: accounts.name,
        website: accounts.website,
      })
      .from(prospects)
      .innerJoin(accounts, eq(accounts.id, prospects.accountId))
      .where(eq(prospects.id, prospectId))
      .limit(1)
    return rows.map((r) => ({
      prospectId: r.prospectId,
      accountId: r.accountId,
      accountName: r.accountName,
      website: r.website,
    }))
  }

  const rows = await tx
    .select({
      prospectId: prospects.id,
      accountId: prospects.accountId,
      accountName: accounts.name,
      website: accounts.website,
    })
    .from(prospects)
    .innerJoin(accounts, eq(accounts.id, prospects.accountId))
    .where(notInArray(prospects.stage, ['won', 'lost']))
    .orderBy(asc(prospects.updatedAt))
    .limit(SIGNAL_SCAN_ALL_CAP)

  return rows.map((r) => ({
    prospectId: r.prospectId,
    accountId: r.accountId,
    accountName: r.accountName,
    website: r.website,
  }))
}

async function scanOneProspect(
  tx: Database,
  target: ScanTarget,
): Promise<{ newCount: number; skipped: number; previews: SignalScanPreview[]; error?: string }> {
  const ctx: EnrichmentAccountContext = {
    prospectId: target.prospectId,
    accountId: target.accountId,
    accountName: target.accountName,
    website: target.website,
  }

  const [news, apollo] = await Promise.all([enrichNewsApi(ctx), enrichApollo(ctx)])

  const orgSummary =
    apollo.org?.industry || apollo.org?.employees
      ? [
          apollo.org.industry,
          apollo.org.employees != null ? `${apollo.org.employees} employees` : null,
          apollo.org.hqCity,
        ]
          .filter(Boolean)
          .join(' · ')
      : null

  const candidates = await extractSignalsFromNews({
    accountName: target.accountName,
    website: target.website,
    news,
    apolloOrgSummary: orgSummary,
  })

  const existingKeys = await loadExistingDedupeKeys(tx, target.accountId)
  let newCount = 0
  let skipped = 0
  const previews: SignalScanPreview[] = []

  for (const signal of candidates) {
    const key = dedupeKey(signal.text, signal.sourceUrl ?? null)
    if (existingKeys.has(key)) {
      skipped += 1
      continue
    }

    const created = await createTriggerInTx(tx, {
      prospectId: target.prospectId,
      text: signal.text,
      sourceUrl: signal.sourceUrl ?? null,
      type: 'news_scan',
    })

    if (!created.ok) {
      skipped += 1
      continue
    }

    existingKeys.add(key)
    newCount += 1
    previews.push({
      prospectId: target.prospectId,
      accountName: target.accountName,
      text: signal.text,
      triggerId: created.triggerId,
    })
  }

  if (candidates.length === 0 && news.headlines.length === 0) {
    return { newCount: 0, skipped: 0, previews, error: 'no_news' }
  }

  return { newCount, skipped, previews }
}

export async function runSignalScan(
  tx: Database,
  scope: 'all' | 'one',
  prospectId: string | undefined,
): Promise<SignalScanResult> {
  const targets = await resolveScanTargets(tx, scope, prospectId)

  if (scope === 'one' && targets.length === 0) {
    return {
      scanned: 0,
      newTriggers: 0,
      skipped: 0,
      previews: [],
      errors: [{ prospectId: prospectId ?? '', accountName: '—', message: 'prospect_not_found' }],
    }
  }

  let newTriggers = 0
  let skipped = 0
  const previews: SignalScanPreview[] = []
  const errors: SignalScanError[] = []

  for (const target of targets) {
    try {
      const result = await scanOneProspect(tx, target)
      newTriggers += result.newCount
      skipped += result.skipped
      previews.push(...result.previews)
      if (result.error && result.error !== 'no_news') {
        errors.push({
          prospectId: target.prospectId,
          accountName: target.accountName,
          message: result.error,
        })
      }
    } catch (err) {
      errors.push({
        prospectId: target.prospectId,
        accountName: target.accountName,
        message: err instanceof Error ? err.message : 'scan_failed',
      })
    }
  }

  return {
    scanned: targets.length,
    newTriggers,
    skipped,
    previews,
    errors,
  }
}

export function getSignalScanKeysStatus(): {
  apollo: boolean
  newsapi: boolean
  anthropic: boolean
} {
  return {
    apollo: Boolean(process.env.APOLLO_API_KEY?.trim()),
    newsapi: Boolean(process.env.NEWSAPI_API_KEY?.trim()),
    anthropic: Boolean(process.env.ANTHROPIC_API_KEY?.trim()),
  }
}
