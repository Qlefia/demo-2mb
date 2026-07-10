import { index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { proposals } from './proposals'
import { proposalVersions } from './proposalVersions'
import { pkUuid } from './_columns'

/** Public magic-link tokens; resolve to a published proposal version. */
export const proposalShareTokens = pgTable(
  'proposal_share_tokens',
  {
    id: pkUuid(),
    proposalId: uuid('proposal_id')
      .notNull()
      .references(() => proposals.id, { onDelete: 'cascade' }),
    token: text('token').notNull().unique(),
    publishedVersionId: uuid('published_version_id').references(() => proposalVersions.id, {
      onDelete: 'set null',
    }),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index('proposal_share_tokens_proposal_id_idx').on(t.proposalId),
    index('proposal_share_tokens_token_idx').on(t.token),
  ],
)
