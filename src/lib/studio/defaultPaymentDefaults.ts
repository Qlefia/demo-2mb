import type { StudioPaymentDefaults } from '@/stores/studioProfileTypes'

/** Workspace default payment policy: net 14 days, no Skonto, late-fee disabled. */
export function defaultStudioPaymentDefaults(): StudioPaymentDefaults {
  return {
    netDays: 14,
    skontoPercent: 0,
    skontoDays: 0,
    lateFeePercentPerMonth: 0,
    lateFeeNote: '',
    leistungszeitraumPolicy: 'invoice_date',
  }
}
