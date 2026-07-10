import {
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import { accounts } from './accounts'
import { prospects } from './prospects'
import { workspaces } from './workspaces'
import { pkUuid } from './_columns'

export const triggers = pgTable(
  'triggers',
  {
    id: pkUuid(),
    accountId: uuid('account_id')
      .notNull()
      .references(() => accounts.id, { onDelete: 'cascade' }),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'restrict' }),
    prospectId: uuid('prospect_id').references(() => prospects.id, {
      onDelete: 'set null',
    }),
    type: text('type').notNull(),
    sourceUrl: text('source_url'),
    occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull(),
    payload: jsonb('payload').default(sql`'{}'::jsonb`).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .default(sql`now()`)
      .notNull(),
  },
  (t) => [
    index('triggers_account_id_idx').on(t.accountId),
    index('triggers_workspace_id_idx').on(t.workspaceId),
    index('triggers_prospect_id_idx').on(t.prospectId),
    index('triggers_occurred_at_idx').on(t.occurredAt),
  ],
)
