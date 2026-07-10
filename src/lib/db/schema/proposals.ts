import {
  index,
  integer,
  jsonb,
  pgTable,
  smallint,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import { authUsers } from './auth'
import { documentKind, proposalLanguage, proposalStatus } from './enums'
import { clientProjects } from './clientProjects'
import { prospects } from './prospects'
import { pkUuid, timestamps } from './_columns'

/** Commercial proposal deck per prospect (Phase 9). */
export const proposals = pgTable(
  'proposals',
  {
    id: pkUuid(),
    prospectId: uuid('prospect_id')
      .notNull()
      .references(() => prospects.id, { onDelete: 'cascade' }),
    documentKind: documentKind('document_kind').notNull().default('proposal'),
    title: text('title').notNull(),
    blocks: jsonb('blocks').default(sql`'[]'::jsonb`).notNull(),
    language: proposalLanguage('language').notNull().default('en'),
    version: integer('version').notNull().default(1),
    status: proposalStatus('status').notNull().default('draft'),
    /** Points at the version row that is currently published for external share/PDF. */
    publishedVersionId: uuid('published_version_id'),
    metadata: jsonb('metadata').default(sql`'{}'::jsonb`),
    issuedAt: timestamp('issued_at', { withTimezone: true }),
    validityDays: smallint('validity_days').notNull().default(3),
    projectName: text('project_name'),
    projectId: uuid('project_id').references(() => clientProjects.id, { onDelete: 'set null' }),
    createdBy: uuid('created_by').references(() => authUsers.id, { onDelete: 'set null' }),
    ...timestamps(),
  },
  (t) => [
    index('proposals_prospect_id_idx').on(t.prospectId),
    index('proposals_status_idx').on(t.status),
    index('proposals_document_kind_idx').on(t.documentKind),
    index('proposals_project_id_idx').on(t.projectId),
  ],
)
