import type { ProspectStage } from '@/lib/db/schema/enums'

export interface StageMeta {
  id: ProspectStage
  labelKey: string
  /** Neutral pipeline markers — no rainbow SaaS stage colors */
  accentClass: string
}

export const STAGE_META: readonly StageMeta[] = [
  { id: 'new', labelKey: 'prospects.stages.new', accentClass: 'bg-neutral-400' },
  { id: 'triaged', labelKey: 'prospects.stages.triaged', accentClass: 'bg-neutral-500' },
  { id: 'enriching', labelKey: 'prospects.stages.enriching', accentClass: 'bg-neutral-600' },
  {
    id: 'dossier_in_progress',
    labelKey: 'prospects.stages.dossier_in_progress',
    accentClass: 'bg-neutral-700',
  },
  {
    id: 'dossier_ready',
    labelKey: 'prospects.stages.dossier_ready',
    accentClass: 'bg-foreground',
  },
  { id: '1st_call', labelKey: 'prospects.stages.first_call', accentClass: 'bg-neutral-600' },
  {
    id: 'meeting_scheduled',
    labelKey: 'prospects.stages.meeting_scheduled',
    accentClass: 'bg-neutral-500',
  },
  {
    id: 'proposal_sent',
    labelKey: 'prospects.stages.proposal_sent',
    accentClass: 'bg-neutral-700',
  },
  { id: 'won', labelKey: 'prospects.stages.won', accentClass: 'bg-success' },
  { id: 'lost', labelKey: 'prospects.stages.lost', accentClass: 'bg-neutral-400' },
] as const

export const STAGE_META_BY_ID: Readonly<Record<ProspectStage, StageMeta>> = Object.fromEntries(
  STAGE_META.map((s) => [s.id, s]),
) as Record<ProspectStage, StageMeta>
