import type { StudioDocumentNumbering } from '@/stores/studioProfileTypes'

/** Default workspace invoice numbering: INV-2026-0001. */
export function defaultInvoiceNumbering(): StudioDocumentNumbering {
  return {
    prefix: 'INV',
    separator: '-',
    padWidth: 4,
    includeYear: true,
    yearResetPolicy: 'calendar',
    nextNumber: 1,
  }
}

/** Default workspace offer numbering: OF-2026-0001. */
export function defaultOfferNumbering(): StudioDocumentNumbering {
  return {
    prefix: 'OF',
    separator: '-',
    padWidth: 4,
    includeYear: true,
    yearResetPolicy: 'calendar',
    nextNumber: 1,
  }
}

/**
 * Render a sample number for the live preview in settings.
 * Pure formatter — does not advance the counter.
 */
export function formatDocumentNumber(
  config: StudioDocumentNumbering,
  year: number,
  sequence: number = config.nextNumber,
): string {
  const padWidth = Math.max(1, Math.min(8, Math.floor(config.padWidth) || 1))
  const padded = String(Math.max(1, Math.floor(sequence) || 1)).padStart(padWidth, '0')
  const parts = [config.prefix.trim()].filter(Boolean)
  if (config.includeYear) parts.push(String(year))
  parts.push(padded)
  const sep = config.separator.length > 0 ? config.separator : '-'
  return parts.filter((p) => p.length > 0).join(sep)
}
