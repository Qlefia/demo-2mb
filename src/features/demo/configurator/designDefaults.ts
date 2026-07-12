import type { DesignId } from './types'

export const DESIGN_DEFAULT_KITCHEN: Record<
  DesignId,
  { colorId: string; upperCabinetId: string; backsplashId: string }
> = {
  'design-1': { colorId: 'color-1', upperCabinetId: 'upper-1', backsplashId: 'splash-1' },
  'design-2': { colorId: 'color-1', upperCabinetId: 'upper-1', backsplashId: 'splash-1' },
  'design-3': { colorId: 'color-1', upperCabinetId: 'upper-closed', backsplashId: 'splash-default' },
}

export const DESIGN_DEFAULT_LIVING: Record<
  DesignId,
  { wallColorId: string; tableId: string }
> = {
  'design-1': { wallColorId: 'wall-1', tableId: 'table-1' },
  'design-2': { wallColorId: 'wall-1', tableId: 'table-1' },
  'design-3': { wallColorId: 'wall-1', tableId: 'table-1' },
}
