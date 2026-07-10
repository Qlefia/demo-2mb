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
import { dossiers } from './dossiers'
import { pkUuid } from './_columns'

export const dossierVersions = pgTable(
  'dossier_versions',
  {
    id: pkUuid(),
    dossierId: uuid('dossier_id')
      .notNull()
      .references(() => dossiers.id, { onDelete: 'cascade' }),
    version: integer('version').notNull(),
    sectionsDiff: jsonb('sections_diff').default(sql`'{}'::jsonb`).notNull(),
    generatedAt: timestamp('generated_at', { withTimezone: true })
      .default(sql`now()`)
      .notNull(),
    generatedBy: uuid('generated_by').references(() => authUsers.id, {
      onDelete: 'set null',
    }),
  },
  (t) => [uniqueIndex('dossier_versions_dossier_version_unique').on(t.dossierId, t.version)],
)
