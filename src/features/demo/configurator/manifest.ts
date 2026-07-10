import {
  CONFIGURATOR_PLACEHOLDER,
  KUULA_URBAN_OASIS,
  design3KitchenAsset,
  design3WallAsset,
  design3WorkstationAsset,
  studioAsset,
} from './assets'
import type { ConfiguratorManifest, DesignId, DesignPackage, OptionChoice } from './types'

const KITCHEN_HOTSPOTS: DesignPackage['kitchen']['hotspots'] = [
  {
    id: 'upper-cabinets',
    label: 'Upper cabinets',
    x: 84,
    y: 17,
    optionKey: 'upperCabinets',
    pickerTitle: 'Upper cabinet style',
  },
  {
    id: 'backsplash',
    label: 'Backsplash',
    x: 81,
    y: 33,
    optionKey: 'backsplashes',
    pickerTitle: 'Backsplash',
  },
  {
    id: 'lower-cabinets',
    label: 'Cabinet colour',
    x: 79,
    y: 49,
    optionKey: 'colors',
    pickerTitle: 'Lower cabinet colour',
  },
]

function livingHotspots(): Pick<DesignPackage['living'], 'wallHotspot' | 'furnitureHotspot'> {
  return {
    wallHotspot: {
      id: 'wall-color',
      label: 'Wall colour',
      x: 41,
      y: 27,
      optionKey: 'wallColors',
      pickerTitle: 'Wall colour',
    },
    furnitureHotspot: {
      id: 'furniture',
      label: 'Work zone',
      x: 15,
      y: 56,
      optionKey: 'tables',
      pickerTitle: 'Work zone',
    },
  }
}

function galleryForDesign(n: 1 | 2 | 3): string[] {
  const main = studioAsset(n, '08')
  const rest = Array.from({ length: 9 }, (_, i) => studioAsset(n, String(i + 1).padStart(2, '0'))).filter(
    (url) => url !== main,
  )
  return [main, ...rest]
}

function placeholderChoices(
  specs: { id: string; label: string }[],
): OptionChoice[] {
  return specs.map((spec) => ({
    id: spec.id,
    label: spec.label,
    imageUrl: CONFIGURATOR_PLACEHOLDER,
  }))
}

function designPackage(
  id: DesignId,
  label: string,
  n: 1 | 2 | 3,
  kuulaEmbedUrl: string | undefined,
  kitchen: {
    colors: OptionChoice[]
    upperCabinets: OptionChoice[]
    backsplashes: OptionChoice[]
  },
  living: {
    wideHall: OptionChoice[]
    tables: OptionChoice[]
  },
  visual?: { gallery?: string[] },
): DesignPackage {
  const main = studioAsset(n, '08')

  return {
    id,
    label,
    kuulaEmbedUrl,
    heroImage: main,
    gallery: visual?.gallery ?? galleryForDesign(n),
    kitchen: {
      preview: main,
      colors: kitchen.colors,
      upperCabinets: kitchen.upperCabinets,
      backsplashes: kitchen.backsplashes,
      hotspots: KITCHEN_HOTSPOTS,
    },
    living: {
      wideHall: living.wideHall,
      tables: living.tables,
      ...livingHotspots(),
    },
  }
}

const PLACEHOLDER_KITCHEN_COLORS = placeholderChoices([
  { id: 'color-1', label: 'Package default' },
  { id: 'color-2', label: 'Kitchen variant A' },
  { id: 'color-3', label: 'Kitchen variant B' },
])

const PLACEHOLDER_UPPER = placeholderChoices([
  { id: 'upper-1', label: 'Package default' },
  { id: 'upper-2', label: 'Variant A' },
  { id: 'upper-3', label: 'Variant B' },
])

const PLACEHOLDER_BACKSPLASH = placeholderChoices([
  { id: 'splash-1', label: 'Package default' },
  { id: 'splash-2', label: 'Variant A' },
  { id: 'splash-3', label: 'Variant B' },
])

const PLACEHOLDER_WALLS = placeholderChoices([
  { id: 'wall-1', label: 'Wall colour 1' },
  { id: 'wall-2', label: 'Wall colour 2' },
  { id: 'wall-3', label: 'Wall colour 3' },
])

const PLACEHOLDER_TABLES = placeholderChoices([
  { id: 'table-1', label: 'Package default' },
  { id: 'table-2', label: 'Work zone A' },
  { id: 'table-3', label: 'Work zone B' },
])

export const CONFIGURATOR_MANIFEST: ConfiguratorManifest = {
  project: {
    slug: 'urban-oasis',
    title: 'Urban Oasis',
    subtitle: 'Studio apartment · mixed-use complex',
    description:
      'Mixed-use office and residential complex with fully designed studio interiors. Configure your package, kitchen, walls, and work zone — with a live 360 tour.',
    heroImage: studioAsset(1, '08'),
    location: 'Berlin · Mitte',
    tags: [
      { id: 'location', label: 'Berlin · Mitte', variant: 'primary' },
      { id: 'status', label: 'On sale', variant: 'muted' },
      { id: 'type', label: 'Mixed use', variant: 'muted' },
      { id: 'from', label: 'from €395k', variant: 'muted' },
    ],
    amenityTags: ['Studio layouts', '3 design packages', 'Kitchen customisation', '360 tour'],
  },
  designs: {
    'design-1': designPackage(
      'design-1',
      'Claret Loft',
      1,
      KUULA_URBAN_OASIS,
      {
        colors: PLACEHOLDER_KITCHEN_COLORS,
        upperCabinets: PLACEHOLDER_UPPER,
        backsplashes: PLACEHOLDER_BACKSPLASH,
      },
      {
        wideHall: PLACEHOLDER_WALLS,
        tables: PLACEHOLDER_TABLES,
      },
    ),
    'design-2': designPackage(
      'design-2',
      'Sage & Cobalt',
      2,
      KUULA_URBAN_OASIS,
      {
        colors: PLACEHOLDER_KITCHEN_COLORS,
        upperCabinets: PLACEHOLDER_UPPER,
        backsplashes: PLACEHOLDER_BACKSPLASH,
      },
      {
        wideHall: PLACEHOLDER_WALLS,
        tables: PLACEHOLDER_TABLES,
      },
    ),
    'design-3': designPackage(
      'design-3',
      'Graphic Pop',
      3,
      KUULA_URBAN_OASIS,
      {
        colors: [
          { id: 'color-1', label: 'Blue & white', imageUrl: design3KitchenAsset.K_1 },
          { id: 'color-2', label: 'Beige', imageUrl: design3KitchenAsset.K_2 },
          { id: 'color-3', label: 'Olive green', imageUrl: design3KitchenAsset.K_3 },
        ],
        upperCabinets: [
          { id: 'upper-1', label: 'Open white shelves', imageUrl: design3KitchenAsset.K_3_1 },
          { id: 'upper-2', label: 'Open blue shelves', imageUrl: design3KitchenAsset.K_3_2 },
        ],
        backsplashes: [
          { id: 'splash-1', label: 'Green vertical tile', imageUrl: design3KitchenAsset.K_3_2_1 },
          { id: 'splash-2', label: 'Burgundy tile', imageUrl: design3KitchenAsset.K_3_2_2 },
        ],
      },
      {
        wideHall: [
          { id: 'wall-1', label: 'White walls', imageUrl: design3WallAsset.W_1 },
          { id: 'wall-2', label: 'Sage green walls', imageUrl: design3WallAsset.W_2 },
          { id: 'wall-3', label: 'Cobalt blue walls', imageUrl: design3WallAsset.W_3 },
        ],
        tables: [
          { id: 'table-1', label: 'Red chair', imageUrl: design3WorkstationAsset.Work_station_1 },
          { id: 'table-2', label: 'Green chair', imageUrl: design3WorkstationAsset.Work_station_2 },
          { id: 'table-3', label: 'Purple chair', imageUrl: design3WorkstationAsset.Work_station_3 },
        ],
      },
      {
        gallery: galleryForDesign(3),
      },
    ),
  },
}

export const DEMO_PROJECTS = [CONFIGURATOR_MANIFEST.project]

export function getProjectBySlug(slug: string) {
  if (CONFIGURATOR_MANIFEST.project.slug === slug) return CONFIGURATOR_MANIFEST.project
  return null
}

export function getManifestForProject(slug: string): ConfiguratorManifest | null {
  if (CONFIGURATOR_MANIFEST.project.slug === slug) return CONFIGURATOR_MANIFEST
  return null
}
