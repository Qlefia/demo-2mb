import {
  design3KitchenAsset,
  design3WallAsset,
  design3WorkstationAsset,
  studioAsset,
} from './assets'
import type { HotspotLayoutKey } from './hotspotLayouts'
import type { ConfiguratorManifest, ConfiguratorState } from './types'

const DESIGN3_HERO = studioAsset(3, '08')
const DESIGN3_KITCHEN_URLS = new Set<string>(Object.values(design3KitchenAsset))
const DESIGN3_WALL_URLS = new Set<string>(Object.values(design3WallAsset))
const DESIGN3_WORKSTATION_URLS = new Set<string>(Object.values(design3WorkstationAsset))

/** Map the rendered image URL to hotspot coordinates — independent of sidebar focus. */
export function resolveHotspotLayoutForUrl(
  state: ConfiguratorState,
  manifest: ConfiguratorManifest,
  imageUrl: string,
): HotspotLayoutKey | null {
  const design = manifest.designs[state.designId]

  if (state.designId === 'design-3') {
    if (imageUrl === DESIGN3_HERO || imageUrl === design.heroImage) return 'hero'
    if (DESIGN3_KITCHEN_URLS.has(imageUrl)) return 'kitchen'
    if (DESIGN3_WALL_URLS.has(imageUrl)) return 'wall'
    if (DESIGN3_WORKSTATION_URLS.has(imageUrl)) return 'workstation'
    return null
  }

  if (imageUrl === design.heroImage) return 'hero'
  return null
}
