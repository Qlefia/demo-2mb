/** Curated Google Fonts list — downloaded once when added to a kit. */
export const STUDIO_POPULAR_GOOGLE_FONTS = [
  'Inter',
  'Montserrat',
  'Roboto',
  'Open Sans',
  'Lato',
  'Poppins',
  'Oswald',
  'Raleway',
  'Bebas Neue',
  'Playfair Display',
  'Merriweather',
  'DM Sans',
  'Source Sans 3',
  'Nunito',
  'Work Sans',
  'Libre Baskerville',
  'Cormorant Garamond',
  'Space Grotesk',
  'Manrope',
  'Outfit',
] as const

/** Safe system stacks for proposals when no custom upload is used. */
export const STUDIO_SYSTEM_FONT_OPTIONS = [
  'Inter',
  'Arial',
  'Helvetica Neue',
  'Georgia',
  'Times New Roman',
  'Verdana',
  'Tahoma',
  'Trebuchet MS',
] as const

export function brandFontCssFamily(fontId: string, family: string): string {
  const safe = family.replace(/["\\]/g, '').trim() || 'sans-serif'
  return `"brand-font-${fontId}", "${safe}", sans-serif`
}

export function googleFontStylesheetHref(family: string): string {
  const q = family.trim().replace(/\s+/g, '+')
  return `https://fonts.googleapis.com/css2?family=${q}&display=swap`
}
