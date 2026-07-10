import type { DesignId, HotspotDef } from './types'
import type { HotspotSelection } from './hotspotUtils'

const DESIGN3_OPTION_DESCRIPTIONS: Record<string, string> = {
  'color-1': 'Matte lacquer fronts in deep blue with white worktop and brushed metal pulls.',
  'color-2': 'Warm beige MDF fronts with stone-look countertop and minimal hardware.',
  'color-3': 'Olive green lacquer with black countertop and satin brass details.',
  'upper-1': 'Open white powder-coated shelves — display storage above the work zone.',
  'upper-2': 'Open cobalt shelves with burgundy tile field visible behind.',
  'splash-1': 'Vertical sage ceramic tile with light grout — graphic rhythm on the backsplash.',
  'splash-2': 'Burgundy square tile with contrasting grout — bold pop-art accent.',
  'wall-1': 'Matte white mineral paint — clean gallery backdrop for furniture.',
  'wall-2': 'Sage green emulsion — soft contrast to cobalt and olive accents.',
  'wall-3': 'Cobalt blue feature wall — anchors the work zone and shelving.',
  'table-1': 'Red upholstered task chair on oak legs — primary accent in the work zone.',
  'table-2': 'Green upholstered task chair — pairs with sage wall option.',
  'table-3': 'Purple upholstered task chair — ties to shelving and tile accents.',
}

const ZONE_INTRO: Record<HotspotDef['id'], string> = {
  'lower-cabinets': 'Base cabinetry, worktop, and plinth — defines the kitchen colour story.',
  'upper-cabinets': 'Overhead storage and open shelving above the counter.',
  backsplash: 'Splashback tile or panel behind the hob and prep zone.',
  'wall-color': 'Main wall finish in the living and work area.',
  furniture: 'Desk, chair, and work-zone styling in the studio niche.',
}

const PLACEHOLDER_OPTION_DESCRIPTION =
  'Specification and supplier details will be confirmed in the final package sheet.'

export function zoneIntroForHotspot(hotspotId: HotspotDef['id']): string {
  return ZONE_INTRO[hotspotId]
}

export function selectedMaterialDescription(
  designId: DesignId,
  hotspot: HotspotDef,
  selection: HotspotSelection,
): string {
  if (designId === 'design-3') {
    if (hotspot.optionKey === 'upperCabinets' && selection.selectedId === 'upper-closed') {
      return 'Closed upper fronts in the same olive lacquer as lower cabinets — clean, continuous line.'
    }
    if (hotspot.optionKey === 'backsplashes' && selection.selectedId === 'splash-default') {
      return 'Grey geometric ceramic tile with tonal grout — default pairing with blue shelves.'
    }
    const fromOption = DESIGN3_OPTION_DESCRIPTIONS[selection.selectedId]
    if (fromOption) return fromOption
  }

  const selected = selection.options.find((option) => option.id === selection.selectedId)
  if (selected?.description) return selected.description

  if (selection.options.length > 0) {
    return PLACEHOLDER_OPTION_DESCRIPTION
  }

  return ZONE_INTRO[hotspot.id]
}
