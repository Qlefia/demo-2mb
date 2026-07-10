import { sql } from 'drizzle-orm'
import {
  index,
  jsonb,
  pgTable,
  smallint,
  text,
  uuid,
} from 'drizzle-orm/pg-core'
import { accounts } from './accounts'
import { contacts } from './contacts'
import { workspaces } from './workspaces'
import { authUsers } from './auth'
import { playbooks } from './playbooks'
import {
  lostReason,
  prospectSource,
  prospectStage,
  territory,
  triageDecision,
} from './enums'
import { pkUuid, timestamps } from './_columns'

export const prospects = pgTable(
  'prospects',
  {
    id: pkUuid(),
    accountId: uuid('account_id')
      .notNull()
      .references(() => accounts.id, { onDelete: 'restrict' }),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'restrict' }),
    ownerId: uuid('owner_id').references(() => authUsers.id, { onDelete: 'set null' }),
    createdBy: uuid('created_by').references(() => authUsers.id, { onDelete: 'set null' }),
    source: prospectSource('source').notNull(),
    territory: territory('territory').notNull(),
    stage: prospectStage('stage').default('new').notNull(),
    priority: smallint('priority').default(3).notNull(),
    triageDecision: triageDecision('triage_decision'),
    lostReason: lostReason('lost_reason'),
    suggestedPlaybookId: uuid('suggested_playbook_id').references(() => playbooks.id, {
      onDelete: 'set null',
    }),
    primaryContactId: uuid('primary_contact_id').references(() => contacts.id, {
      onDelete: 'set null',
    }),
    /** Scratch-pad sticky note on the company card (right rail). */
    quickNote: text('quick_note'),
    /** Studio catalogue line ids pitched to this prospect (subset of workspace serviceCatalog). */
    pitchServiceIds: jsonb('pitch_service_ids')
      .$type<string[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    /** Studio works (portfolio) ids pitched to this prospect (subset of workspace works). */
    pitchWorkIds: jsonb('pitch_work_ids')
      .$type<string[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    ...timestamps(),
  },
  (t) => [
    index('prospects_stage_idx').on(t.stage),
    index('prospects_territory_stage_idx').on(t.territory, t.stage),
    index('prospects_owner_id_idx').on(t.ownerId),
    index('prospects_created_by_idx').on(t.createdBy),
    index('prospects_account_id_idx').on(t.accountId),
    index('prospects_workspace_id_idx').on(t.workspaceId),
    index('prospects_primary_contact_id_idx').on(t.primaryContactId),
  ],
)
