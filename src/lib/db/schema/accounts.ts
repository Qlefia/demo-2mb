import { sql } from 'drizzle-orm'
import {
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'
import { pkUuid, timestamps } from './_columns'
import { publicPrivate } from './enums'
import { workspaces } from './workspaces'

export const accounts = pgTable(
  'accounts',
  {
    id: pkUuid(),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'restrict' }),
    name: text('name').notNull(),
    legalForm: text('legal_form'),
    hqCountry: text('hq_country'),
    hqCity: text('hq_city'),
    mailingStreet: text('mailing_street'),
    mailingPostalCode: text('mailing_postal_code'),
    mailingLocality: text('mailing_locality'),
    mailingCountryCode: text('mailing_country_code'),
    employees: integer('employees'),
    foundedYear: integer('founded_year'),
    website: text('website'),
    publicPrivate: publicPrivate('public_private').default('unknown').notNull(),
    offices: jsonb('offices').notNull().default([]),
    billing: jsonb('billing').notNull().default({}),
    optOutAt: timestamp('opt_out_at', { withTimezone: true }),
    ...timestamps(),
  },
  (t) => [
    index('accounts_name_idx').on(t.name),
    uniqueIndex('accounts_website_unique')
      .on(t.website)
      .where(sql`${t.website} is not null`),
  ],
)
