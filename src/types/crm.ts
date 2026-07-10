import type { InferInsertModel, InferSelectModel } from 'drizzle-orm'
import type {
  accounts,
  activities,
  contacts,
  dossierVersions,
  dossiers,
  enrichmentCache,
  enrichmentJobs,
  playbooks,
  prospects,
  tasks,
  triggers,
} from '@/lib/db/schema'

export type Account = InferSelectModel<typeof accounts>
export type AccountInsert = InferInsertModel<typeof accounts>

export type Contact = InferSelectModel<typeof contacts>
export type ContactInsert = InferInsertModel<typeof contacts>

export type Prospect = InferSelectModel<typeof prospects>
export type ProspectInsert = InferInsertModel<typeof prospects>

export type Trigger = InferSelectModel<typeof triggers>
export type TriggerInsert = InferInsertModel<typeof triggers>

export type Dossier = InferSelectModel<typeof dossiers>
export type DossierInsert = InferInsertModel<typeof dossiers>

export type DossierVersion = InferSelectModel<typeof dossierVersions>
export type DossierVersionInsert = InferInsertModel<typeof dossierVersions>

export type Activity = InferSelectModel<typeof activities>
export type ActivityInsert = InferInsertModel<typeof activities>

export type Task = InferSelectModel<typeof tasks>
export type TaskInsert = InferInsertModel<typeof tasks>

export type Playbook = InferSelectModel<typeof playbooks>
export type PlaybookInsert = InferInsertModel<typeof playbooks>

export type EnrichmentCacheRow = InferSelectModel<typeof enrichmentCache>
export type EnrichmentCacheInsert = InferInsertModel<typeof enrichmentCache>

export type EnrichmentJob = InferSelectModel<typeof enrichmentJobs>
export type EnrichmentJobInsert = InferInsertModel<typeof enrichmentJobs>

export type {
  ActivityType,
  DossierStatus,
  EnrichmentJobStatus,
  LostReason,
  ProspectSource,
  ProspectStage,
  PublicPrivate,
  TaskStatus,
  Territory,
  TriageDecision,
} from '@/lib/db/schema'
