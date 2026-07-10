import type { DossierStatus, ProspectStage } from '@/lib/db/schema/enums'

/**
 * The single action a user is most likely to take next on a prospect, derived
 * from pipeline stage + role. Drives the primary CTA in the prospect header so
 * the worker doesn't hunt through tabs for "what do I do now".
 */
export type ProspectActionKind = 'enrich' | 'dossier' | 'logCall' | 'proposal' | 'activity'

export interface NextBestAction {
  kind: ProspectActionKind
  labelKey: string
}

const EDITOR_ROLES = new Set(['founder', 'ops', 'admin'])
const OPS_STAGES = new Set<ProspectStage>([
  'new',
  'triaged',
  'enriching',
  'dossier_in_progress',
])

export function getNextBestAction(input: {
  stage: ProspectStage
  role: string | null
  dossierStatus: DossierStatus | null
  canManualEnrich: boolean
}): NextBestAction {
  const { stage, role, canManualEnrich } = input
  const isEditor = role !== null && EDITOR_ROLES.has(role)

  if (canManualEnrich) {
    return { kind: 'enrich', labelKey: 'prospects.nba.runEnrichment' }
  }

  switch (stage) {
    case 'new':
    case 'triaged':
    case 'enriching':
    case 'dossier_in_progress':
      return isEditor
        ? { kind: 'dossier', labelKey: 'prospects.nba.openDossier' }
        : { kind: 'activity', labelKey: 'prospects.nba.logActivity' }
    case 'dossier_ready':
      return { kind: 'logCall', labelKey: 'prospects.nba.firstCall' }
    case '1st_call':
      return { kind: 'logCall', labelKey: 'prospects.nba.followUp' }
    case 'meeting_scheduled':
      return { kind: 'proposal', labelKey: 'prospects.nba.createProposal' }
    case 'proposal_sent':
      return { kind: 'proposal', labelKey: 'prospects.nba.openProposal' }
    default:
      return { kind: 'activity', labelKey: 'prospects.nba.logActivity' }
  }
}

/**
 * Stage- and role-aware default tab. Ops/founder/admin land on the dossier
 * while it's being built; everyone else (and late stages) lands on Overview —
 * the Sales work surface.
 */
export function getDefaultWorkspaceTab(input: {
  stage: ProspectStage
  role: string | null
}): 'overview' | 'dossier' {
  const isEditor = input.role !== null && EDITOR_ROLES.has(input.role)
  if (isEditor && OPS_STAGES.has(input.stage)) return 'dossier'
  return 'overview'
}
