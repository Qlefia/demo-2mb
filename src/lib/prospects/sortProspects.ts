import type { Prospect } from '@/features/prospects/types'
import type { ProspectStage } from '@/lib/db/schema/enums'

export type ProspectSortField = 'account' | 'updated' | 'priority' | 'stage'
export type ProspectSortOrder = 'asc' | 'desc'

export function buildStageOrderIndex(stages: readonly ProspectStage[]): Map<ProspectStage, number> {
  return new Map(stages.map((s, i) => [s, i]))
}

export function sortProspects(
  items: Prospect[],
  sortBy: ProspectSortField,
  sortOrder: ProspectSortOrder,
  stageOrder: Map<ProspectStage, number>,
): Prospect[] {
  const mult = sortOrder === 'asc' ? 1 : -1
  return [...items].sort((a, b) => {
    let cmp = 0
    switch (sortBy) {
      case 'account':
        cmp = a.account.name.localeCompare(b.account.name, undefined, { sensitivity: 'base' })
        break
      case 'updated':
        cmp = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
        break
      case 'priority':
        cmp = a.priority - b.priority
        break
      case 'stage':
        cmp = (stageOrder.get(a.stage) ?? 0) - (stageOrder.get(b.stage) ?? 0)
        break
      default:
        return 0
    }
    if (cmp !== 0) return mult * cmp
    return a.account.name.localeCompare(b.account.name, undefined, { sensitivity: 'base' })
  })
}

export type ProspectGroupBy = 'none' | 'stage' | 'territory' | 'owner'

export function groupProspects(
  items: Prospect[],
  groupBy: ProspectGroupBy,
): { key: string; label: string; items: Prospect[] }[] {
  if (groupBy === 'none') {
    return [{ key: 'all', label: '', items }]
  }
  const map = new Map<string, { items: Prospect[]; label: string }>()
  const order: string[] = []

  for (const p of items) {
    let key: string
    let defaultLabel: string
    switch (groupBy) {
      case 'stage':
        key = p.stage
        defaultLabel = p.stage
        break
      case 'territory':
        key = p.territory
        defaultLabel = p.territory
        break
      case 'owner': {
        key = p.ownerId ?? '__unassigned__'
        defaultLabel = key === '__unassigned__' ? '' : (p.ownerLabel ?? p.ownerId ?? key)
        break
      }
      default:
        key = 'all'
        defaultLabel = ''
    }
    if (!map.has(key)) {
      map.set(key, { items: [], label: defaultLabel })
      order.push(key)
    }
    const bucket = map.get(key)!
    bucket.items.push(p)
  }

  return order.map((key) => {
    const bucket = map.get(key)!
    return { key, label: bucket.label, items: bucket.items }
  })
}
