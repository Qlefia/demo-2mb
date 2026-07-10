/** List-card thumbnail: horizontal first, then vertical portrait. */
export function studioDualBannerThumbnail(
  horizontal: string | null | undefined,
  portrait: string | null | undefined,
): string | null {
  const hero = horizontal?.trim()
  if (hero) return hero
  const vertical = portrait?.trim()
  return vertical && vertical.length > 0 ? vertical : null
}
