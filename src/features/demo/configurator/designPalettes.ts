import type { DesignId } from './types'

export type DesignPaletteMeta = {
  id: DesignId
  name: string
  description: string
}

export const DESIGN_PALETTES: Record<DesignId, DesignPaletteMeta> = {
  'design-1': {
    id: 'design-1',
    name: 'Claret Loft',
    description:
      'Deep, warm claret red with an industrial touch — sophisticated, cozy, and enveloping.',
  },
  'design-2': {
    id: 'design-2',
    name: 'Sage & Cobalt',
    description:
      'Calm sage green energized by bold cobalt blue — a space for focus and creativity.',
  },
  'design-3': {
    id: 'design-3',
    name: 'Graphic Pop',
    description:
      'High-energy pop-art mood — bold geometry and primary accents for a dynamic, expressive space.',
  },
}

export const DESIGN_PALETTE_LIST = Object.values(DESIGN_PALETTES)
