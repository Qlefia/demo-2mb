import type { StudioServiceCatalogItem } from '@/stores/studioProfileTypes'

export const STUDIO_LIST_CARD_MAX_CATALOG_CHIPS = 4

export type CatalogMemberChip = { id: string; label: string; kind?: 'group' | 'service' }

export function buildCatalogMemberChips(
  memberIds: readonly string[],
  catalogById: ReadonlyMap<string, StudioServiceCatalogItem>,
  unnamedLabel: string,
  maxShown = STUDIO_LIST_CARD_MAX_CATALOG_CHIPS,
): { chips: CatalogMemberChip[]; overflowCount: number } {
  const entries = memberIds.map((cid) => {
    const line = catalogById.get(cid)
    const label = line?.title.trim() || unnamedLabel
    return { id: cid, label, kind: 'service' as const }
  })
  const chips = entries.slice(0, maxShown)
  return { chips, overflowCount: Math.max(0, entries.length - chips.length) }
}
