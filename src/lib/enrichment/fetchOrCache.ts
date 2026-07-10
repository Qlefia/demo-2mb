import 'server-only'

import { and, eq, sql } from 'drizzle-orm'
import { db, type Database } from '@/lib/db/client'
import { enrichmentCache } from '@/lib/db/schema'
import { queryHash } from '@/lib/enrichment/canonicalHash'

export async function fetchOrCacheJson<T>(params: {
  db?: Database
  provider: string
  canonicalInput: Record<string, unknown>
  ttlSeconds: number
  fetchFresh: () => Promise<T>
}): Promise<{ payload: T; fromCache: boolean }> {
  const conn = params.db ?? db
  const qh = queryHash(params.provider, params.canonicalInput)
  const rows = await conn
    .select()
    .from(enrichmentCache)
    .where(
      and(eq(enrichmentCache.provider, params.provider), eq(enrichmentCache.queryHash, qh)),
    )
    .limit(1)

  const hit = rows[0]
  const now = Date.now()
  if (hit) {
    const fetchedMs = new Date(hit.fetchedAt).getTime()
    if (fetchedMs + hit.ttlSeconds * 1000 > now) {
      return { payload: hit.payload as T, fromCache: true }
    }
  }

  const payload = await params.fetchFresh()
  const asJson = payload as unknown
  await conn
    .insert(enrichmentCache)
    .values({
      provider: params.provider,
      queryHash: qh,
      payload: asJson,
      ttlSeconds: params.ttlSeconds,
    })
    .onConflictDoUpdate({
      target: [enrichmentCache.provider, enrichmentCache.queryHash],
      set: {
        payload: asJson,
        ttlSeconds: params.ttlSeconds,
        fetchedAt: sql`now()`,
      },
    })

  return { payload, fromCache: false }
}
