import type { DossierSections } from '@/lib/dossiers/schema'

export const ENRICHMENT_PROVIDERS = [
  'apollo',
  'browse_ai',
  'newsapi',
  'wayback',
] as const

export type EnrichmentProviderId = (typeof ENRICHMENT_PROVIDERS)[number]

export interface EnrichmentAccountContext {
  prospectId: string
  accountId: string
  accountName: string
  website: string | null
}

export interface ApolloPersonRow {
  fullName: string
  role?: string
  email?: string
  phone?: string
  linkedinUrl?: string
}

export interface ApolloEnrichmentPayload {
  org?: {
    employees?: number
    industry?: string
    annualRevenue?: string
    hqCity?: string
    hqCountry?: string
    publicPrivate?: 'public' | 'private' | 'unknown'
  }
  people: ApolloPersonRow[]
  rawUsage?: Record<string, unknown>
}

export interface BrowseAiPayload {
  pageHints: string[]
  careersTooling: string[]
  agencyMentions: string[]
  degradedFromCheerio?: boolean
}

export interface NewsApiPayload {
  headlines: Array<{ title: string; url?: string; publishedAt?: string }>
}

export interface WaybackPayload {
  recentCaptures: Array<{ url: string; timestamp: string }>
  summaryNote?: string
}

/** Aggregated provider output merged into the dossier JSON blob */
export interface EnrichmentMergeInput {
  apollo?: ApolloEnrichmentPayload
  browseAi?: BrowseAiPayload
  newsapi?: NewsApiPayload
  wayback?: WaybackPayload
}

export function mergeEnrichmentDraft(
  base: DossierSections,
  input: EnrichmentMergeInput,
): DossierSections {
  const next: DossierSections = { ...base }

  if (input.apollo?.org) {
    const o = input.apollo.org
    const extra = [o.industry && `Industry (Apollo): ${o.industry}`, o.annualRevenue && `Revenue band (Apollo): ${o.annualRevenue}`]
      .filter(Boolean)
      .join('\n')
    next.snapshot = {
      ...(next.snapshot ?? {}),
      ...(o.employees != null ? { employees: o.employees } : {}),
      ...(o.hqCity ? { hqCity: o.hqCity } : {}),
      ...(o.hqCountry ? { hqCountry: o.hqCountry } : {}),
      ...(o.publicPrivate ? { publicPrivate: o.publicPrivate } : {}),
      notes: [next.snapshot?.notes, extra].filter(Boolean).join('\n').slice(0, 1000) || undefined,
    }
  }

  const signalItems = [...(next.signals?.items ?? [])]
  if (input.newsapi?.headlines.length) {
    for (const h of input.newsapi.headlines.slice(0, 10)) {
      const title = h.title.trim()
      if (title.length < 3) continue
      const dateOnly =
        typeof h.publishedAt === 'string' && h.publishedAt.length >= 10
          ? h.publishedAt.slice(0, 10)
          : undefined
      signalItems.push({
        text: title.slice(0, 1000),
        sourceUrl: h.url,
        occurredAt: dateOnly,
        type: 'press',
      })
    }
  }
  if (input.wayback?.summaryNote && input.wayback.summaryNote.trim().length >= 3) {
    signalItems.push({
      text: input.wayback.summaryNote.slice(0, 1000),
      type: 'wayback',
    })
  }
  if (input.browseAi?.agencyMentions.length) {
    for (const line of input.browseAi.agencyMentions.slice(0, 5)) {
      if (line.trim().length < 3) continue
      signalItems.push({ text: line.slice(0, 1000), type: 'site_audit' })
    }
  }
  if (signalItems.length > 0) {
    next.signals = { items: signalItems.slice(0, 20) }
  }

  if (input.browseAi) {
    const b = input.browseAi
    next.tech_clues = {
      ...(next.tech_clues ?? {}),
      ...(b.careersTooling.length ? { careersTooling: b.careersTooling.slice(0, 40) } : {}),
      ...(b.pageHints.length ? { visibleVendors: b.pageHints.slice(0, 40) } : {}),
      notes: [next.tech_clues?.notes, b.degradedFromCheerio ? 'Partial scrape (cheerio fallback)' : undefined]
        .filter(Boolean)
        .join('\n')
        .slice(0, 1000),
    }
    next.competitive = {
      ...(next.competitive ?? {}),
      notes: [next.competitive?.notes, ...b.agencyMentions].filter(Boolean).join('\n').slice(0, 1000),
    }
  }

  return next
}

/** CRM `accounts` row — fills snapshot gaps (Apollo never sends legal form / founded year here). */
export type AccountSnapshotSource = {
  legalForm?: string | null
  hqCountry?: string | null
  hqCity?: string | null
  employees?: number | null
  foundedYear?: number | null
  publicPrivate?: 'public' | 'private' | 'unknown' | null
}

export function mergeAccountRowIntoSnapshot(
  sections: DossierSections,
  account: AccountSnapshotSource | undefined,
): DossierSections {
  if (!account) return sections

  const snap = sections.snapshot ?? {}
  const nextSnap = { ...snap }
  const missingStr = (v: unknown) => v == null || (typeof v === 'string' && v.trim() === '')

  if (missingStr(nextSnap.legalForm) && account.legalForm?.trim()) {
    nextSnap.legalForm = account.legalForm.trim()
  }
  if (missingStr(nextSnap.hqCity) && account.hqCity?.trim()) {
    nextSnap.hqCity = account.hqCity.trim()
  }
  if (missingStr(nextSnap.hqCountry) && account.hqCountry?.trim()) {
    nextSnap.hqCountry = account.hqCountry.trim()
  }
  if (nextSnap.employees == null && account.employees != null && account.employees >= 1) {
    nextSnap.employees = account.employees
  }
  if (nextSnap.foundedYear == null && account.foundedYear != null) {
    nextSnap.foundedYear = account.foundedYear
  }
  if (
    (nextSnap.publicPrivate == null || nextSnap.publicPrivate === 'unknown') &&
    account.publicPrivate &&
    account.publicPrivate !== 'unknown'
  ) {
    nextSnap.publicPrivate = account.publicPrivate
  }

  return { ...sections, snapshot: nextSnap }
}
