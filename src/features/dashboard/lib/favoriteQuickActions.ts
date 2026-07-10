import type { ProspectStage } from '@/lib/db/schema/enums'

const PROPOSAL_STAGES = new Set<ProspectStage>(['meeting_scheduled', 'proposal_sent'])

export function favoriteShowsProposalLink(stage: string): boolean {
  const s = stage as ProspectStage
  return PROPOSAL_STAGES.has(s) || s === 'dossier_ready' || s === '1st_call'
}
