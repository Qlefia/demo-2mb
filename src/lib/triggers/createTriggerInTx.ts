import 'server-only'

import { eq, sql } from 'drizzle-orm'
import type { Database } from '@/lib/db/client'
import { prospects, triggers } from '@/lib/db/schema'

export interface CreateTriggerInput {
  prospectId: string
  text: string
  sourceUrl?: string | null
  type?: string
  occurredAt?: Date | null
}

export async function createTriggerInTx(
  tx: Database,
  input: CreateTriggerInput,
): Promise<{ ok: true; triggerId: string } | { ok: false; error: 'prospect_not_found' }> {
  const row = await tx
    .select({ accountId: prospects.accountId, workspaceId: prospects.workspaceId })
    .from(prospects)
    .where(eq(prospects.id, input.prospectId))
    .limit(1)

  if (row.length === 0) {
    return { ok: false, error: 'prospect_not_found' }
  }

  const [{ id: triggerId }] = await tx
    .insert(triggers)
    .values({
      accountId: row[0].accountId,
      workspaceId: row[0].workspaceId,
      prospectId: input.prospectId,
      type: input.type ?? 'manual',
      sourceUrl: input.sourceUrl ?? null,
      occurredAt: input.occurredAt ?? (sql`now()` as unknown as Date),
      payload: { text: input.text },
    })
    .returning({ id: triggers.id })

  return { ok: true, triggerId }
}
