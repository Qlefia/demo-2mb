import { pgTable, primaryKey, uuid } from 'drizzle-orm/pg-core'
import { authUsers } from './auth'
import { workspaceMemberRole } from './enums'
import { timestamps } from './_columns'
import { workspaces } from './workspaces'

export const workspaceMembers = pgTable(
  'workspace_members',
  {
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => authUsers.id, { onDelete: 'cascade' }),
    role: workspaceMemberRole('role').notNull(),
    ...timestamps(),
  },
  (t) => [primaryKey({ columns: [t.workspaceId, t.userId] })],
)
