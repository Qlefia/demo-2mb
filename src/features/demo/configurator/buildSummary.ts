import type { ConfiguratorManifest, ConfiguratorState } from './types'
import { DESIGN_PALETTES } from './designPalettes'

function labelFor<T extends { id: string; label: string }>(options: T[], id: string): string {
  if (id === 'upper-closed') return 'Closed — match lower'
  if (id === 'splash-default') return 'Grey geometric tile'
  return options.find((o) => o.id === id)?.label ?? id
}

export function buildSummaryLines(state: ConfiguratorState, manifest: ConfiguratorManifest): string[] {
  const design = manifest.designs[state.designId]
  const palette = DESIGN_PALETTES[state.designId]
  const { kitchen, living } = design

  return [
    palette.name,
    `Kitchen: ${labelFor(kitchen.colors, state.kitchen.colorId)} · ${labelFor(kitchen.upperCabinets, state.kitchen.upperCabinetId)} · ${labelFor(kitchen.backsplashes, state.kitchen.backsplashId)}`,
    `Walls: ${labelFor(living.wideHall, state.living.wallColorId)}`,
    `Furniture: ${labelFor(living.tables, state.living.tableId)}`,
  ]
}
