import type { StudioServiceCatalogItem } from '@/stores/studioProfileTypes'

type CatalogTitlePatch = Pick<StudioServiceCatalogItem, 'title'> &
  Partial<Pick<StudioServiceCatalogItem, 'summary' | 'description'>>

/** When a catalogue line title is cleared or changed, drop stale summary / rich text. */
export function catalogLinePatchForTitleChange(
  prevTitle: string,
  nextTitle: string,
): CatalogTitlePatch {
  const title = nextTitle
  if (!title.trim() || prevTitle.trim() !== title.trim()) {
    return { title, summary: '', description: '' }
  }
  return { title }
}
