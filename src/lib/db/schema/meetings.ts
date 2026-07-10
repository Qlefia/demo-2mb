import { index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { authUsers } from './auth'
import { contacts } from './contacts'
import { meetingStatus } from './enums'
import { prospects } from './prospects'
import { pkUuid, timestamps } from './_columns'

export const meetings = pgTable(
  'meetings',
  {
    id: pkUuid(),
    prospectId: uuid('prospect_id')
      .notNull()
      .references(() => prospects.id, { onDelete: 'cascade' }),
    contactId: uuid('contact_id').references(() => contacts.id, { onDelete: 'set null' }),
    organiserId: uuid('organiser_id')
      .notNull()
      .references(() => authUsers.id, { onDelete: 'cascade' }),
    assigneeId: uuid('assignee_id')
      .notNull()
      .references(() => authUsers.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    startsAt: timestamp('starts_at', { withTimezone: true }).notNull(),
    endsAt: timestamp('ends_at', { withTimezone: true }),
    location: text('location'),
    status: meetingStatus('status').notNull().default('scheduled'),
    notes: text('notes'),
    externalSource: text('external_source'),
    externalId: text('external_id'),
    ...timestamps(),
  },
  (t) => [
    index('meetings_prospect_id_idx').on(t.prospectId),
    index('meetings_starts_at_idx').on(t.startsAt),
    index('meetings_prospect_status_starts_idx').on(t.prospectId, t.status, t.startsAt),
    index('meetings_assignee_starts_idx').on(t.assigneeId, t.startsAt),
    index('meetings_organiser_starts_idx').on(t.organiserId, t.startsAt),
  ],
)
