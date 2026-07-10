import type { StudioBankAccount } from '@/stores/studioProfileTypes'

/** New profiles start with an empty list; the user adds the first account through the Invoicing tab. */
export function defaultStudioBankAccounts(): StudioBankAccount[] {
  return []
}

/** Shape for a newly added row in the editor (placeholder copy, no default flag). */
export function createEmptyStudioBankAccount(id: string, currency: string, isDefault: boolean): StudioBankAccount {
  return {
    id,
    label: '',
    holderName: '',
    iban: '',
    bic: '',
    bankName: '',
    currency,
    isDefault,
    note: '',
  }
}
