const MAX_SLUG_LEN = 48

/** URL-safe slug from a studio / workspace display name. */
export function slugifyStudioName(name: string): string {
  const trimmed = name.trim().toLowerCase()
  const ascii = trimmed
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  const base = ascii.length > 0 ? ascii : 'studio'
  return base.slice(0, MAX_SLUG_LEN).replace(/-+$/g, '') || 'studio'
}
