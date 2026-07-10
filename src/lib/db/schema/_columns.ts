import { sql } from 'drizzle-orm'
import { customType, timestamp, uuid } from 'drizzle-orm/pg-core'

export const citext = customType<{ data: string; driverData: string }>({
  dataType() {
    return 'citext'
  },
})

export function pkUuid() {
  return uuid('id').primaryKey().default(sql`gen_random_uuid()`)
}

export function timestamps() {
  return {
    createdAt: timestamp('created_at', { withTimezone: true })
      .default(sql`now()`)
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .default(sql`now()`)
      .notNull(),
  }
}
