import {
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import { pkUuid } from './_columns'

export const enrichmentCache = pgTable(
  'enrichment_cache',
  {
    id: pkUuid(),
    provider: text('provider').notNull(),
    queryHash: text('query_hash').notNull(),
    payload: jsonb('payload').default(sql`'{}'::jsonb`).notNull(),
    fetchedAt: timestamp('fetched_at', { withTimezone: true })
      .default(sql`now()`)
      .notNull(),
    ttlSeconds: integer('ttl_seconds').notNull(),
  },
  (t) => [
    uniqueIndex('enrichment_cache_provider_query_hash_unique').on(t.provider, t.queryHash),
    index('enrichment_cache_fetched_at_idx').on(t.fetchedAt),
  ],
)
