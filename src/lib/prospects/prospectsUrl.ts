import { PROSPECT_STAGES, type ProspectStage } from '@/lib/db/schema/enums'
import type { ProspectViewMode } from '@/stores/prospectStore'

export function isProspectStage(value: string): value is ProspectStage {
  return (PROSPECT_STAGES as readonly string[]).includes(value)
}

export function isProspectViewMode(value: string): value is ProspectViewMode {
  return value === 'kanban' || value === 'list' || value === 'card'
}

export function prospectsListUrl(params?: {
  stage?: ProspectStage
  view?: ProspectViewMode
}): string {
  const sp = new URLSearchParams()
  if (params?.stage) sp.set('stage', params.stage)
  if (params?.view) sp.set('view', params.view)
  const q = sp.toString()
  return q ? `/prospects?${q}` : '/prospects'
}
