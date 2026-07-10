import type { Territory } from '@/lib/db/schema/enums'

/**
 * Prospect priority is a 1–5 smallint (1 = most urgent, default 3). The raw
 * "P{n}" chip was unreadable, so map each level to a named i18n key + a tooltip.
 */
export function priorityLevelKey(priority: number): string {
  const clamped = Math.min(5, Math.max(1, Math.round(priority)))
  return `prospects.priorityLevels.p${clamped}`
}

export function clampPriority(priority: number): number {
  return Math.min(5, Math.max(1, Math.round(priority)))
}

export function territoryLabelKey(territory: Territory): string {
  return `prospects.territories.${territory}`
}

/** Compact chip label — EU_other reads as "EU" in cards, lists, and filters. */
export function formatTerritoryBadge(territory: Territory): string {
  if (territory === 'EU_other') return 'EU'
  return territory
}
