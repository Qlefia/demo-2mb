/** User-typed links often omit the scheme — normalize before validation/storage. */
export function normalizeExternalUrl(raw: string): string | null {
  const trimmed = raw.trim()
  if (!trimmed) return null
  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
  const url = new URL(withScheme)
  return url.toString().slice(0, 2000)
}

export function tryNormalizeExternalUrl(raw: string): string | null {
  try {
    return normalizeExternalUrl(raw)
  } catch {
    return null
  }
}
