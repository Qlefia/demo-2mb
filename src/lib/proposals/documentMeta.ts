import type { DeckLanguage } from '@/lib/proposals/deckLayout'

export function defaultDocumentKindLine(lang: DeckLanguage): string {
  return lang === 'de' ? 'Kommerzielles Angebot' : 'Commercial proposal'
}

export function formatIssuedLine(lang: DeckLanguage, issuedAt: Date): string {
  const locale = lang === 'de' ? 'de-DE' : 'en-GB'
  const d = issuedAt.toLocaleDateString(locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  return lang === 'de' ? `Ausgestellt: ${d}` : `Issued: ${d}`
}

export function formatValidLine(lang: DeckLanguage, validityDays: number): string {
  return lang === 'de'
    ? `Gültigkeit: ${validityDays} Werktage`
    : `Valid: ${validityDays} business days`
}

export function formatSenderBlock(args: {
  legalName: string
  addressLine: string
  registerLine: string | null
}): string {
  const lines = [args.legalName, args.addressLine, args.registerLine?.trim() || ''].filter(Boolean)
  return lines.join('\n')
}

export function formatRecipientAddressBlock(args: {
  companyName: string
  street: string | null
  postalCode: string | null
  locality: string | null
  countryCode: string | null
}): string | null {
  const lines: string[] = []
  if (args.companyName.trim()) lines.push(args.companyName.trim())
  const street = args.street?.trim()
  const postal = args.postalCode?.trim()
  const city = args.locality?.trim()
  const country = args.countryCode?.trim()
  if (street) lines.push(street)
  const cityLine = [postal, city].filter(Boolean).join(' ')
  if (cityLine) lines.push(cityLine)
  if (country) lines.push(country)
  if (lines.length === 0) return null
  return lines.join('\n')
}
