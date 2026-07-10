import { index, pgTable, text, uuid } from 'drizzle-orm/pg-core'
import { authUsers } from './auth'
import { prospects } from './prospects'
import { pkUuid, timestamps } from './_columns'

/** In-call Q&A: question typed by seller + optional answer (manual or future LLM). */
export const prospectSalesQa = pgTable(
  'prospect_sales_qa',
  {
    id: pkUuid(),
    prospectId: uuid('prospect_id')
      .notNull()
      .references(() => prospects.id, { onDelete: 'cascade' }),
    question: text('question').notNull(),
    answer: text('answer'),
    createdBy: uuid('created_by').references(() => authUsers.id, { onDelete: 'set null' }),
    ...timestamps(),
  },
  (t) => [index('prospect_sales_qa_prospect_idx').on(t.prospectId)],
)
