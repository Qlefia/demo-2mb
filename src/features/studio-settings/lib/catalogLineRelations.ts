import type { StudioReview, StudioServiceGroup } from '@/stores/studioProfileTypes'

export function serviceGroupsContainingCatalogLine(
  catalogLineId: string,
  serviceGroups: readonly StudioServiceGroup[],
): StudioServiceGroup[] {
  return serviceGroups.filter((g) => g.memberIds.includes(catalogLineId))
}

export function reviewsLinkingCatalogLine(
  catalogLineId: string,
  reviews: readonly StudioReview[],
): StudioReview[] {
  return reviews.filter((r) => r.linkedCatalogIds.includes(catalogLineId))
}

export function reviewRelationLabel(r: StudioReview, untitled: string): string {
  const a = r.author.trim()
  const c = r.company.trim()
  if (a && c) return `${a} — ${c}`
  if (a) return a
  if (c) return c
  const h = r.headline.trim()
  if (h) return h
  return untitled
}
