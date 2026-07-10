import { STUDIO_IBAN_COUNTRY_LENGTHS } from '@/features/studio-settings/constants'

/** Strip whitespace and upper-case an IBAN candidate (does not validate). */
export function normalizeIban(input: string): string {
  return input.replace(/\s+/g, '').toUpperCase()
}

/** ISO 13616 mod-97 check digit verification on a normalized IBAN. */
function ibanMod97(normalized: string): number {
  const rearranged = normalized.slice(4) + normalized.slice(0, 4)
  let remainder = 0
  for (const ch of rearranged) {
    const code = ch.charCodeAt(0)
    const numeric = code >= 48 && code <= 57 ? ch : (code - 55).toString()
    for (const digit of numeric) {
      remainder = (remainder * 10 + (digit.charCodeAt(0) - 48)) % 97
    }
  }
  return remainder
}

export type IbanValidation =
  | { ok: true; iban: string; country: string }
  | { ok: false; reason: 'empty' | 'format' | 'length' | 'country' | 'checksum' }

/** Validate an IBAN: format, country length, and mod-97 checksum. */
export function validateIban(input: string): IbanValidation {
  const normalized = normalizeIban(input)
  if (normalized.length === 0) return { ok: false, reason: 'empty' }
  if (!/^[A-Z0-9]+$/.test(normalized)) return { ok: false, reason: 'format' }
  if (normalized.length < 15 || normalized.length > 34) return { ok: false, reason: 'length' }

  const country = normalized.slice(0, 2)
  const expectedLength = STUDIO_IBAN_COUNTRY_LENGTHS[country]
  if (expectedLength !== undefined && normalized.length !== expectedLength) {
    return { ok: false, reason: 'length' }
  }

  if (ibanMod97(normalized) !== 1) return { ok: false, reason: 'checksum' }

  return { ok: true, iban: normalized, country }
}

/** Pretty-print an IBAN in groups of four for display (does not validate). */
export function formatIbanForDisplay(input: string): string {
  const normalized = normalizeIban(input)
  return normalized.match(/.{1,4}/g)?.join(' ') ?? normalized
}
