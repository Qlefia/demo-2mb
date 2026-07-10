import { index, numeric, pgTable, text, uuid } from 'drizzle-orm/pg-core'
import { clientProjects } from './clientProjects'
import { prospects } from './prospects'
import { dealStage } from './enums'
import { pkUuid, timestamps } from './_columns'

export const deals = pgTable(
  'deals',
  {
    id: pkUuid(),
    prospectId: uuid('prospect_id')
      .notNull()
      .references(() => prospects.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    value: numeric('value', { precision: 14, scale: 2 }),
    currency: text('currency').notNull().default('EUR'),
    stage: dealStage('stage').notNull().default('open'),
    projectId: uuid('project_id').references(() => clientProjects.id, { onDelete: 'set null' }),
    ...timestamps(),
  },
  (t) => [
    index('deals_prospect_id_idx').on(t.prospectId),
    index('deals_project_id_idx').on(t.projectId),
  ],
)
