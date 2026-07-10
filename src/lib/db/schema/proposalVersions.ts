import {
  integer,
  jsonb,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import { authUsers } from './auth'
import { proposals } from './proposals'
import { pkUuid } from './_columns'

export const proposalVersions = pgTable(
  'proposal_versions',
  {
    id: pkUuid(),
    proposalId: uuid('proposal_id')
      .notNull()
      .references(() => proposals.id, { onDelete: 'cascade' }),
    version: integer('version').notNull(),
    blocksDiff: jsonb('blocks_diff').default(sql`'{}'::jsonb`).notNull(),
    generatedAt: timestamp('generated_at', { withTimezone: true })
      .default(sql`now()`)
      .notNull(),
    generatedBy: uuid('generated_by').references(() => authUsers.id, {
      onDelete: 'set null',
    }),
  },
  (t) => [uniqueIndex('proposal_versions_proposal_version_unique').on(t.proposalId, t.version)],
)
