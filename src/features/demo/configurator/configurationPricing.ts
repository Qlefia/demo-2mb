import { DESIGN_DEFAULT_KITCHEN, DESIGN_DEFAULT_LIVING } from './designDefaults'
import { DESIGN_PALETTES } from './designPalettes'
import { buildConfigurationZones } from './hotspotUtils'
import type { ConfiguratorManifest, ConfiguratorState, DesignId } from './types'

const PACKAGE_BASE_EUR: Record<DesignId, number> = {
  'design-1': 24_500,
  'design-2': 26_800,
  'design-3': 29_400,
}

/** Fixed upgrade price when this option is selected instead of the package default. */
const OPTION_UPGRADE_EUR: Partial<Record<DesignId, Record<string, number>>> = {
  'design-3': {
    'upper-1': 500,
    'upper-2': 500,
    'splash-1': 390,
    'splash-2': 450,
    'table-2': 420,
    'table-3': 420,
  },
}

const PLACEHOLDER_UPGRADE_EUR = 250

export type ConfigurationQuoteLine = {
  hotspotId: string
  zone: string
  value: string
  amountEur: number
  isDefault: boolean
}

export type ConfigurationQuote = {
  packageName: string
  packageBaseEur: number
  lines: ConfigurationQuoteLine[]
  upgradesEur: number
  totalEur: number
}

function optionUpgradeEur(designId: DesignId, selectedId: string, defaultId: string): number {
  if (selectedId === defaultId) return 0
  return OPTION_UPGRADE_EUR[designId]?.[selectedId] ?? (designId === 'design-3' ? 0 : PLACEHOLDER_UPGRADE_EUR)
}

export function buildConfigurationQuote(
  state: ConfiguratorState,
  manifest: ConfiguratorManifest,
): ConfigurationQuote {
  const defaults = {
    kitchen: DESIGN_DEFAULT_KITCHEN[state.designId],
    living: DESIGN_DEFAULT_LIVING[state.designId],
  }
  const zones = buildConfigurationZones(state, manifest)

  const fieldByHotspot: Record<string, { selectedId: string; defaultId: string }> = {
    'lower-cabinets': {
      selectedId: state.kitchen.colorId,
      defaultId: defaults.kitchen.colorId,
    },
    'upper-cabinets': {
      selectedId: state.kitchen.upperCabinetId,
      defaultId: defaults.kitchen.upperCabinetId,
    },
    backsplash: {
      selectedId: state.kitchen.backsplashId,
      defaultId: defaults.kitchen.backsplashId,
    },
    'wall-color': {
      selectedId: state.living.wallColorId,
      defaultId: defaults.living.wallColorId,
    },
    furniture: {
      selectedId: state.living.tableId,
      defaultId: defaults.living.tableId,
    },
  }

  const lines: ConfigurationQuoteLine[] = zones.map((zone) => {
    const meta = fieldByHotspot[zone.hotspotId]
    const isDefault = meta.selectedId === meta.defaultId
    const amountEur = optionUpgradeEur(state.designId, meta.selectedId, meta.defaultId)
    return {
      hotspotId: zone.hotspotId,
      zone: zone.zone,
      value: zone.value,
      amountEur,
      isDefault,
    }
  })

  const upgradesEur = lines.reduce((sum, line) => sum + line.amountEur, 0)
  const packageBaseEur = PACKAGE_BASE_EUR[state.designId]

  return {
    packageName: DESIGN_PALETTES[state.designId].name,
    packageBaseEur,
    lines,
    upgradesEur,
    totalEur: packageBaseEur + upgradesEur,
  }
}

export function isConfigurationDefault(state: ConfiguratorState): boolean {
  const k = DESIGN_DEFAULT_KITCHEN[state.designId]
  const l = DESIGN_DEFAULT_LIVING[state.designId]
  return (
    state.kitchen.colorId === k.colorId &&
    state.kitchen.upperCabinetId === k.upperCabinetId &&
    state.kitchen.backsplashId === k.backsplashId &&
    state.living.wallColorId === l.wallColorId &&
    state.living.tableId === l.tableId
  )
}

export function formatEuro(amount: number): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function upgradeLabelForOption(
  designId: DesignId,
  optionId: string,
  defaultId: string,
): string | null {
  const amount = optionUpgradeEur(designId, optionId, defaultId)
  return amount > 0 ? `+${formatEuro(amount)}` : null
}
