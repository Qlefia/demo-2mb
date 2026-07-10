import 'server-only'

import { db } from '@/lib/db/client'
import { fetchOrCacheJson } from '@/lib/enrichment/fetchOrCache'
import { getQuotaRow, incrementQuotaUsed, quotaDefaults } from '@/lib/enrichment/quotas'
import type { EnrichmentAccountContext, NewsApiPayload } from '@/lib/enrichment/types'

const TTL_SECONDS = 24 * 3600

function domainHost(website: string | null | undefined): string | null {
  if (!website?.trim()) return null
  try {
    const u = website.startsWith('http') ? new URL(website) : new URL(`https://${website}`)
    return u.hostname.replace(/^www\./, '').toLowerCase()
  } catch {
    return null
  }
}

function brandTokens(accountName: string, host: string | null): string[] {
  const set = new Set<string>()
  const cleaned = accountName.replace(/\s+(SE|AG|GmbH|LLC|Ltd\.?|Inc\.?|S\.A\.|N\.V\.)$/i, '').trim()
  const first = cleaned.split(/\s+/)[0]
  if (first && first.length >= 2) set.add(first.toLowerCase())
  if (host) {
    const base = host.split('.').filter(Boolean)[0]
    if (base && base.length >= 2) set.add(base.toLowerCase())
  }
  return [...set]
}

function articleRelevant(
  title: string,
  description: string | undefined,
  tokens: string[],
): boolean {
  if (tokens.length === 0) return true
  const blob = `${title} ${description ?? ''}`.toLowerCase()
  return tokens.some((t) => blob.includes(t))
}

export async function enrichNewsApi(ctx: EnrichmentAccountContext): Promise<NewsApiPayload> {
  const apiKey = process.env.NEWSAPI_API_KEY?.trim()
  if (!apiKey) {
    return { headlines: [] }
  }

  const limit = quotaDefaults('newsapi', process.env) ?? 100
  const row = await getQuotaRow(db, 'newsapi')
  const used = row?.used ?? 0
  if (used >= limit) {
    return { headlines: [] }
  }

  const host = domainHost(ctx.website)
  const canonicalInput = {
    q: ctx.accountName,
    domainHost: host ?? '',
    fromDays: 30,
    scope: 'brand_filtered_v2_domains',
  }

  const { payload, fromCache } = await fetchOrCacheJson<NewsApiPayload>({
    provider: 'newsapi',
    canonicalInput,
    ttlSeconds: TTL_SECONDS,
    fetchFresh: async () => {
      const from = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString().slice(0, 10)
      const qRaw = host
        ? `"${ctx.accountName}" AND ${host.split('.')[0]}`
        : `${ctx.accountName}`
      const q = encodeURIComponent(qRaw)
      const domainsParam = host ? `&domains=${encodeURIComponent(host)}` : ''
      const url = `https://newsapi.org/v2/everything?q=${q}&from=${from}&sortBy=publishedAt&pageSize=30${domainsParam}`
      const res = await fetch(url, {
        headers: { 'X-Api-Key': apiKey },
        signal: AbortSignal.timeout(20_000),
      })
      const raw = (await res.json()) as {
        articles?: Array<Record<string, unknown>>
        status?: string
        message?: string
      }
      if (!res.ok) {
        throw new Error(raw.message ?? `newsapi http ${res.status}`)
      }
      if (raw.status === 'error') {
        return { headlines: [] }
      }
      const articles = raw.articles ?? []
      const tokens = brandTokens(ctx.accountName, host)
      const filtered = articles.filter((a) => {
        const title = typeof a.title === 'string' ? a.title : ''
        const desc = typeof a.description === 'string' ? a.description : undefined
        return articleRelevant(title, desc, tokens)
      })
      const pool = filtered.length > 0 ? filtered : articles
      const headlines = pool.slice(0, 10).map((a) => ({
        title: typeof a.title === 'string' ? a.title : 'Headline',
        url: typeof a.url === 'string' ? a.url : undefined,
        publishedAt: typeof a.publishedAt === 'string' ? a.publishedAt : undefined,
      }))
      return { headlines }
    },
  })

  if (!fromCache) {
    await incrementQuotaUsed(db, 'newsapi', 1, { limitCap: limit })
  }

  return payload
}
