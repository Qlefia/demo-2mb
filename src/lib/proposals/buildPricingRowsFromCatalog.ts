import type { StudioCommercialPriceTier, StudioServiceCatalogItem, StudioServiceGroup } from '@/stores/studioProfileTypes'

export type PricingRowDraft = {
  package: string
  deliverables: string
  price: string
}

function parseSales(raw: unknown): {
  serviceCatalog: StudioServiceCatalogItem[]
  serviceGroups: StudioServiceGroup[]
} {
  if (!raw || typeof raw !== 'object') {
    return { serviceCatalog: [], serviceGroups: [] }
  }
  const s = raw as { serviceCatalog?: unknown; serviceGroups?: unknown }
  return {
    serviceCatalog: Array.isArray(s.serviceCatalog) ? (s.serviceCatalog as StudioServiceCatalogItem[]) : [],
    serviceGroups: Array.isArray(s.serviceGroups) ? (s.serviceGroups as StudioServiceGroup[]) : [],
  }
}

function activeTier(host: { priceTiers: StudioCommercialPriceTier[]; activePriceTierId: string | null }): StudioCommercialPriceTier | null {
  if (host.activePriceTierId) {
    const hit = host.priceTiers.find((t) => t.id === host.activePriceTierId)
    if (hit) return hit
  }
  return host.priceTiers[0] ?? null
}

function tierToRow(label: string, summary: string, tier: StudioCommercialPriceTier): PricingRowDraft {
  const price =
    tier.priceAmount.trim() ||
    [tier.priceFrom.trim(), tier.priceTo.trim()].filter(Boolean).join(' – ') ||
    tier.freeNote.trim() ||
    '—'
  const deliverables =
    [tier.description.trim(), tier.revisions.trim() ? `Revisions: ${tier.revisions.trim()}` : '', tier.concepts.trim() ? `Concepts: ${tier.concepts.trim()}` : '']
      .filter(Boolean)
      .join(' · ') ||
    summary.trim() ||
    '—'
  return {
    package: tier.name.trim() || label,
    deliverables,
    price,
  }
}

function rowsFromPricingHost(
  label: string,
  summary: string,
  host: { priceTiers: StudioCommercialPriceTier[]; activePriceTierId: string | null },
): PricingRowDraft[] {
  const tier = activeTier(host)
  if (!tier) return []
  return [tierToRow(label, summary, tier)]
}

function rowsFromGroup(group: StudioServiceGroup, catalog: StudioServiceCatalogItem[]): PricingRowDraft[] {
  const tierRows = rowsFromPricingHost(group.title, group.description, group)
  if (tierRows.length > 0) return tierRows

  const rows: PricingRowDraft[] = []
  for (const memberId of group.memberIds) {
    const item = catalog.find((c) => c.id === memberId)
    if (!item) continue
    const itemRows = rowsFromPricingHost(item.title, item.summary || item.code, item)
    rows.push(...itemRows)
  }
  return rows.length > 0 ? rows : [{ package: group.title, deliverables: group.description.slice(0, 500), price: '—' }]
}

/** Seed pricing block rows from Studio sales catalog via template `pricingPresetId` (service group or catalog line). */
export function buildPricingRowsFromCatalog(
  studioSales: unknown,
  pricingPresetId: string | null | undefined,
): PricingRowDraft[] {
  if (!pricingPresetId) return []
  const { serviceCatalog, serviceGroups } = parseSales(studioSales)

  const group = serviceGroups.find((g) => g.id === pricingPresetId)
  if (group) return rowsFromGroup(group, serviceCatalog)

  const item = serviceCatalog.find((c) => c.id === pricingPresetId)
  if (item) return rowsFromPricingHost(item.title, item.summary || item.code, item)

  return []
}
