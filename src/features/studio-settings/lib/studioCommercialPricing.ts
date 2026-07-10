import { getActivePriceTier } from '@/features/studio-settings/lib/studioPriceTiers'
import type { StudioCommercialPriceTier, StudioCommercialPricingHost } from '@/stores/studioProfileTypes'

export type { StudioCommercialPriceTier, StudioCommercialPricingHost }

export function pickCommercialPricing(host: StudioCommercialPricingHost): StudioCommercialPricingHost {
  return {
    priceTiers: host.priceTiers,
    activePriceTierId: host.activePriceTierId,
  }
}

export function activeCommercialTier(host: StudioCommercialPricingHost): StudioCommercialPriceTier {
  return getActivePriceTier(host.priceTiers, host.activePriceTierId)
}
