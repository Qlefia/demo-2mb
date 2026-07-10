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
import { playbooks } from './playbooks'
import { prospects } from './prospects'
import { dossierStatus } from './enums'
import { pkUuid, timestamps } from './_columns'

export const dossiers = pgTable(
  'dossiers',
  {
    id: pkUuid(),
    prospectId: uuid('prospect_id')
      .notNull()
      .references(() => prospects.id, { onDelete: 'cascade' }),
    status: dossierStatus('status').default('draft').notNull(),
    version: integer('version').default(1).notNull(),
    sections: jsonb('sections').default(sql`'{}'::jsonb`).notNull(),
    aiMetadata: jsonb('ai_metadata'),
    suggestedPlaybookId: uuid('suggested_playbook_id').references(() => playbooks.id, {
      onDelete: 'set null',
    }),
    reviewedBy: uuid('reviewed_by').references(() => authUsers.id, {
      onDelete: 'set null',
    }),
    reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
    ...timestamps(),
  },
  (t) => [uniqueIndex('dossiers_prospect_id_unique').on(t.prospectId)],
)
