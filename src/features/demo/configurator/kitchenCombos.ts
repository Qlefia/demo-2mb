import { studioAsset } from './assets'
import type { DesignId } from './types'

const D1 = studioAsset(1, '08')
const D2 = studioAsset(2, '08')

/** Pre-rendered kitchen frames for Design 1 & 2. Design 3 uses `design3Preview.ts`. */
const KITCHEN_COMBOS: Record<string, string> = {
  'design-1|color-1|upper-1|splash-1': D1,
  'design-1|color-1|upper-2|splash-1': studioAsset(1, '02'),
  'design-1|color-1|upper-3|splash-1': studioAsset(1, '05'),
  'design-1|color-1|upper-1|splash-2': studioAsset(1, '02'),
  'design-1|color-1|upper-1|splash-3': D1,
  'design-2|color-1|upper-1|splash-1': D2,
  'design-2|color-1|upper-2|splash-1': studioAsset(2, '05'),
  'design-2|color-1|upper-3|splash-1': studioAsset(2, '03'),
  'design-2|color-1|upper-1|splash-2': studioAsset(2, '05'),
  'design-2|color-1|upper-1|splash-3': studioAsset(2, '03'),
}

export function resolveKitchenComboUrl(
  designId: DesignId,
  colorId: string,
  upperCabinetId: string,
  backsplashId: string,
): string | undefined {
  if (designId === 'design-3') return undefined
  return KITCHEN_COMBOS[`${designId}|${colorId}|${upperCabinetId}|${backsplashId}`]
}
