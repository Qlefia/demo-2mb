import type { StudioReview } from '@/stores/studioProfileTypes'

export function reviewCardTitle(row: StudioReview, untitled: string): string {
  const a = row.author.trim()
  const c = row.company.trim()
  if (a && c) return `${a} — ${c}`
  if (a) return a
  if (c) return c
  const h = (row.headline ?? '').trim()
  if (h) return h
  return untitled
}

export function reviewListThumbUrl(row: StudioReview): string | null {
  const horizontal = row.portraitDataUrl?.trim()
  if (horizontal) return horizontal
  const portrait = row.portraitPortraitDataUrl?.trim()
  return portrait || null
}

/** Plain-text excerpt for lists — short quote first, then full. */
export function reviewExcerptHtml(row: StudioReview): string {
  const short = row.bodyShort.trim()
  if (short) return short
  return row.bodyBig.trim()
}

export function reviewListSubtitle(row: StudioReview): string | null {
  const role = row.role.trim()
  const company = row.company.trim()
  if (role && company) return `${role} · ${company}`
  if (role) return role
  if (company) return company
  const sub = (row.subtitle ?? '').trim()
  return sub || null
}
