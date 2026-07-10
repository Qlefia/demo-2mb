import { index, numeric, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { prospects } from './prospects'
import { workspaces } from './workspaces'
import { clientProjectStatus, lostReason } from './enums'
import { pkUuid, timestamps } from './_columns'

/** Commercial project on a prospect — offers, deals, and invoices attach here. */
export const clientProjects = pgTable(
  'client_projects',
  {
    id: pkUuid(),
    prospectId: uuid('prospect_id')
      .notNull()
      .references(() => prospects.id, { onDelete: 'cascade' }),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    description: text('description'),
    status: clientProjectStatus('status').notNull().default('discovered'),
    currency: text('currency').notNull().default('EUR'),
    estimatedValue: numeric('estimated_value', { precision: 14, scale: 2 }),
    /** FK enforced in SQL migration — avoids circular Drizzle imports. */
    acceptedOfferId: uuid('accepted_offer_id'),
    dealId: uuid('deal_id'),
    wonAt: timestamp('won_at', { withTimezone: true }),
    lostAt: timestamp('lost_at', { withTimezone: true }),
    lostReason: lostReason('lost_reason'),
    ...timestamps(),
  },
  (t) => [
    index('client_projects_prospect_id_idx').on(t.prospectId),
    index('client_projects_workspace_id_idx').on(t.workspaceId),
    index('client_projects_status_idx').on(t.status),
  ],
)
