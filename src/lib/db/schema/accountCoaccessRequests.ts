import { index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { accounts } from './accounts'
import { authUsers } from './auth'
import { accountCoaccessStatus } from './enums'
import { pkUuid, timestamps } from './_columns'
import { workspaces } from './workspaces'

export const accountCoaccessRequests = pgTable(
  'account_coaccess_requests',
  {
    id: pkUuid(),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    accountId: uuid('account_id')
      .notNull()
      .references(() => accounts.id, { onDelete: 'cascade' }),
    requesterId: uuid('requester_id')
      .notNull()
      .references(() => authUsers.id, { onDelete: 'cascade' }),
    note: text('note'),
    status: accountCoaccessStatus('status').default('pending').notNull(),
    resolvedBy: uuid('resolved_by').references(() => authUsers.id, { onDelete: 'set null' }),
    resolvedAt: timestamp('resolved_at', { withTimezone: true }),
    ...timestamps(),
  },
  (t) => [
    index('account_coaccess_workspace_idx').on(t.workspaceId),
    index('account_coaccess_account_status_idx').on(t.accountId, t.status),
  ],
)
