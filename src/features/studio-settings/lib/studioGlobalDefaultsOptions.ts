/** Default written language for proposal templates (matches app locales). */
export const STUDIO_PROPOSAL_DEFAULT_LOCALES = ['de', 'en', 'ru'] as const
export type StudioProposalDefaultLocale = (typeof STUDIO_PROPOSAL_DEFAULT_LOCALES)[number]

/** Display / quote currency codes (ISO 4217) — picklist until workspace sync adds full catalog. */
export const STUDIO_DISPLAY_CURRENCIES = [
  'EUR',
  'GBP',
  'CHF',
  'USD',
  'PLN',
  'DKK',
  'SEK',
  'NOK',
  'CZK',
  'HUF',
] as const
export type StudioDisplayCurrency = (typeof STUDIO_DISPLAY_CURRENCIES)[number]

/** IANA zones commonly used by EU studios (subset; expand when syncing to backend). */
export const STUDIO_TIMEZONES = [
  'UTC',
  'Europe/London',
  'Europe/Dublin',
  'Europe/Lisbon',
  'Europe/Paris',
  'Europe/Brussels',
  'Europe/Amsterdam',
  'Europe/Berlin',
  'Europe/Zurich',
  'Europe/Vienna',
  'Europe/Rome',
  'Europe/Madrid',
  'Europe/Warsaw',
  'Europe/Prague',
  'Europe/Stockholm',
  'Europe/Oslo',
  'Europe/Copenhagen',
  'Europe/Helsinki',
  'Europe/Athens',
  'Europe/Bucharest',
] as const
export type StudioTimezoneOption = (typeof STUDIO_TIMEZONES)[number]
