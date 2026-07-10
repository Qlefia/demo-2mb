import type { ProjectPropertyType, ProjectSaleStatus, ResidentialProject } from './types'
import { slugifyProjectTitle } from './slugify'
import { projectsCopy } from './copy.en'

const STATUS_LABELS: Record<ProjectSaleStatus, string> = {
  on_sale: projectsCopy.onSale,
  coming_soon: projectsCopy.comingSoon,
  last_units: projectsCopy.lastUnits,
}

const TYPE_LABELS: Record<ProjectPropertyType, string> = {
  residential_complex: projectsCopy.residentialComplex,
  townhouses: projectsCopy.townhouses,
  villas: projectsCopy.villas,
  apartments: projectsCopy.apartments,
  mixed_use: projectsCopy.mixedUse,
}

type WorkRow = {
  id: string
  title: string
  subheader: string
  categoryLabel: string
  taskBody: string
  banner: string | null
  bannerPortrait: string | null
  publicationStatus: string
}

type Enrichment = {
  slug?: string
  title?: string
  heroImage?: string
  galleryImages?: string[]
  city: string
  district: string
  priceFrom: number
  priceCurrency: string
  metroStation?: string
  walkMinutes?: number
  status: ProjectSaleStatus
  propertyType: ProjectPropertyType
  featureTags: ResidentialProject['featureTags']
  amenityTags: string[]
  hasConfigurator?: boolean
  featured?: boolean
  description?: string
}

/** Buyer-facing metadata keyed by studio work id. */
const ENRICHMENT: Record<string, Enrichment> = {
  'w3010001-0023-4000-8000-000000000001': {
    slug: 'residence-tower',
    title: 'Residence Tower',
    city: 'Berlin',
    district: 'Friedrichshain',
    priceFrom: 420_000,
    priceCurrency: 'EUR',
    metroStation: 'Warschauer Straße',
    walkMinutes: 8,
    status: 'on_sale',
    propertyType: 'residential_complex',
    featured: true,
    featureTags: [
      { id: 'series', label: 'Next Series', variant: 'primary' },
      { id: 'start', label: 'Sales launch', variant: 'default' },
      { id: 'river', label: 'River views', variant: 'default' },
      { id: 'park', label: 'Park & courtyard', variant: 'default' },
    ],
    amenityTags: [
      '24 unique interior layouts',
      'Interactive 3D tours',
      'Underground parking',
      'Landscaped courtyard',
      'Unit configurator',
    ],
    description:
      'A new residential complex with 24 individually designed apartments. Explore exteriors, floor plans, cinematic film, and sales gallery materials.',
  },
  'w3010001-0027-4000-8000-000000000001': {
    slug: 'urban-oasis',
    title: 'Urban Oasis',
    heroImage: '/demo/configurator/urban-oasis/design-1/08.jpg',
    galleryImages: [
      '/demo/configurator/urban-oasis/design-1/08.jpg',
      '/demo/configurator/urban-oasis/design-2/08.jpg',
      '/demo/configurator/urban-oasis/design-3/08.jpg',
      '/demo/configurator/urban-oasis/design-3/01.jpg',
    ],
    city: 'Berlin',
    district: 'Mitte',
    priceFrom: 395_000,
    priceCurrency: 'EUR',
    metroStation: 'Naturkundemuseum',
    walkMinutes: 7,
    status: 'on_sale',
    propertyType: 'mixed_use',
    hasConfigurator: true,
    featured: true,
    featureTags: [
      { id: 'studio', label: 'Studio layouts', variant: 'primary' },
      { id: 'configurator', label: 'Interior configurator', variant: 'default' },
      { id: 'tour', label: '360 tour', variant: 'default' },
    ],
    amenityTags: [
      '3 design packages',
      'Kitchen customisation',
      'Kuula 360 walkthrough',
      'Live specification summary',
    ],
    description:
      'Mixed-use office and residential complex with fully designed studio interiors. Configure design package, kitchen cabinets, wall colour, and furniture — then walk the unit in 360.',
  },
  'w3010001-0024-4000-8000-000000000001': {
    city: 'Berlin',
    district: 'Charlottenburg',
    priceFrom: 385_000,
    priceCurrency: 'EUR',
    metroStation: 'Richard-Wagner-Platz',
    walkMinutes: 12,
    status: 'on_sale',
    propertyType: 'residential_complex',
    featured: true,
    featureTags: [
      { id: 'classic', label: 'Modern Classic', variant: 'primary' },
      { id: 'interiors', label: 'Fully designed interiors', variant: 'default' },
    ],
    amenityTags: ['Exterior renders', 'Interior package', '3D tour', 'Sales gallery'],
  },
  'w3010001-0018-4000-8000-000000000001': {
    city: 'Hamburg',
    district: 'HafenCity',
    priceFrom: 510_000,
    priceCurrency: 'EUR',
    metroStation: 'Überseequartier',
    walkMinutes: 6,
    status: 'coming_soon',
    propertyType: 'residential_complex',
    featured: true,
    featureTags: [
      { id: 'waterfront', label: 'Waterfront', variant: 'primary' },
      { id: 'promenade', label: 'Public promenade', variant: 'default' },
    ],
    amenityTags: ['Masterplan', 'Aerial views', 'District renewal', 'Mixed retail'],
  },
  'w3010001-0021-4000-8000-000000000001': {
    city: 'Dubai',
    district: 'Arabian Ranches',
    priceFrom: 1_850_000,
    priceCurrency: 'AED',
    status: 'on_sale',
    propertyType: 'townhouses',
    featureTags: [
      { id: 'premium', label: 'Premium community', variant: 'primary' },
      { id: 'landscape', label: 'Lush landscaping', variant: 'default' },
    ],
    amenityTags: ['Townhouse typologies', 'Pool & garden', 'Exterior package', 'Investor deck'],
  },
  'w3010001-0028-4000-8000-000000000001': {
    city: 'Munich',
    district: 'Trudering',
    priceFrom: 890_000,
    priceCurrency: 'EUR',
    metroStation: 'Trudering',
    walkMinutes: 14,
    status: 'on_sale',
    propertyType: 'townhouses',
    featureTags: [
      { id: 'townhouses', label: 'Townhouse community', variant: 'primary' },
      { id: 'tour', label: '3D tour', variant: 'default' },
    ],
    amenityTags: ['Facade adaptation', 'Cinematic animation', 'Private gardens', 'Family layouts'],
  },
  'w3010001-0025-4000-8000-000000000001': {
    city: 'Innsbruck',
    district: 'Hötting',
    priceFrom: 1_290_000,
    priceCurrency: 'EUR',
    status: 'last_units',
    propertyType: 'villas',
    featureTags: [
      { id: 'views', label: 'Mountain views', variant: 'primary' },
      { id: 'minimal', label: 'Minimalist retreat', variant: 'default' },
    ],
    amenityTags: ['Hillside plot', 'Pool terrace', 'Full design concept'],
  },
  'w3010001-0030-4000-8000-000000000001': {
    city: 'Berlin',
    district: 'Treptow',
    priceFrom: 355_000,
    priceCurrency: 'EUR',
    metroStation: 'Treptower Park',
    walkMinutes: 9,
    status: 'on_sale',
    propertyType: 'residential_complex',
    featureTags: [
      { id: 'integrated', label: 'Integrated development', variant: 'primary' },
    ],
    amenityTags: ['Mixed typologies', 'Public realm', 'Visualization suite'],
  },
  'w3010001-0026-4000-8000-000000000001': {
    city: 'Dubai',
    district: 'Jumeirah Village',
    priceFrom: 2_100_000,
    priceCurrency: 'AED',
    status: 'on_sale',
    propertyType: 'townhouses',
    featureTags: [
      { id: 'duplex', label: 'Three-level duplex', variant: 'primary' },
      { id: 'classic', label: 'Modern Classic', variant: 'default' },
    ],
    amenityTags: ['Townhouse unit', 'Interactive tour', 'Premium sales tool'],
  },
  'w3010001-0017-4000-8000-000000000001': {
    city: 'Zurich',
    district: 'Gold Coast',
    priceFrom: 1_650_000,
    priceCurrency: 'CHF',
    status: 'coming_soon',
    propertyType: 'villas',
    featureTags: [
      { id: 'hillside', label: 'Hillside community', variant: 'primary' },
    ],
    amenityTags: ['Villa cluster', 'Lake views', 'Exterior package'],
  },
  'w3010001-0016-4000-8000-000000000001': {
    city: 'Vienna',
    district: 'Donaustadt',
    priceFrom: 395_000,
    priceCurrency: 'EUR',
    metroStation: 'Stadlau',
    walkMinutes: 11,
    status: 'on_sale',
    propertyType: 'apartments',
    featureTags: [
      { id: 'premium', label: 'Premium residences', variant: 'primary' },
      { id: 'garden', label: 'Symphony Garden', variant: 'default' },
    ],
    amenityTags: ['Garden courtyards', 'Sales stills', 'Facade concepts'],
  },
  'w3010001-0029-4000-8000-000000000001': {
    city: 'Copenhagen',
    district: 'Hellerup',
    priceFrom: 720_000,
    priceCurrency: 'EUR',
    status: 'on_sale',
    propertyType: 'villas',
    featureTags: [
      { id: 'pool', label: 'Pool & garden', variant: 'primary' },
      { id: 'scandi', label: 'Scandinavian', variant: 'default' },
    ],
    amenityTags: ['Family layout', 'Pool visualization', 'Developer website pack'],
  },
  'w3010001-0032-4000-8000-000000000001': {
    city: 'Berlin',
    district: 'Pankow',
    priceFrom: 340_000,
    priceCurrency: 'EUR',
    metroStation: 'Pankow',
    walkMinutes: 7,
    status: 'on_sale',
    propertyType: 'residential_complex',
    featureTags: [
      { id: 'gardens', label: 'Sun gardens', variant: 'primary' },
    ],
    amenityTags: ['Townhouses & apartments', 'Masterplan', '3D animation'],
  },
  'w3010001-0004-4000-8000-000000000001': {
    city: 'Berlin',
    district: 'Mitte',
    priceFrom: 1_150_000,
    priceCurrency: 'EUR',
    metroStation: 'Hausvogteiplatz',
    walkMinutes: 5,
    status: 'last_units',
    propertyType: 'apartments',
    featureTags: [
      { id: 'penthouse', label: 'Penthouse', variant: 'primary' },
      { id: 'skyline', label: 'Skyline views', variant: 'default' },
    ],
    amenityTags: ['Show apartment', 'Luxury finishes', 'City views'],
  },
  'w3010001-0013-4000-8000-000000000001': {
    city: 'Berlin',
    district: 'Tiergarten',
    priceFrom: 980_000,
    priceCurrency: 'EUR',
    metroStation: 'Potsdamer Platz',
    walkMinutes: 6,
    status: 'on_sale',
    propertyType: 'apartments',
    featureTags: [
      { id: 'luxe', label: 'Luxe view', variant: 'primary' },
    ],
    amenityTags: ['Penthouse interior', 'Panoramic glazing', 'Sales gallery'],
  },
  'w3010001-0008-4000-8000-000000000001': {
    city: 'Berlin',
    district: 'Prenzlauer Berg',
    priceFrom: 620_000,
    priceCurrency: 'EUR',
    metroStation: 'Eberswalder Straße',
    walkMinutes: 10,
    status: 'on_sale',
    propertyType: 'apartments',
    featureTags: [
      { id: 'japandi', label: 'Japandi', variant: 'primary' },
    ],
    amenityTags: ['Show apartment', 'Calm palette', 'Natural materials'],
  },
  'w3010001-0015-4000-8000-000000000001': {
    city: 'Starnberg',
    district: 'Lakeside',
    priceFrom: 2_400_000,
    priceCurrency: 'EUR',
    status: 'on_sale',
    propertyType: 'villas',
    featureTags: [
      { id: 'lake', label: 'Lakeside', variant: 'primary' },
      { id: 'private', label: 'Private residence', variant: 'default' },
    ],
    amenityTags: ['Waterfront plot', 'Full interior', 'Wellness zone'],
  },
}

const INCLUDED_WORK_IDS = new Set(Object.keys(ENRICHMENT))

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

function formatPrice(amount: number, currency: string): string {
  if (currency === 'EUR') {
    if (amount >= 1_000_000) return `from €${(amount / 1_000_000).toFixed(2)}M`
    return `from €${Math.round(amount / 1000)}k`
  }
  if (currency === 'AED') return `from ${(amount / 1_000_000).toFixed(2)}M AED`
  if (currency === 'CHF') return `from CHF ${Math.round(amount / 1000)}k`
  return `from ${amount.toLocaleString('en')} ${currency}`
}

export function mapWorkToResidentialProject(work: WorkRow): ResidentialProject | null {
  const meta = ENRICHMENT[work.id]
  const heroImage = work.banner ?? meta?.heroImage
  if (!meta || !heroImage) return null

  const title = meta.title ?? work.title
  const slug = meta.slug ?? slugifyProjectTitle(title)
  const description =
    meta.description ??
    (stripHtml(work.taskBody).slice(0, 280) ||
      `${title} — visualization and sales materials by 2mb.studio.`)

  const galleryImages =
    meta.galleryImages ??
    [work.banner, work.bannerPortrait].filter((url): url is string => Boolean(url))

  return {
    id: work.id,
    slug,
    title,
    subtitle: work.subheader.trim() || TYPE_LABELS[meta.propertyType],
    description,
    city: meta.city,
    district: meta.district,
    locationLabel: `${meta.city} · ${meta.district}`,
    priceFrom: meta.priceFrom,
    priceCurrency: meta.priceCurrency,
    priceLabel: formatPrice(meta.priceFrom, meta.priceCurrency),
    metroStation: meta.metroStation,
    walkMinutes: meta.walkMinutes,
    status: meta.status,
    statusLabel: STATUS_LABELS[meta.status],
    propertyType: meta.propertyType,
    propertyTypeLabel: TYPE_LABELS[meta.propertyType],
    heroImage,
    galleryImages: galleryImages.length > 0 ? galleryImages : [heroImage],
    featureTags: meta.featureTags,
    amenityTags: meta.amenityTags,
    hasConfigurator: meta.hasConfigurator ?? false,
    featured: meta.featured ?? false,
    workCategory: work.categoryLabel,
  }
}

export function isDemoCatalogWorkId(id: string): boolean {
  return INCLUDED_WORK_IDS.has(id)
}

export function getConfiguratorWorkId(): string {
  return 'w3010001-0027-4000-8000-000000000001'
}
