import type { StudioTaxProfile } from '@/stores/studioProfileTypes'

/** Default boilerplate for §19 UStG Kleinunternehmer (no VAT). */
export const STUDIO_DEFAULT_KLEINUNTERNEHMER_NOTE =
  'Gemäß § 19 UStG wird keine Umsatzsteuer berechnet.'

/** Default boilerplate for §13b UStG Reverse Charge (intra-EU B2B). */
export const STUDIO_DEFAULT_REVERSE_CHARGE_NOTE =
  'Steuerschuldnerschaft des Leistungsempfängers (Reverse Charge) gemäß § 13b UStG. The recipient is liable for VAT.'

/** Workspace default: regular German VAT (19%) with quick picks for 7% and 0%. */
export function defaultStudioTaxProfile(): StudioTaxProfile {
  return {
    mode: 'regular_vat',
    defaultVatRatePercent: 19,
    vatRateOptions: [0, 7, 19],
    steuernummer: '',
    ustIdNr: '',
    kleinunternehmerNote: STUDIO_DEFAULT_KLEINUNTERNEHMER_NOTE,
    reverseChargeNote: STUDIO_DEFAULT_REVERSE_CHARGE_NOTE,
    showTaxModeFooterNote: true,
  }
}
