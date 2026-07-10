export type ProjectSaleStatus = 'on_sale' | 'coming_soon' | 'last_units'

export type ProjectPropertyType =
  | 'residential_complex'
  | 'townhouses'
  | 'villas'
  | 'apartments'
  | 'mixed_use'

export type ProjectFeatureTag = {
  id: string
  label: string
  variant: 'primary' | 'default'
}

export type ResidentialProject = {
  id: string
  slug: string
  title: string
  subtitle: string
  description: string
  city: string
  district: string
  locationLabel: string
  priceFrom: number
  priceCurrency: string
  priceLabel: string
  metroStation?: string
  walkMinutes?: number
  status: ProjectSaleStatus
  statusLabel: string
  propertyType: ProjectPropertyType
  propertyTypeLabel: string
  heroImage: string
  galleryImages: string[]
  featureTags: ProjectFeatureTag[]
  amenityTags: string[]
  hasConfigurator: boolean
  featured: boolean
  workCategory: string
}

export type ProjectsCatalogFilters = {
  query: string
  city: string
  propertyType: string
  status: string
}

export type ProjectsViewMode = 'card' | 'list'
