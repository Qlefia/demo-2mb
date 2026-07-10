import type { StudioSalesListSortBy } from '@/features/studio-settings/lib/studioSalesListTypes'

export function studioSalesListSortIds(
  ids: readonly string[],
  sortBy: StudioSalesListSortBy,
  getTitle: (id: string) => string,
  getRating?: (id: string) => number | null,
): string[] {
  if (sortBy === 'manual') return [...ids]
  if (sortBy === 'ratingDesc' && getRating) {
    return [...ids].sort((a, b) => {
      const ra = getRating(a)
      const rb = getRating(b)
      const na = ra ?? -1
      const nb = rb ?? -1
      return nb - na
    })
  }
  const asc = [...ids].sort((a, b) =>
    getTitle(a).localeCompare(getTitle(b), undefined, { sensitivity: 'base' }),
  )
  return sortBy === 'titleDesc' ? asc.reverse() : asc
}

export function studioSalesListFilterBySearch(
  ids: readonly string[],
  query: string,
  getSearchText: (id: string) => string,
): string[] {
  const q = query.trim().toLowerCase()
  if (!q) return [...ids]
  return ids.filter((id) => getSearchText(id).toLowerCase().includes(q))
}
