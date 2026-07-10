import type { StudioBrandProfile } from '@/stores/studioProfileTypes'

export function studioBrandKitNewId(): string {
  return crypto.randomUUID()
}

export function brandKitDisplayName(brand: StudioBrandProfile, untitled: string): string {
  const n = brand.name.trim()
  return n.length > 0 ? n : untitled
}

export function cloneBrandKit(source: StudioBrandProfile, isPrimary: boolean): StudioBrandProfile {
  const id = studioBrandKitNewId()
  const fontIdMap = new Map<string, string>()
  const fonts = source.fonts.map((f) => {
    const nextId = studioBrandKitNewId()
    fontIdMap.set(f.id, nextId)
    return { ...f, id: nextId }
  })
  const mapFontId = (fontId: string | null) =>
    fontId && fontIdMap.has(fontId) ? fontIdMap.get(fontId)! : null
  return {
    ...source,
    id,
    isPrimary,
    name: source.name.trim() ? `${source.name.trim()} (copy)` : '',
    accentFontId: mapFontId(source.accentFontId),
    bodyFontId: mapFontId(source.bodyFontId),
    logos: source.logos.map((l) => ({ ...l, id: studioBrandKitNewId() })),
    fonts,
    colors: source.colors.map((c) => ({ ...c, id: studioBrandKitNewId() })),
    socialNetworks: source.socialNetworks.map((n) => ({ ...n, id: studioBrandKitNewId() })),
  }
}
