import {
  index,
  integer,
  pgTable,
  primaryKey,
  text,
  uuid,
} from 'drizzle-orm/pg-core'
import { workspaceOnboardingStatus } from './enums'
import { pkUuid, timestamps } from './_columns'
import { workspaces } from './workspaces'

/** One row per workspace: wizard progress + lifecycle. */
export const workspaceOnboardingState = pgTable('workspace_onboarding_state', {
  workspaceId: uuid('workspace_id')
    .primaryKey()
    .references(() => workspaces.id, { onDelete: 'cascade' }),
  status: workspaceOnboardingStatus('status').default('draft').notNull(),
  ...timestamps(),
})

export const workspaceServices = pgTable(
  'workspace_services',
  {
    id: pkUuid(),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    description: text('description'),
    sortOrder: integer('sort_order').default(0).notNull(),
    ...timestamps(),
  },
  (t) => [index('workspace_services_workspace_idx').on(t.workspaceId)],
)

export const workspaceClientSegments = pgTable(
  'workspace_client_segments',
  {
    id: pkUuid(),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    priority: integer('priority').default(0).notNull(),
    notes: text('notes'),
    ...timestamps(),
  },
  (t) => [index('workspace_client_segments_workspace_idx').on(t.workspaceId)],
)

/** Which services apply to which client segment + optional pitch. */
export const workspaceOfferMatrix = pgTable(
  'workspace_offer_matrix',
  {
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    serviceId: uuid('service_id')
      .notNull()
      .references(() => workspaceServices.id, { onDelete: 'cascade' }),
    segmentId: uuid('segment_id')
      .notNull()
      .references(() => workspaceClientSegments.id, { onDelete: 'cascade' }),
    pitch: text('pitch'),
    ...timestamps(),
  },
  (t) => [
    primaryKey({ columns: [t.workspaceId, t.serviceId, t.segmentId] }),
    index('workspace_offer_matrix_segment_idx').on(t.segmentId),
  ],
)
