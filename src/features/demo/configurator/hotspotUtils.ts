import type {
  ConfiguratorManifest,
  ConfiguratorState,
  DesignPackage,
  HotspotDef,
  HotspotId,
  OptionChoice,
} from './types'

export function getAllHotspots(design: DesignPackage): HotspotDef[] {
  return [...design.kitchen.hotspots, design.living.wallHotspot, design.living.furnitureHotspot]
}

/** Sidebar list order — kitchen first (lower → upper → backsplash), then room. */
const CONFIGURATION_ZONE_ORDER: HotspotId[] = [
  'lower-cabinets',
  'upper-cabinets',
  'backsplash',
  'wall-color',
  'furniture',
]

export function getConfigurationHotspots(design: DesignPackage): HotspotDef[] {
  const byId = new Map(getAllHotspots(design).map((spot) => [spot.id, spot]))
  return CONFIGURATION_ZONE_ORDER.map((id) => byId.get(id)).filter(
    (spot): spot is HotspotDef => spot != null,
  )
}

export function findHotspot(design: DesignPackage, id: HotspotId): HotspotDef | undefined {
  return getAllHotspots(design).find((spot) => spot.id === id)
}

export type HotspotSelection = {
  options: OptionChoice[]
  selectedId: string
  zoneLabel: string
}

const DESIGN3_UPPER_CLOSED_LABEL = 'Closed — match lower'
const DESIGN3_SPLASH_DEFAULT_LABEL = 'Grey geometric tile'

export { DESIGN3_UPPER_CLOSED_LABEL, DESIGN3_SPLASH_DEFAULT_LABEL }

function design3SelectedLabel(
  hotspot: HotspotDef,
  selectedId: string,
  options: OptionChoice[],
): string {
  if (hotspot.optionKey === 'upperCabinets' && selectedId === 'upper-closed') {
    return DESIGN3_UPPER_CLOSED_LABEL
  }
  if (hotspot.optionKey === 'backsplashes' && selectedId === 'splash-default') {
    return DESIGN3_SPLASH_DEFAULT_LABEL
  }
  return options.find((option) => option.id === selectedId)?.label ?? selectedId
}

export function resolveHotspotSelection(
  state: ConfiguratorState,
  design: DesignPackage,
  hotspot: HotspotDef,
): HotspotSelection {
  const base = resolveHotspotSelectionBase(state, design, hotspot)

  if (state.designId !== 'design-3') {
    return base
  }

  if (hotspot.optionKey === 'upperCabinets') {
    if (state.kitchen.colorId !== 'color-3') {
      return { ...base, options: [] }
    }
    return base
  }

  if (hotspot.optionKey === 'backsplashes') {
    if (state.kitchen.colorId !== 'color-3' || state.kitchen.upperCabinetId !== 'upper-2') {
      return { ...base, options: [] }
    }
    return base
  }

  return base
}

function resolveHotspotSelectionBase(
  state: ConfiguratorState,
  design: DesignPackage,
  hotspot: HotspotDef,
): HotspotSelection {
  switch (hotspot.optionKey) {
    case 'upperCabinets':
      return {
        zoneLabel: 'Upper cabinets',
        options: design.kitchen.upperCabinets,
        selectedId: state.kitchen.upperCabinetId,
      }
    case 'backsplashes':
      return {
        zoneLabel: 'Backsplash',
        options: design.kitchen.backsplashes,
        selectedId: state.kitchen.backsplashId,
      }
    case 'colors':
      return {
        zoneLabel: 'Lower cabinets',
        options: design.kitchen.colors,
        selectedId: state.kitchen.colorId,
      }
    case 'wallColors':
      return {
        zoneLabel: 'Wall colour',
        options: design.living.wideHall,
        selectedId: state.living.wallColorId,
      }
    case 'tables':
      return {
        zoneLabel: 'Work zone',
        options: design.living.tables,
        selectedId: state.living.tableId,
      }
    default:
      return { zoneLabel: hotspot.label, options: [], selectedId: '' }
  }
}

export type ConfigurationZone = {
  hotspotId: HotspotId
  zone: string
  value: string
}

export function buildConfigurationZones(
  state: ConfiguratorState,
  manifest: ConfiguratorManifest,
): ConfigurationZone[] {
  const design = manifest.designs[state.designId]
  return getConfigurationHotspots(design).map((hotspot) => {
    const selection = resolveHotspotSelection(state, design, hotspot)
    const value = formatHotspotZoneValue(state, design, hotspot, selection)
    return {
      hotspotId: hotspot.id,
      zone: selection.zoneLabel,
      value,
    }
  })
}

export function formatHotspotZoneValue(
  state: ConfiguratorState,
  design: DesignPackage,
  hotspot: HotspotDef,
  selection: HotspotSelection = resolveHotspotSelection(state, design, hotspot),
): string {
  if (state.designId === 'design-3') {
    return design3SelectedLabel(hotspot, selection.selectedId, selection.options)
  }
  return (
    selection.options.find((option) => option.id === selection.selectedId)?.label ??
    selection.selectedId
  )
}

export type HotspotSelectAction =
  | { type: 'SET_KITCHEN'; field: 'colorId' | 'upperCabinetId' | 'backsplashId'; value: string }
  | { type: 'SET_LIVING'; field: 'wallColorId' | 'tableId'; value: string }

export function hotspotSelectAction(hotspot: HotspotDef, optionId: string): HotspotSelectAction {
  switch (hotspot.optionKey) {
    case 'upperCabinets':
      return { type: 'SET_KITCHEN', field: 'upperCabinetId', value: optionId }
    case 'backsplashes':
      return { type: 'SET_KITCHEN', field: 'backsplashId', value: optionId }
    case 'colors':
      return { type: 'SET_KITCHEN', field: 'colorId', value: optionId }
    case 'wallColors':
      return { type: 'SET_LIVING', field: 'wallColorId', value: optionId }
    case 'tables':
      return { type: 'SET_LIVING', field: 'tableId', value: optionId }
    default:
      return { type: 'SET_KITCHEN', field: 'colorId', value: optionId }
  }
}
