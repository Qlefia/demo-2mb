import 'server-only'

import { sql } from 'drizzle-orm'
import { eq, and } from 'drizzle-orm'
import type { Database } from '@/lib/db/client'
import { providerQuota } from '@/lib/db/schema'

export function utcCalendarDate(): Date {
  const n = new Date()
  return new Date(Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), n.getUTCDate()))
}

export async function getQuotaRow(
  tx: Database,
  provider: string,
  bucketDate: Date = utcCalendarDate(),
) {
  const rows = await tx
    .select()
    .from(providerQuota)
    .where(and(eq(providerQuota.provider, provider), eq(providerQuota.bucketDate, bucketDate)))
    .limit(1)
  return rows[0] ?? null
}

/** Increments `used` for the UTC calendar bucket (upsert). */
export async function incrementQuotaUsed(
  tx: Database,
  provider: string,
  amount: number,
  opts?: { limitCap?: number | null },
) {
  const bucketDate = utcCalendarDate()
  const limitCap = opts?.limitCap

  await tx
    .insert(providerQuota)
    .values({
      provider,
      bucketDate,
      used: amount,
      limitCap: limitCap ?? null,
    })
    .onConflictDoUpdate({
      target: [providerQuota.provider, providerQuota.bucketDate],
      set: {
        used: sql`${providerQuota.used} + ${amount}`,
        updatedAt: sql`now()`,
        ...(limitCap != null ? { limitCap } : {}),
      },
    })
}

export function quotaDefaults(provider: string, env: NodeJS.ProcessEnv): number | null {
  switch (provider) {
    case 'newsapi':
      return env.NEWSAPI_DAILY_LIMIT ? Number(env.NEWSAPI_DAILY_LIMIT) : 100
    case 'apollo':
      return env.APOLLO_DAILY_LIMIT ? Number(env.APOLLO_DAILY_LIMIT) : null
    case 'phantom_buster':
      return env.PHANTOMBUSTER_DAILY_LIMIT ? Number(env.PHANTOMBUSTER_DAILY_LIMIT) : 50
    default:
      return null
  }
}
