import { pgTable, text } from 'drizzle-orm/pg-core'
import { pkUuid, timestamps } from './_columns'

export const workspaces = pgTable('workspaces', {
  id: pkUuid(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  ...timestamps(),
})
