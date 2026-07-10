import type { StudioReview } from '@/stores/studioProfileTypes'

export type StudioWorkAggregateRating = {
  average: number
  count: number
}

function isRatedReviewRating(rating: number | null): rating is number {
  return rating !== null && rating >= 1 && rating <= 5
}

/** Mean star rating from linked reviews that have a 1–5 score; null when none. */
export function aggregateRatingForWork(
  reviews: readonly StudioReview[],
  workId: string,
): StudioWorkAggregateRating | null {
  const ratings = reviews
    .filter((r) => r.linkedWorkIds.includes(workId))
    .map((r) => r.rating)
    .filter(isRatedReviewRating)

  if (ratings.length === 0) return null

  const sum = ratings.reduce((acc, n) => acc + n, 0)
  return { average: sum / ratings.length, count: ratings.length }
}

export function formatAggregateRatingValue(average: number): string {
  const rounded = Math.round(average * 10) / 10
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1)
}
