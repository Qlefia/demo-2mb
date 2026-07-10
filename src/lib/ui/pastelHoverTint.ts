/** Soft hover fills — YouTube-style list row tints (light UI). */
export const PASTEL_HOVER_TINTS = [
  '#fde2e4',
  '#e2eafc',
  '#e2f5e8',
  '#ede7f6',
  '#fff3e0',
  '#e0f7fa',
  '#f3e5f5',
  '#f1f8e9',
] as const

function hashString(value: string): number {
  let hash = 0
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

/** Stable pseudo-random pastel per key (user id, tab id, …). */
export function pickPastelHoverTint(key: string, salt = 0): string {
  const index = (hashString(key) + salt) % PASTEL_HOVER_TINTS.length
  return PASTEL_HOVER_TINTS[index]!
}

/** One random tint from the shared palette (client-only decorative use). */
export function pickRandomPastelHoverTint(): string {
  const index = Math.floor(Math.random() * PASTEL_HOVER_TINTS.length)
  return PASTEL_HOVER_TINTS[index]!
}
