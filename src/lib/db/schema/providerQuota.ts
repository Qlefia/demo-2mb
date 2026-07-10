import {
  date,
  index,
  integer,
  pgTable,
  text,
  uniqueIndex,
} from 'drizzle-orm/pg-core'
import { pkUuid, timestamps } from './_columns'

export const providerQuota = pgTable(
  'provider_quota',
  {
    id: pkUuid(),
    provider: text('provider').notNull(),
    bucketDate: date('bucket_date', { mode: 'date' }).notNull(),
    used: integer('used').notNull().default(0),
    limitCap: integer('limit_cap'),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex('provider_quota_provider_bucket_unique').on(t.provider, t.bucketDate),
    index('provider_quota_bucket_date_idx').on(t.bucketDate),
  ],
)
