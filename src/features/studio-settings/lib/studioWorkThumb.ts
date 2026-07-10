import { studioDualBannerThumbnail } from '@/features/studio-settings/lib/studioDualBannerThumbnail'
import type { StudioWork } from '@/stores/studioProfileTypes'
import type { VisualGridProps } from '@/lib/proposals/blockSchema'

function firstGridImageDataUrl(grid: VisualGridProps): string | null {
  for (const row of grid.rows) {
    for (const cell of row.cells) {
      if (cell.kind === 'image') {
        const u = cell.imageUrl?.trim()
        if (u) return u
      }
    }
  }
  return null
}

/** Banner first (horizontal, then portrait), then first image cell in the case gallery grid. */
export function studioWorkThumbSrc(work: StudioWork): string | null {
  const banner = studioDualBannerThumbnail(work.bannerDataUrl, work.bannerPortraitDataUrl)
  if (banner) return banner
  return firstGridImageDataUrl(work.galleryVisualGrid)
}
