import type { TFunction } from 'i18next'
import type { ProspectOpenDeal } from '@/lib/prospects/headerData'

function formatMoney(amount: number, currency: string, locale: string): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(amount)
  } catch {
    return `${amount} ${currency}`
  }
}

export function formatOpenDealSummary(
  openDeal: ProspectOpenDeal,
  locale: string,
  t: TFunction,
): string {
  const amount = formatMoney(openDeal.total, openDeal.currency, locale)
  const base = t('prospects.workspace.openDealLabel', { amount })
  return openDeal.count > 1 ? `${base} · ×${openDeal.count}` : base
}
