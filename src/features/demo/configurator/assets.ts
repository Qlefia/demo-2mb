const BASE = '/demo/configurator/urban-oasis'

/** Grey swatch for designs without configuration assets yet. */
export const CONFIGURATOR_PLACEHOLDER = '/demo/configurator/placeholder.svg'

/** Studio render from client materials (`материалы/DRL_studio_Design N_XX_jpeg.jpg`). */
export function studioAsset(design: 1 | 2 | 3, frame: string): string {
  return `${BASE}/design-${design}/${frame}.jpg`
}

const D3 = `${BASE}/design-3`

/** Graphic Pop — kitchen crops (`материалы/K_*.jpg`). */
export const design3KitchenAsset = {
  K_1: `${D3}/K_1.jpg`,
  K_2: `${D3}/K_2.jpg`,
  K_3: `${D3}/K_3.jpg`,
  K_3_1: `${D3}/K_3_1.jpg`,
  K_3_2: `${D3}/K_3_2.jpg`,
  K_3_2_1: `${D3}/K_3_2_1.jpg`,
  K_3_2_2: `${D3}/K_3_2_2.jpg`,
} as const

/** Graphic Pop — living wall variants (`материалы/W_*.jpg`). */
export const design3WallAsset = {
  W_1: `${D3}/W_1.jpg`,
  W_2: `${D3}/W_2.jpg`,
  W_3: `${D3}/W_3.jpg`,
} as const

/** Graphic Pop — work zone variants (`материалы/Work_station_*.jpg`). */
export const design3WorkstationAsset = {
  Work_station_1: `${D3}/Work_station_1.jpg`,
  Work_station_2: `${D3}/Work_station_2.jpg`,
  Work_station_3: `${D3}/Work_station_3.jpg`,
} as const

/** Kuula embed params aligned with 2mb.studio case study tours. */
function kuulaCollectionEmbed(collectionId: string): string {
  const params = new URLSearchParams({
    logo: '-1',
    info: '0',
    fs: '1',
    vr: '1',
    autorotate: '0.18',
    thumbs: '-1',
    inst: '0',
    margin: '5',
    initload: '1',
    chromeless: '1',
  })

  return `https://2mb-studio.de/share/collection/${collectionId}?${params.toString()}`
}

/** Claret Loft — studio apartment tour (Urban Oasis case study). */
export const KUULA_URBAN_OASIS = kuulaCollectionEmbed('7XDlm')

/** Apartment fly-through — encoded from `материалы/Apartment_new.mov` (H.264, faststart). */
export const URBAN_OASIS_APARTMENT_VIDEO = `${BASE}/apartment-tour.mp4`
