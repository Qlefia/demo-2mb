import { bigint, jsonb, pgTable, uuid } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import { timestamps } from './_columns'
import { workspaces } from './workspaces'

/** General + Sales workspace settings (studio profile document per tenant). */
export const workspaceStudioSettings = pgTable('workspace_studio_settings', {
  workspaceId: uuid('workspace_id')
    .primaryKey()
    .references(() => workspaces.id, { onDelete: 'cascade' }),
  general: jsonb('general').notNull().default(sql`'{}'::jsonb`),
  sales: jsonb('sales').notNull().default(sql`'{}'::jsonb`),
  revision: bigint('revision', { mode: 'number' }).notNull().default(1),
  updatedBy: uuid('updated_by'),
  ...timestamps(),
})
