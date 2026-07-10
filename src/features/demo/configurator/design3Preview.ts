import type { ConfiguratorState } from './types'
import type { HotspotLayoutKey } from './hotspotLayouts'
import {
  design3KitchenAsset,
  design3WallAsset,
  design3WorkstationAsset,
  studioAsset,
} from './assets'

const KITCHEN_HOTSPOT_IDS = new Set(['upper-cabinets', 'lower-cabinets', 'backsplash'])

export function resolveDesign3KitchenUrl(kitchen: ConfiguratorState['kitchen']): string {
  const { colorId, upperCabinetId, backsplashId } = kitchen

  if (colorId === 'color-3') {
    if (upperCabinetId === 'upper-2') {
      if (backsplashId === 'splash-1') return design3KitchenAsset.K_3_2_1
      if (backsplashId === 'splash-2') return design3KitchenAsset.K_3_2_2
      return design3KitchenAsset.K_3_2
    }
    if (upperCabinetId === 'upper-1') return design3KitchenAsset.K_3_1
    return design3KitchenAsset.K_3
  }

  if (colorId === 'color-2') return design3KitchenAsset.K_2
  if (colorId === 'color-1') return design3KitchenAsset.K_1
  return design3KitchenAsset.K_3
}

function wallUrl(wallColorId: string): string {
  if (wallColorId === 'wall-2') return design3WallAsset.W_2
  if (wallColorId === 'wall-3') return design3WallAsset.W_3
  return design3WallAsset.W_1
}

function workstationUrl(tableId: string): string {
  if (tableId === 'table-2') return design3WorkstationAsset.Work_station_2
  if (tableId === 'table-3') return design3WorkstationAsset.Work_station_3
  return design3WorkstationAsset.Work_station_1
}

export type PreviewAspect = '9/5' | '4/5' | '20/11'

export type PreviewFrame = {
  url: string
  aspect: PreviewAspect
  hotspotLayout: HotspotLayoutKey
}

const DESIGN3_HERO = studioAsset(3, '08')

export function resolveDesign3PreviewFrame(state: ConfiguratorState): PreviewFrame {
  if (state.activeHotspot && KITCHEN_HOTSPOT_IDS.has(state.activeHotspot)) {
    return resolveDesign3PreviewFrameByLayout(state, 'kitchen')
  }

  if (state.activeHotspot === 'furniture') {
    return resolveDesign3PreviewFrameByLayout(state, 'workstation')
  }

  if (state.activeHotspot === 'wall-color') {
    return resolveDesign3PreviewFrameByLayout(state, 'wall')
  }

  return resolveDesign3PreviewFrameByLayout(state, 'hero')
}

export function resolveDesign3PreviewFrameByLayout(
  state: ConfiguratorState,
  layout: HotspotLayoutKey,
): PreviewFrame {
  switch (layout) {
    case 'kitchen':
      return {
        url: resolveDesign3KitchenUrl(state.kitchen),
        aspect: '4/5',
        hotspotLayout: 'kitchen',
      }
    case 'wall':
      return {
        url: wallUrl(state.living.wallColorId),
        aspect: '20/11',
        hotspotLayout: 'wall',
      }
    case 'workstation':
      return {
        url: workstationUrl(state.living.tableId),
        aspect: '20/11',
        hotspotLayout: 'workstation',
      }
    default:
      return { url: DESIGN3_HERO, aspect: '9/5', hotspotLayout: 'hero' }
  }
}
