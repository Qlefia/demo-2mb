/** Max brand kits per studio (Brand Kit page). General tab still edits one primary kit. */
export const STUDIO_BRAND_PROFILE_MAX = 12

export function pickSingleStudioBrand<T extends { isPrimary: boolean }>(brands: readonly T[]): T[] {
  if (brands.length === 0) return []
  const picked = brands.find((b) => b.isPrimary) ?? brands[0]
  return [{ ...picked, isPrimary: true }]
}
