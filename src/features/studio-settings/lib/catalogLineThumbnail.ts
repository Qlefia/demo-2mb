import { studioDualBannerThumbnail } from '@/features/studio-settings/lib/studioDualBannerThumbnail'
import type { StudioServiceCatalogItem } from '@/stores/studioProfileTypes'

/** List-card thumbnail: horizontal hero first, then vertical portrait. */
export function catalogLineListThumbnail(row: StudioServiceCatalogItem): string | null {
  return studioDualBannerThumbnail(row.mediaDataUrl, row.mediaPortraitDataUrl)
}
