'use client'

import { StudioPriceTiersEditor } from '@/features/studio-settings/components/StudioPriceTiersEditor'
import type { StudioCommercialPricingHost } from '@/stores/studioProfileTypes'

type StudioCommercialPricingFieldsProps = {
  values: StudioCommercialPricingHost
  onPatch: (patch: Partial<StudioCommercialPricingHost>) => void
  idPrefix?: string
  defaultTierName?: string
}

export function StudioCommercialPricingFields({
  values,
  onPatch,
  idPrefix = 'pricing',
  defaultTierName = '',
}: StudioCommercialPricingFieldsProps) {
  return (
    <StudioPriceTiersEditor
      priceTiers={values.priceTiers}
      activePriceTierId={values.activePriceTierId}
      onChange={onPatch}
      idPrefix={idPrefix}
      defaultTierName={defaultTierName}
    />
  )
}
