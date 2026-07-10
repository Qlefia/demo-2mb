import 'server-only'

import * as cheerio from 'cheerio'
import { db } from '@/lib/db/client'
import { fetchOrCacheJson } from '@/lib/enrichment/fetchOrCache'
import { incrementQuotaUsed } from '@/lib/enrichment/quotas'
import type { BrowseAiPayload, EnrichmentAccountContext } from '@/lib/enrichment/types'

const TTL_SECONDS = 7 * 24 * 3600

function siteUrl(website: string | null): string | null {
  if (!website?.trim()) return null
  const w = website.trim()
  try {
    return w.startsWith('http') ? new URL(w).origin : new URL(`https://${w}`).origin
  } catch {
    return null
  }
}

async function cheerioAudit(origin: string): Promise<BrowseAiPayload> {
  const res = await fetch(origin, {
    headers: {
      'User-Agent': '2mb-crm-enrichment/1.0',
      Accept: 'text/html',
    },
    signal: AbortSignal.timeout(25_000),
  })
  if (!res.ok) {
    return { pageHints: [], careersTooling: [], agencyMentions: [], degradedFromCheerio: true }
  }
  const html = await res.text()
  const $ = cheerio.load(html)
  const text = $('body').text()
  const agencyMentions: string[] = []
  if (/(agency|agentur|boutique)/i.test(text)) {
    agencyMentions.push('Site copy references agency-style positioning.')
  }
  const careersTooling: string[] = []
  if (/greenhouse|lever|workday|personio|ashby/i.test(html)) {
    careersTooling.push('ATS / careers tooling detected in HTML')
  }
  const pageHints: string[] = []
  $('script[src]').each((_, el) => {
    const src = $(el).attr('src')
    if (src && /google-analytics|gtag|hubspot|pardot|marketo/i.test(src)) {
      pageHints.push(`Script vendor hint: ${src.slice(0, 120)}`)
    }
  })
  return {
    pageHints: pageHints.slice(0, 15),
    careersTooling,
    agencyMentions,
    degradedFromCheerio: true,
  }
}

export async function enrichBrowseAi(ctx: EnrichmentAccountContext): Promise<BrowseAiPayload> {
  const origin = siteUrl(ctx.website)
  if (!origin) {
    return { pageHints: [], careersTooling: [], agencyMentions: [] }
  }

  const { payload, fromCache } = await fetchOrCacheJson<BrowseAiPayload>({
    provider: 'browse_ai',
    canonicalInput: { origin },
    ttlSeconds: TTL_SECONDS,
    fetchFresh: () => cheerioAudit(origin),
  })

  if (!fromCache) {
    await incrementQuotaUsed(db, 'browse_ai', 1)
  }

  return payload
}
