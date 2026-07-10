import {
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import { prospects } from './prospects'
import { enrichmentJobStatus } from './enums'
import { pkUuid } from './_columns'

export const enrichmentJobs = pgTable(
  'enrichment_jobs',
  {
    id: pkUuid(),
    prospectId: uuid('prospect_id')
      .notNull()
      .references(() => prospects.id, { onDelete: 'cascade' }),
    provider: text('provider').notNull(),
    jobKey: text('job_key').notNull(),
    status: enrichmentJobStatus('status').default('queued').notNull(),
    startedAt: timestamp('started_at', { withTimezone: true }),
    finishedAt: timestamp('finished_at', { withTimezone: true }),
    error: text('error'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .default(sql`now()`)
      .notNull(),
  },
  (t) => [
    uniqueIndex('enrichment_jobs_job_key_unique').on(t.jobKey),
    index('enrichment_jobs_prospect_id_idx').on(t.prospectId),
    index('enrichment_jobs_status_idx').on(t.status),
  ],
)
