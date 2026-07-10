import 'server-only'

import { db } from '@/lib/db/client'
import { fetchOrCacheJson } from '@/lib/enrichment/fetchOrCache'
import { incrementQuotaUsed } from '@/lib/enrichment/quotas'
import type { EnrichmentAccountContext, WaybackPayload } from '@/lib/enrichment/types'

const TTL_SECONDS = 30 * 24 * 3600

function hostFromWebsite(website: string | null): string | null {
  if (!website?.trim()) return null
  try {
    const u = website.startsWith('http') ? new URL(website) : new URL(`https://${website}`)
    return u.hostname.replace(/^www\./, '')
  } catch {
    return null
  }
}

export async function enrichWayback(ctx: EnrichmentAccountContext): Promise<WaybackPayload> {
  const host = hostFromWebsite(ctx.website)
  if (!host) {
    return { recentCaptures: [] }
  }

  const canonicalInput = { host }
  const { payload, fromCache } = await fetchOrCacheJson<WaybackPayload>({
    provider: 'wayback',
    canonicalInput,
    ttlSeconds: TTL_SECONDS,
    fetchFresh: async () => {
      await sleep(1000)
      const url = `https://web.archive.org/cdx/search/cdx?url=${encodeURIComponent(host)}/*&output=json&limit=5&collapse=digest`
      const res = await fetch(url, {
        headers: { 'User-Agent': '2mb-crm-enrichment/1.0' },
        signal: AbortSignal.timeout(30_000),
      })
      if (!res.ok) {
        return { recentCaptures: [], summaryNote: 'Wayback CDX request failed' }
      }
      const raw = (await res.json()) as unknown
      if (!Array.isArray(raw) || raw.length < 2) {
        return { recentCaptures: [] }
      }
      const header = raw[0] as string[]
      const tsIdx = header.indexOf('timestamp')
      const origIdx = header.indexOf('original')
      const rows = raw.slice(1) as string[][]
      const recentCaptures = rows
        .map((row) => ({
          timestamp: tsIdx >= 0 ? row[tsIdx] : '',
          url: origIdx >= 0 ? row[origIdx] : '',
        }))
        .filter((r) => r.timestamp && r.url)
      const summaryNote =
        recentCaptures.length > 0
          ? `Wayback has ${recentCaptures.length} recent capture(s) for ${host}.`
          : undefined
      return { recentCaptures, summaryNote }
    },
  })

  if (!fromCache) {
    await incrementQuotaUsed(db, 'wayback', 1)
  }

  return payload
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}
