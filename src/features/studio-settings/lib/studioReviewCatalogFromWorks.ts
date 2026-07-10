import type { StudioServiceCatalogItem, StudioWork } from '@/stores/studioProfileTypes'

/** Catalogue line ids tied to a portfolio case (work picker + catalog `linkedWorkId`). */
export function resolveCatalogIdsForWork(
  workId: string,
  works: StudioWork[],
  serviceCatalog: StudioServiceCatalogItem[],
): string[] {
  const work = works.find((w) => w.id === workId)
  const fromWork = work?.linkedCatalogIds ?? []
  const fromCatalog = serviceCatalog.filter((c) => c.linkedWorkId === workId).map((c) => c.id)
  return [...new Set([...fromWork, ...fromCatalog])]
}

export function catalogIdsForLinkedWorks(
  workIds: string[],
  works: StudioWork[],
  serviceCatalog: StudioServiceCatalogItem[],
): string[] {
  const ids: string[] = []
  for (const workId of workIds) {
    ids.push(...resolveCatalogIdsForWork(workId, works, serviceCatalog))
  }
  return [...new Set(ids)]
}

/** Prepend a work's catalogue lines onto a review, deduped and capped. */
export function mergeReviewCatalogFromWork(
  reviewCatalogIds: string[],
  workId: string,
  works: StudioWork[],
  serviceCatalog: StudioServiceCatalogItem[],
  maxCatalog: number,
): string[] {
  const fromWork = resolveCatalogIdsForWork(workId, works, serviceCatalog)
  if (fromWork.length === 0) return reviewCatalogIds
  return [...new Set([...fromWork, ...reviewCatalogIds])].slice(0, maxCatalog)
}

/** Add catalogue lines from linked works that are not yet on the review (does not re-add manual removals). */
export function appendMissingReviewCatalogFromWorks(
  reviewCatalogIds: string[],
  linkedWorkIds: string[],
  works: StudioWork[],
  serviceCatalog: StudioServiceCatalogItem[],
  maxCatalog: number,
): string[] {
  const fromWorks = catalogIdsForLinkedWorks(linkedWorkIds, works, serviceCatalog)
  const missing = fromWorks.filter((id) => !reviewCatalogIds.includes(id))
  if (missing.length === 0) return reviewCatalogIds
  return [...new Set([...missing, ...reviewCatalogIds])].slice(0, maxCatalog)
}

/** Drop catalogue lines that belonged only to the unlinked work. */
export function pruneReviewCatalogAfterWorkUnlink(
  reviewCatalogIds: string[],
  unlinkedWorkId: string,
  remainingLinkedWorkIds: string[],
  works: StudioWork[],
  serviceCatalog: StudioServiceCatalogItem[],
): string[] {
  const unlinkedIds = resolveCatalogIdsForWork(unlinkedWorkId, works, serviceCatalog)
  if (unlinkedIds.length === 0) return reviewCatalogIds

  const stillNeeded = new Set(
    catalogIdsForLinkedWorks(remainingLinkedWorkIds, works, serviceCatalog),
  )
  const orphanIds = new Set(unlinkedIds.filter((cid) => !stillNeeded.has(cid)))
  if (orphanIds.size === 0) return reviewCatalogIds

  return reviewCatalogIds.filter((cid) => !orphanIds.has(cid))
}

export function catalogIdSetsEqual(a: readonly string[], b: readonly string[]): boolean {
  if (a.length !== b.length) return false
  const setA = new Set(a)
  return b.every((id) => setA.has(id))
}

/** Stable key for effects when work↔catalog links change. */
export function linkedWorksCatalogSignature(
  linkedWorkIds: string[],
  works: StudioWork[],
  serviceCatalog: StudioServiceCatalogItem[],
): string {
  return linkedWorkIds
    .map((workId) => resolveCatalogIdsForWork(workId, works, serviceCatalog).sort().join(','))
    .join('|')
}
