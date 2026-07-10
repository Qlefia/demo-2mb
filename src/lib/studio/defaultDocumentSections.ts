import type { StudioDocumentSection } from '@/stores/studioProfileTypes'

/** Stable ids so seed scripts and migrations can reference them. */
export const STUDIO_DEFAULT_SECTION_IDS = {
  bankBlock: 'sec-bank-default',
  footerNote: 'sec-footer-villa',
  signatoryBlock: 'sec-signatory-default',
  termsDeB2B: 'sec-terms-de-b2b',
  termsEnB2B: 'sec-terms-en-b2b',
} as const

/**
 * Seed library used on a fresh workspace and by the MCP backfill.
 * Bodies are kept compact (no PII) — Vlad / Ops customize per workspace.
 */
export function defaultStudioDocumentSections(): StudioDocumentSection[] {
  return [
    {
      id: STUDIO_DEFAULT_SECTION_IDS.bankBlock,
      kind: 'bank_block',
      name: 'Bank details (default)',
      body: 'Beneficiary: {{bank.holderName}}\nIBAN: {{bank.iban}}\nBIC: {{bank.bic}}\nBank: {{bank.bankName}}',
      tags: ['bank', 'invoice'],
      locale: 'any',
    },
    {
      id: STUDIO_DEFAULT_SECTION_IDS.footerNote,
      kind: 'footer_note',
      name: 'Villa offer footer',
      body: 'All prices in EUR · Excludes VAT · Bonus items complimentary for this first order.',
      tags: ['villa', 'offer'],
      locale: 'en',
    },
    {
      id: STUDIO_DEFAULT_SECTION_IDS.signatoryBlock,
      kind: 'signatory_block',
      name: 'Studio signatory',
      body: '{{studio.signingName}}\n{{studio.signingRole}}\n{{studio.signingEmail}}',
      tags: ['signature'],
      locale: 'any',
    },
    {
      id: STUDIO_DEFAULT_SECTION_IDS.termsDeB2B,
      kind: 'terms',
      name: 'Standard B2B Bedingungen (DE)',
      body:
        '50% bei Auftragsbestätigung, 40% bei Freigabe der vereinbarten Vorschau, 10% vor finaler Lieferung. ' +
        'Zahlungsziel 14 Tage netto. Konzeptentwicklung enthält bis zu zwei konsolidierte Korrekturschleifen. ' +
        'Weitere Änderungen werden separat angeboten.',
      tags: ['villa', 'b2b'],
      locale: 'de',
    },
    {
      id: STUDIO_DEFAULT_SECTION_IDS.termsEnB2B,
      kind: 'terms',
      name: 'Standard B2B terms (EN)',
      body:
        '50% upon signed order confirmation, 40% after approved preview, 10% before final handover. ' +
        'Net 14 days payment terms. Concept includes up to two consolidated revision rounds; further changes quoted separately.',
      tags: ['architects', 'b2b'],
      locale: 'en',
    },
  ]
}
