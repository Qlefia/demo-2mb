import {
  STUDIO_WORK_PORTFOLIO_CATEGORIES,
  type StudioWorkPortfolioCategory,
} from '@/features/studio-settings/constants'

const CATEGORY_I18N_KEY: Record<StudioWorkPortfolioCategory, string> = {
  Interior: 'studioSettings.works.portfolioCategory.interior',
  Exterior: 'studioSettings.works.portfolioCategory.exterior',
  Complex: 'studioSettings.works.portfolioCategory.complex',
  'Branding & Website': 'studioSettings.works.portfolioCategory.branding',
}

export function studioWorkPortfolioCategoryOptions(
  t: (key: string) => string,
  currentValue: string,
): { value: string; label: string }[] {
  const options: { value: string; label: string }[] = STUDIO_WORK_PORTFOLIO_CATEGORIES.map((value) => ({
    value,
    label: t(CATEGORY_I18N_KEY[value]),
  }))

  const trimmed = currentValue.trim()
  if (trimmed && !STUDIO_WORK_PORTFOLIO_CATEGORIES.includes(trimmed as StudioWorkPortfolioCategory)) {
    options.push({ value: trimmed, label: trimmed })
  }

  return [{ value: '', label: t('studioSettings.works.portfolioCategory.none') }, ...options]
}
