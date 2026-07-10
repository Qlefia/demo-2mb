import {
  index,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core'
import { accounts } from './accounts'
import { workspaces } from './workspaces'
import { citext, pkUuid, timestamps } from './_columns'

export const contacts = pgTable(
  'contacts',
  {
    id: pkUuid(),
    accountId: uuid('account_id')
      .notNull()
      .references(() => accounts.id, { onDelete: 'cascade' }),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'restrict' }),
    fullName: text('full_name').notNull(),
    role: text('role'),
    email: citext('email'),
    phone: text('phone'),
    linkedinUrl: text('linkedin_url'),
    languages: text('languages').array(),
    optOutAt: timestamp('opt_out_at', { withTimezone: true }),
    sourceProvider: text('source_provider'),
    sourceFetchedAt: timestamp('source_fetched_at', { withTimezone: true }),
    ...timestamps(),
  },
  (t) => [
    index('contacts_account_id_idx').on(t.accountId),
    index('contacts_workspace_id_idx').on(t.workspaceId),
    index('contacts_email_idx').on(t.email),
  ],
)
