import {
  integer,
  jsonb,
  pgTable,
  text,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'
import { pkUuid, timestamps } from './_columns'
import { workspaces } from './workspaces'

export const playbooks = pgTable(
  'playbooks',
  {
    id: pkUuid(),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    language: text('language').notNull(),
    kind: text('kind').default('first_touch').notNull(),
    summary: text('summary').default('').notNull(),
    sections: jsonb('sections').$type<Record<string, string>>().default({}).notNull(),
    body: text('body').notNull(),
    version: integer('version').default(1).notNull(),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex('playbooks_workspace_name_lang_version_unique').on(
      t.workspaceId,
      t.name,
      t.language,
      t.version,
    ),
  ],
)
