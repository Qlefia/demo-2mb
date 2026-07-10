import type { HotspotId } from './types'
import type { HotspotLayoutKey } from './hotspotLayouts'

export type HotspotCoord = { x: number; y: number }

export type HotspotLayoutOverrides = Partial<
  Record<HotspotLayoutKey, Partial<Record<HotspotId, HotspotCoord>>>
>

export const HOTSPOT_LAYOUT_STORAGE_KEY = 'urban-oasis-hotspot-layout-overrides'

export function loadHotspotOverridesFromStorage(): HotspotLayoutOverrides {
  if (typeof window === 'undefined') return {}
  try {
    const raw = window.localStorage.getItem(HOTSPOT_LAYOUT_STORAGE_KEY)
    if (!raw) return {}
    return JSON.parse(raw) as HotspotLayoutOverrides
  } catch {
    return {}
  }
}

export function saveHotspotOverridesToStorage(overrides: HotspotLayoutOverrides): void {
  window.localStorage.setItem(HOTSPOT_LAYOUT_STORAGE_KEY, JSON.stringify(overrides, null, 2))
}

export function clearHotspotOverridesFromStorage(): void {
  window.localStorage.removeItem(HOTSPOT_LAYOUT_STORAGE_KEY)
}

export function formatOverridesAsTypeScript(overrides: HotspotLayoutOverrides): string {
  const lines = ['export const HOTSPOT_LAYOUT_OVERRIDES = {']
  for (const [layout, coords] of Object.entries(overrides)) {
    if (!coords || Object.keys(coords).length === 0) continue
    lines.push(`  ${layout}: {`)
    for (const [id, point] of Object.entries(coords)) {
      if (!point) continue
      lines.push(`    '${id}': { x: ${point.x}, y: ${point.y} },`)
    }
    lines.push('  },')
  }
  lines.push('} as const')
  return lines.join('\n')
}
