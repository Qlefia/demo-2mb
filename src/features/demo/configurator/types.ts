export type DesignId = 'design-1' | 'design-2' | 'design-3'
export type ViewMode = 'photo' | '360' | 'video'

export type HotspotId =
  | 'upper-cabinets'
  | 'lower-cabinets'
  | 'backsplash'
  | 'wall-color'
  | 'furniture'

export type HotspotOptionKey =
  | 'upperCabinets'
  | 'backsplashes'
  | 'colors'
  | 'wallColors'
  | 'tables'

export type OptionChoice = {
  id: string
  label: string
  imageUrl: string
  description?: string
}

export type HotspotDef = {
  id: HotspotId
  label: string
  x: number
  y: number
  optionKey: HotspotOptionKey
  pickerTitle: string
}

export type KitchenAssets = {
  preview: string
  colors: OptionChoice[]
  upperCabinets: OptionChoice[]
  backsplashes: OptionChoice[]
  hotspots: HotspotDef[]
}

export type LivingAssets = {
  wideHall: OptionChoice[]
  tables: OptionChoice[]
  wallHotspot: HotspotDef
  furnitureHotspot: HotspotDef
}

export type DesignPackage = {
  id: DesignId
  label: string
  kuulaEmbedUrl?: string
  heroImage: string
  gallery: string[]
  kitchen: KitchenAssets
  living: LivingAssets
}

export type ConfiguratorProjectTag = {
  id: string
  label: string
  variant?: 'primary' | 'muted'
}

export type DemoProject = {
  slug: string
  title: string
  subtitle: string
  description: string
  heroImage: string
  location: string
  tags: ConfiguratorProjectTag[]
  amenityTags: string[]
}

export type ConfiguratorManifest = {
  project: DemoProject
  designs: Record<DesignId, DesignPackage>
}

export type ConfiguratorState = {
  designId: DesignId
  viewMode: ViewMode
  activeHotspot: HotspotId | null
  /** When set, main preview shows this gallery still instead of live configuration. */
  galleryImageUrl: string | null
  kitchen: {
    colorId: string
    upperCabinetId: string
    backsplashId: string
  }
  living: {
    wallColorId: string
    tableId: string
  }
}
