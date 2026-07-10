import { index, pgTable, smallint, timestamp, uuid } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import { authUsers } from './auth'
import { prospects } from './prospects'

export const MAX_USER_PROSPECT_PINS = 8

export const userProspectPins = pgTable(
  'user_prospect_pins',
  {
    userId: uuid('user_id')
      .notNull()
      .references(() => authUsers.id, { onDelete: 'cascade' }),
    prospectId: uuid('prospect_id')
      .notNull()
      .references(() => prospects.id, { onDelete: 'cascade' }),
    sortOrder: smallint('sort_order').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true })
      .default(sql`now()`)
      .notNull(),
  },
  (t) => [
    index('user_prospect_pins_user_sort_idx').on(t.userId, t.sortOrder),
  ],
)
