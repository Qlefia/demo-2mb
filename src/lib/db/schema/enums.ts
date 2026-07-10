import { pgEnum } from 'drizzle-orm/pg-core'

export const PROSPECT_STAGES = [
  'new',
  'triaged',
  'enriching',
  'dossier_in_progress',
  'dossier_ready',
  '1st_call',
  'meeting_scheduled',
  'proposal_sent',
  'won',
  'lost',
] as const

export const prospectStage = pgEnum('prospect_stage', PROSPECT_STAGES)
export type ProspectStage = (typeof PROSPECT_STAGES)[number]

export const PROSPECT_SOURCES = [
  'inbound_form',
  'linkedin_outreach',
  'competitionline',
  'immobilienmanager',
  'propertyweek',
  'manual',
  'referral',
] as const

export const prospectSource = pgEnum('prospect_source', PROSPECT_SOURCES)
export type ProspectSource = (typeof PROSPECT_SOURCES)[number]

export const TERRITORIES = ['DE', 'UK', 'EU_other'] as const
export const territory = pgEnum('territory', TERRITORIES)
export type Territory = (typeof TERRITORIES)[number]

export const DOSSIER_STATUSES = ['draft', 'in_review', 'ready', 'archived'] as const
export const dossierStatus = pgEnum('dossier_status', DOSSIER_STATUSES)
export type DossierStatus = (typeof DOSSIER_STATUSES)[number]

export const ACTIVITY_TYPES = [
  'stage_change',
  'owner_change',
  'audit',
  'call',
  'email',
  'linkedin',
  'note',
  'dossier_delivered',
  'opt_out',
  'task_completed',
] as const
export const activityType = pgEnum('activity_type', ACTIVITY_TYPES)
export type ActivityType = (typeof ACTIVITY_TYPES)[number]

export const TASK_STATUSES = ['open', 'in_progress', 'done', 'cancelled'] as const
export const taskStatus = pgEnum('task_status', TASK_STATUSES)
export type TaskStatus = (typeof TASK_STATUSES)[number]

export const MEETING_STATUSES = ['scheduled', 'completed', 'cancelled'] as const
export const meetingStatus = pgEnum('meeting_status', MEETING_STATUSES)
export type MeetingStatus = (typeof MEETING_STATUSES)[number]

export const DEAL_STAGES = ['open', 'won', 'lost'] as const
export const dealStage = pgEnum('deal_stage', DEAL_STAGES)
export type DealStage = (typeof DEAL_STAGES)[number]

export const LOST_REASONS = [
  'icp_mismatch',
  'no_budget',
  'no_timing',
  'competitor_won',
  'no_response',
  'other',
] as const
export const lostReason = pgEnum('lost_reason', LOST_REASONS)
export type LostReason = (typeof LOST_REASONS)[number]

export const TRIAGE_DECISIONS = ['accept', 'reject'] as const
export const triageDecision = pgEnum('triage_decision', TRIAGE_DECISIONS)
export type TriageDecision = (typeof TRIAGE_DECISIONS)[number]

export const ENRICHMENT_JOB_STATUSES = [
  'queued',
  'running',
  'success',
  'failed',
  'cancelled',
] as const
export const enrichmentJobStatus = pgEnum('enrichment_job_status', ENRICHMENT_JOB_STATUSES)
export type EnrichmentJobStatus = (typeof ENRICHMENT_JOB_STATUSES)[number]

export const PUBLIC_PRIVATE = ['public', 'private', 'unknown'] as const
export const publicPrivate = pgEnum('public_private', PUBLIC_PRIVATE)
export type PublicPrivate = (typeof PUBLIC_PRIVATE)[number]

export const PROPOSAL_STATUSES = ['draft', 'published'] as const
export const proposalStatus = pgEnum('proposal_status', PROPOSAL_STATUSES)
export type ProposalStatus = (typeof PROPOSAL_STATUSES)[number]

export const PROPOSAL_LANGUAGES = ['de', 'en'] as const
export const proposalLanguage = pgEnum('proposal_language', PROPOSAL_LANGUAGES)
export type ProposalLanguage = (typeof PROPOSAL_LANGUAGES)[number]

export const DOCUMENT_KINDS = ['proposal', 'offer'] as const
export const documentKind = pgEnum('document_kind', DOCUMENT_KINDS)
export type DocumentKind = (typeof DOCUMENT_KINDS)[number]

export const CLIENT_PROJECT_STATUSES = [
  'discovered',
  'qualified',
  'offer_sent',
  'offer_accepted',
  'in_delivery',
  'completed',
  'offer_declined',
  'cancelled',
] as const
export const clientProjectStatus = pgEnum('client_project_status', CLIENT_PROJECT_STATUSES)
export type ClientProjectStatus = (typeof CLIENT_PROJECT_STATUSES)[number]

export const WORKSPACE_MEMBER_ROLES = ['owner', 'admin', 'member'] as const
export const workspaceMemberRole = pgEnum('workspace_member_role', WORKSPACE_MEMBER_ROLES)
export type WorkspaceMemberRole = (typeof WORKSPACE_MEMBER_ROLES)[number]

export const WORKSPACE_ONBOARDING_STATUSES = ['draft', 'in_review', 'confirmed'] as const
export const workspaceOnboardingStatus = pgEnum(
  'workspace_onboarding_status',
  WORKSPACE_ONBOARDING_STATUSES,
)
export type WorkspaceOnboardingStatus = (typeof WORKSPACE_ONBOARDING_STATUSES)[number]

export const ACCOUNT_COACCESS_STATUSES = ['pending', 'approved', 'rejected'] as const
export const accountCoaccessStatus = pgEnum('account_coaccess_status', ACCOUNT_COACCESS_STATUSES)
export type AccountCoaccessStatus = (typeof ACCOUNT_COACCESS_STATUSES)[number]

export const PROSPECT_ARTIFACT_KINDS = ['folder', 'entry', 'image', 'link', 'note'] as const
export const prospectArtifactKind = pgEnum('prospect_artifact_kind', PROSPECT_ARTIFACT_KINDS)
export type ProspectArtifactKind = (typeof PROSPECT_ARTIFACT_KINDS)[number]
