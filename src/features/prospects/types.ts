import type {
  ProspectStage,
  ProspectSource,
  Territory,
  LostReason,
  TriageDecision,
  DossierStatus,
} from '@/lib/db/schema/enums'

export type {
  ProspectStage,
  ProspectSource,
  Territory,
  LostReason,
  TriageDecision,
  DossierStatus,
}

export interface ProspectAccountSummary {
  id: string
  name: string
  website: string | null
}

export interface ProspectTriggerSummary {
  text: string
  capturedAt: string
}

export interface Prospect {
  id: string
  accountId: string
  account: ProspectAccountSummary
  ownerId: string | null
  /** Resolved display name for `ownerId` (server-enriched). */
  ownerLabel: string | null
  createdById: string | null
  /** Resolved display name for `createdById` (server-enriched). */
  createdByLabel: string | null
  source: ProspectSource
  territory: Territory
  stage: ProspectStage
  priority: number
  triageDecision: TriageDecision | null
  lostReason: LostReason | null
  suggestedPlaybookId: string | null
  primaryContactId: string | null
  quickNote: string | null
  latestTrigger: ProspectTriggerSummary | null
  dossierStatus: DossierStatus | null
  createdAt: string
  updatedAt: string
}
