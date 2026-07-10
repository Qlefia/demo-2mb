'use client'

import { StudioPriceTiersEditor } from '@/features/studio-settings/components/StudioPriceTiersEditor'
import type { StudioServiceCatalogItem } from '@/stores/studioProfileTypes'

type StudioCatalogLinePricingFieldsProps = {
  row: StudioServiceCatalogItem
  onPatch: (patch: Partial<StudioServiceCatalogItem>) => void
  idPrefix?: string
}

export function StudioCatalogLinePricingFields({ row, onPatch, idPrefix }: StudioCatalogLinePricingFieldsProps) {
  return (
    <StudioPriceTiersEditor
      priceTiers={row.priceTiers}
      activePriceTierId={row.activePriceTierId}
      onChange={onPatch}
      idPrefix={idPrefix}
      defaultTierName={row.title.trim()}
    />
  )
}
