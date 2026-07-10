import { PROSPECT_STAGES, type ProspectStage } from '@/lib/db/schema/enums'
import type { DossierStatus } from '@/lib/db/schema/enums'

export type PipelineRole = 'founder' | 'ops' | 'admin' | 'sales_de' | 'sales_uk' | null

export const STAGE_ORDER: readonly ProspectStage[] = PROSPECT_STAGES

export function stageRank(stage: ProspectStage): number {
  return STAGE_ORDER.indexOf(stage)
}

export interface TransitionContext {
  role: PipelineRole
  fromStage: ProspectStage
  toStage: ProspectStage
  dossierStatus?: DossierStatus | null
}

export type TransitionResult =
  | { ok: true }
  | { ok: false; reasonKey: string }

const PRIVILEGED_ROLES: ReadonlySet<PipelineRole> = new Set<PipelineRole>([
  'founder',
  'ops',
  'admin',
])

export function canTransition(ctx: TransitionContext): TransitionResult {
  const { role, fromStage, toStage, dossierStatus } = ctx

  if (fromStage === toStage) return { ok: true }

  if (toStage === 'lost') return { ok: true }

  if (toStage === 'dossier_ready' && dossierStatus !== 'ready') {
    if (PRIVILEGED_ROLES.has(role)) return { ok: true }
    return { ok: false, reasonKey: 'pipeline.errors.requiresDossierReady' }
  }

  const fromRank = stageRank(fromStage)
  const toRank = stageRank(toStage)

  if (toRank < fromRank && !PRIVILEGED_ROLES.has(role)) {
    return { ok: false, reasonKey: 'pipeline.errors.backwardsForbidden' }
  }

  return { ok: true }
}

export function getAllowedTargets(
  fromStage: ProspectStage,
  ctx: Omit<TransitionContext, 'fromStage' | 'toStage'>,
): ProspectStage[] {
  return STAGE_ORDER.filter(
    (target) => canTransition({ ...ctx, fromStage, toStage: target }).ok,
  )
}
