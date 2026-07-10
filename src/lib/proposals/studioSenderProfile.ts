/** Map workspace studio `general` jsonb → proposal sender letterhead block. */
export function organizationProfileFromStudioGeneral(
  general: unknown,
): { legalName: string; addressLine: string; registerLine: string | null } | null {
  if (!general || typeof general !== 'object') return null
  const g = general as Record<string, unknown>

  const legalName = [g.legalEntityName, g.tradingName]
    .map((v) => (typeof v === 'string' ? v.trim() : ''))
    .find(Boolean)
  if (!legalName) return null

  const street = typeof g.addressStreet === 'string' ? g.addressStreet.trim() : ''
  const line2 = typeof g.addressLine2 === 'string' ? g.addressLine2.trim() : ''
  const postal = typeof g.addressPostalCode === 'string' ? g.addressPostalCode.trim() : ''
  const city = typeof g.addressLocality === 'string' ? g.addressLocality.trim() : ''
  const country = typeof g.addressCountry === 'string' ? g.addressCountry.trim() : ''

  const cityLine = [postal, city].filter(Boolean).join(' ')
  const addressLine = [street, line2, cityLine, country].filter(Boolean).join(', ')
  if (!addressLine) return null

  const registerRaw = typeof g.registrationDetails === 'string' ? g.registrationDetails.trim() : ''
  const phone = typeof g.officePhone === 'string' ? g.officePhone.trim() : ''
  const email = typeof g.officeEmail === 'string' ? g.officeEmail.trim() : ''
  const contactBits = [phone, email].filter(Boolean).join(' · ')
  const registerLine = [registerRaw, contactBits].filter(Boolean).join('\n') || null

  return { legalName, addressLine, registerLine }
}
