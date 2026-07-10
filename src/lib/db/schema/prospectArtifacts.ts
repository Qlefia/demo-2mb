import { index, integer, pgTable, text, uuid, type AnyPgColumn } from 'drizzle-orm/pg-core'
import { authUsers } from './auth'
import { prospectArtifactKind } from './enums'
import { prospects } from './prospects'
import { pkUuid, timestamps } from './_columns'

/** Ops research artifacts: folders, screenshots, links, notes scoped to a prospect. */
export const prospectArtifacts = pgTable(
  'prospect_artifacts',
  {
    id: pkUuid(),
    prospectId: uuid('prospect_id')
      .notNull()
      .references(() => prospects.id, { onDelete: 'cascade' }),
    parentId: uuid('parent_id').references((): AnyPgColumn => prospectArtifacts.id, {
      onDelete: 'cascade',
    }),
    kind: prospectArtifactKind('kind').notNull(),
    title: text('title').notNull(),
    body: text('body'),
    url: text('url'),
    storagePath: text('storage_path'),
    imagePaths: text('image_paths').array().default([]).notNull(),
    mimeType: text('mime_type'),
    sortOrder: integer('sort_order').default(0).notNull(),
    createdBy: uuid('created_by').references(() => authUsers.id, { onDelete: 'set null' }),
    ...timestamps(),
  },
  (t) => [
    index('prospect_artifacts_prospect_idx').on(t.prospectId),
    index('prospect_artifacts_parent_idx').on(t.parentId),
    index('prospect_artifacts_prospect_parent_idx').on(t.prospectId, t.parentId),
  ],
)
