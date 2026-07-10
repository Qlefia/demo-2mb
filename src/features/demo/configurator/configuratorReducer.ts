import type {
  ConfiguratorState,
  DesignId,
  HotspotId,
  ViewMode,
} from './types'
import { DESIGN_DEFAULT_KITCHEN, DESIGN_DEFAULT_LIVING } from './designDefaults'

export const INITIAL_CONFIGURATOR_STATE: ConfiguratorState = {
  designId: 'design-1',
  viewMode: 'photo',
  activeHotspot: null,
  galleryImageUrl: null,
  kitchen: { ...DESIGN_DEFAULT_KITCHEN['design-1'] },
  living: { ...DESIGN_DEFAULT_LIVING['design-1'] },
}

export type ConfiguratorAction =
  | { type: 'SET_DESIGN'; designId: DesignId }
  | { type: 'SET_VIEW_MODE'; viewMode: ViewMode }
  | { type: 'SET_ACTIVE_HOTSPOT'; hotspotId: HotspotId | null }
  | { type: 'SET_GALLERY_IMAGE'; url: string | null }
  | { type: 'SET_KITCHEN'; field: keyof ConfiguratorState['kitchen']; value: string }
  | { type: 'SET_LIVING'; field: keyof ConfiguratorState['living']; value: string }
  | { type: 'RESET_TO_DEFAULT' }

export function configuratorReducer(
  state: ConfiguratorState,
  action: ConfiguratorAction,
): ConfiguratorState {
  switch (action.type) {
    case 'SET_DESIGN':
      return {
        ...state,
        designId: action.designId,
        activeHotspot: null,
        galleryImageUrl: null,
        kitchen: { ...DESIGN_DEFAULT_KITCHEN[action.designId] },
        living: { ...DESIGN_DEFAULT_LIVING[action.designId] },
      }
    case 'SET_VIEW_MODE':
      return { ...state, viewMode: action.viewMode, activeHotspot: null, galleryImageUrl: null }
    case 'SET_ACTIVE_HOTSPOT':
      return { ...state, activeHotspot: action.hotspotId, galleryImageUrl: null }
    case 'SET_GALLERY_IMAGE':
      return { ...state, galleryImageUrl: action.url }
    case 'SET_KITCHEN':
      if (action.field === 'colorId') {
        const defaults = DESIGN_DEFAULT_KITCHEN[state.designId]
        return {
          ...state,
          galleryImageUrl: null,
          kitchen: {
            colorId: action.value,
            upperCabinetId: defaults.upperCabinetId,
            backsplashId: defaults.backsplashId,
          },
        }
      }
      if (action.field === 'upperCabinetId' && action.value !== 'upper-2') {
        const defaults = DESIGN_DEFAULT_KITCHEN[state.designId]
        return {
          ...state,
          galleryImageUrl: null,
          kitchen: {
            ...state.kitchen,
            upperCabinetId: action.value,
            backsplashId: defaults.backsplashId,
          },
        }
      }
      return {
        ...state,
        galleryImageUrl: null,
        kitchen: { ...state.kitchen, [action.field]: action.value },
      }
    case 'SET_LIVING':
      return {
        ...state,
        galleryImageUrl: null,
        living: { ...state.living, [action.field]: action.value },
      }
    case 'RESET_TO_DEFAULT':
      return {
        ...state,
        activeHotspot: null,
        galleryImageUrl: null,
        kitchen: { ...DESIGN_DEFAULT_KITCHEN[state.designId] },
        living: { ...DESIGN_DEFAULT_LIVING[state.designId] },
      }
    default:
      return state
  }
}
