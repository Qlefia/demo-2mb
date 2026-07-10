import {
  index,
  jsonb,
  pgTable,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import { authUsers } from './auth'
import { prospects } from './prospects'
import { activityType } from './enums'
import { pkUuid } from './_columns'

export const activities = pgTable(
  'activities',
  {
    id: pkUuid(),
    prospectId: uuid('prospect_id')
      .notNull()
      .references(() => prospects.id, { onDelete: 'cascade' }),
    actorId: uuid('actor_id').references(() => authUsers.id, { onDelete: 'set null' }),
    type: activityType('type').notNull(),
    payload: jsonb('payload').default(sql`'{}'::jsonb`).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .default(sql`now()`)
      .notNull(),
  },
  (t) => [index('activities_prospect_id_created_at_idx').on(t.prospectId, t.createdAt.desc())],
)
