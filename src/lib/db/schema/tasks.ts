import {
  index,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import { authUsers } from './auth'
import { playbooks } from './playbooks'
import { prospects } from './prospects'
import { taskStatus } from './enums'
import { pkUuid } from './_columns'

export const tasks = pgTable(
  'tasks',
  {
    id: pkUuid(),
    prospectId: uuid('prospect_id').references(() => prospects.id, {
      onDelete: 'cascade',
    }),
    assigneeId: uuid('assignee_id')
      .notNull()
      .references(() => authUsers.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    status: taskStatus('status').default('open').notNull(),
    dueAt: timestamp('due_at', { withTimezone: true }),
    playbookId: uuid('playbook_id').references(() => playbooks.id, {
      onDelete: 'set null',
    }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .default(sql`now()`)
      .notNull(),
    completedAt: timestamp('completed_at', { withTimezone: true }),
  },
  (t) => [
    index('tasks_assignee_status_idx').on(t.assigneeId, t.status),
    index('tasks_prospect_id_idx').on(t.prospectId),
    index('tasks_due_at_idx').on(t.dueAt),
  ],
)
