/** Normalize phone for `tel:` URIs (Easybell softphone / default dialer). */
export function normalizePhoneForTel(raw: string): string | null {
  const trimmed = raw.trim()
  if (!trimmed) return null
  const digits = trimmed.replace(/[^\d+]/g, '')
  if (digits.replace(/\D/g, '').length < 6) return null
  return digits
}

export function buildTelUri(phone: string): string | null {
  const normalized = normalizePhoneForTel(phone)
  return normalized ? `tel:${normalized}` : null
}
