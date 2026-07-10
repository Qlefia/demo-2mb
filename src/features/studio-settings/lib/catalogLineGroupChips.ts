import type { StudioServiceGroup } from '@/stores/studioProfileTypes'

const MAX_CHIPS = 4

export function buildGroupChipsForCatalogLine(
  catalogLineId: string,
  serviceGroups: readonly StudioServiceGroup[],
  groupTitle: (groupId: string) => string,
): { chips: { id: string; label: string }[]; overflowCount: number } {
  const matching = serviceGroups.filter((g) => g.memberIds.includes(catalogLineId))
  const chips = matching.slice(0, MAX_CHIPS).map((g) => ({
    id: g.id,
    label: groupTitle(g.id),
    kind: 'group' as const,
  }))
  return {
    chips,
    overflowCount: Math.max(0, matching.length - chips.length),
  }
}
