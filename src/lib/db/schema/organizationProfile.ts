import { pgTable, text, uuid } from 'drizzle-orm/pg-core'
import { timestamps } from './_columns'
import { workspaces } from './workspaces'

/** Legal sender profile for outbound proposals — one row per workspace. */
export const organizationProfile = pgTable('organization_profile', {
  workspaceId: uuid('workspace_id')
    .primaryKey()
    .references(() => workspaces.id, { onDelete: 'cascade' }),
  legalName: text('legal_name').notNull(),
  addressLine: text('address_line').notNull(),
  registerLine: text('register_line'),
  ...timestamps(),
})
