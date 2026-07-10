const MAX_SHARE_LINK_VALIDITY_DAYS = 365

export function parseShareLinkValidityDays(raw: unknown): number | null {
  if (raw === null || raw === undefined || raw === '') return null
  const n = Number.parseInt(String(raw), 10)
  if (!Number.isFinite(n) || n < 1 || n > MAX_SHARE_LINK_VALIDITY_DAYS) return null
  return n
}

export function shareLinkExpiresAtFromStudioGeneral(studioGeneral: unknown): Date | null {
  if (!studioGeneral || typeof studioGeneral !== 'object') return null
  const days = parseShareLinkValidityDays(
    (studioGeneral as Record<string, unknown>).shareLinkValidityDays,
  )
  if (!days) return null
  const expires = new Date()
  expires.setUTCDate(expires.getUTCDate() + days)
  return expires
}
