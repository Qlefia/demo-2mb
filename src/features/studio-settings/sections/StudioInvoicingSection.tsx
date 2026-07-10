'use client'

import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  StudioBrandThemePreviewCard,
  StudioNumberingEditor,
  StudioPaymentDefaultsEditor,
  StudioQuerySubTabs,
  type StudioQuerySubTab,
  StudioTaxProfileEditor,
} from '@/features/studio-settings/components'
import { StudioBankAccountsHubSection } from '@/features/studio-settings/sections/StudioBankAccountsHubSection'
import { StudioTemplatesHubSection } from '@/features/studio-settings/sections/StudioTemplatesHubSection'
import { StudioGeneralFormShell } from '@/features/studio-settings/sections/StudioGeneralFormShell'

/**
 * The Brand-theme preview is rendered above the sub-tabs because it is a
 * read-only context card (a tiny status of the current primary brand) — it
 * stays useful no matter which sub-tab the user opens, and tucking it inside
 * a tab would force an extra click for a glanceable cue.
 */
function StudioInvoicingFields() {
  const { t } = useTranslation()

  const tabs = useMemo<readonly StudioQuerySubTab[]>(
    () => [
      {
        id: 'bank-accounts',
        label: t('studioSettings.invoicing.subTabs.bankAccounts'),
        content: <StudioBankAccountsHubSection />,
      },
      {
        id: 'tax',
        label: t('studioSettings.invoicing.subTabs.tax'),
        content: <StudioTaxProfileEditor />,
      },
      {
        id: 'numbering',
        label: t('studioSettings.invoicing.subTabs.numbering'),
        content: <StudioNumberingEditor field="invoiceNumbering" />,
      },
      {
        id: 'payment',
        label: t('studioSettings.invoicing.subTabs.payment'),
        content: <StudioPaymentDefaultsEditor />,
      },
      {
        id: 'templates',
        label: t('studioSettings.invoicing.subTabs.templates'),
        content: <StudioTemplatesHubSection kind="invoice" />,
      },
    ],
    [t],
  )

  return (
    <div className="space-y-4">
      <StudioBrandThemePreviewCard contextHintKey="studioSettings.brandKit.invoiceThemeHint" />
      <StudioQuerySubTabs tabs={tabs} ariaLabel={t('studioSettings.invoicing.subNavAria')} />
    </div>
  )
}

export function StudioInvoicingSection() {
  return (
    <StudioGeneralFormShell>
      <StudioInvoicingFields />
    </StudioGeneralFormShell>
  )
}
