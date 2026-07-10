import type { HotspotDef, HotspotId } from './types'
import fileOverrides from './hotspot-layout-overrides.json'
import type { HotspotLayoutOverrides } from './hotspotLayoutStorage'

export type HotspotLayoutKey = 'hero' | 'kitchen' | 'wall' | 'workstation'

type HotspotCoord = { x: number; y: number }

/** Percentage positions within the rendered image (0–100), not the letterboxed container. */
export const DEFAULT_LAYOUT_COORDS: Record<
  HotspotLayoutKey,
  Partial<Record<HotspotId, HotspotCoord>>
> = {
  hero: {
    'upper-cabinets': { x: 77.9, y: 37.4 },
    backsplash: { x: 87.8, y: 68.2 },
    'lower-cabinets': { x: 78.8, y: 87.3 },
    'wall-color': { x: 42.4, y: 52.9 },
    furniture: { x: 29.6, y: 87.9 },
  },
  kitchen: {
    'upper-cabinets': { x: 47, y: 14 },
    backsplash: { x: 63, y: 37 },
    'lower-cabinets': { x: 54, y: 47 },
  },
  wall: {
    'upper-cabinets': { x: 86, y: 34 },
    backsplash: { x: 87, y: 46 },
    'lower-cabinets': { x: 86, y: 55 },
    'wall-color': { x: 42, y: 28 },
    furniture: { x: 9, y: 51 },
  },
  workstation: {
    'wall-color': { x: 50, y: 20 },
    furniture: { x: 30, y: 62 },
  },
}

const COMMITTED_OVERRIDES = fileOverrides as HotspotLayoutOverrides

export function getLayoutCoords(
  layout: HotspotLayoutKey,
  sessionOverrides?: HotspotLayoutOverrides,
): Partial<Record<HotspotId, HotspotCoord>> {
  return {
    ...DEFAULT_LAYOUT_COORDS[layout],
    ...COMMITTED_OVERRIDES[layout],
    ...sessionOverrides?.[layout],
  }
}

export function applyHotspotLayout(
  hotspots: HotspotDef[],
  layout: HotspotLayoutKey,
  sessionOverrides?: HotspotLayoutOverrides,
): HotspotDef[] {
  const coords = getLayoutCoords(layout, sessionOverrides)
  return hotspots
    .filter((spot) => coords[spot.id] != null)
    .map((spot) => ({
      ...spot,
      ...coords[spot.id]!,
    }))
}

export function aspectRatioForLayout(layout: HotspotLayoutKey): number {
  switch (layout) {
    case 'kitchen':
      return 4 / 5
    case 'wall':
    case 'workstation':
      return 20 / 11
    default:
      return 9 / 5
  }
}

export function mergeAllLayoutOverrides(
  base: HotspotLayoutOverrides,
  patch: HotspotLayoutOverrides,
): HotspotLayoutOverrides {
  const next: HotspotLayoutOverrides = { ...base }
  for (const layout of Object.keys(patch) as HotspotLayoutKey[]) {
    next[layout] = { ...next[layout], ...patch[layout] }
  }
  return next
}

export function buildFullOverridesFromSession(
  sessionOverrides: HotspotLayoutOverrides,
): HotspotLayoutOverrides {
  const full: HotspotLayoutOverrides = {}
  for (const layout of Object.keys(DEFAULT_LAYOUT_COORDS) as HotspotLayoutKey[]) {
    full[layout] = getLayoutCoords(layout, sessionOverrides)
  }
  return full
}
