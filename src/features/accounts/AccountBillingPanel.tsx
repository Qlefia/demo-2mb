'use client'

import { useTranslation } from 'react-i18next'
import { Input, TextArea } from '@/components/atoms'
import { CrmStackedField, CrmStackedFieldList } from '@/components/molecules/CrmStackedField'
import type { AccountBilling } from '@/lib/accounts/companyProfile'

type AccountBillingPanelProps = {
  billing: AccountBilling
  canEdit: boolean
  onChange: (next: AccountBilling) => void
}

export function AccountBillingPanel({ billing, canEdit, onChange }: AccountBillingPanelProps) {
  const { t } = useTranslation()

  const patch = (field: keyof AccountBilling, value: string | number | null) => {
    onChange({ ...billing, [field]: value })
  }

  return (
    <section aria-label={t('accounts.companyProfile.billingTitle')}>
      <p className="crm-meta-label">{t('accounts.companyProfile.billingTitle')}</p>
      <p className="mt-1 text-xs text-muted">{t('accounts.companyProfile.billingHint')}</p>

      <CrmStackedFieldList className="mt-3">
        <CrmStackedField label={t('accounts.companyProfile.fields.legalName')}>
          <Input
            value={billing.legalName}
            onChange={(e) => patch('legalName', e.target.value)}
            disabled={!canEdit}
            className="survey-brand-input"
          />
        </CrmStackedField>
        <CrmStackedField label={t('accounts.companyProfile.fields.vatId')}>
          <Input
            value={billing.vatId}
            onChange={(e) => patch('vatId', e.target.value)}
            disabled={!canEdit}
            placeholder="DE123456789"
            className="survey-brand-input"
          />
        </CrmStackedField>
        <CrmStackedField label={t('accounts.companyProfile.fields.taxNumber')}>
          <Input
            value={billing.taxNumber}
            onChange={(e) => patch('taxNumber', e.target.value)}
            disabled={!canEdit}
            className="survey-brand-input"
          />
        </CrmStackedField>
        <CrmStackedField label={t('accounts.companyProfile.fields.addressLine')}>
          <Input
            value={billing.addressLine}
            onChange={(e) => patch('addressLine', e.target.value)}
            disabled={!canEdit}
            className="survey-brand-input"
          />
        </CrmStackedField>
        <CrmStackedField label={t('accounts.companyProfile.fields.addressLine2')}>
          <Input
            value={billing.addressLine2}
            onChange={(e) => patch('addressLine2', e.target.value)}
            disabled={!canEdit}
            className="survey-brand-input"
          />
        </CrmStackedField>
        <CrmStackedField label={t('accounts.companyProfile.fields.postalCode')}>
          <Input
            value={billing.postalCode}
            onChange={(e) => patch('postalCode', e.target.value)}
            disabled={!canEdit}
            className="survey-brand-input"
          />
        </CrmStackedField>
        <CrmStackedField label={t('accounts.companyProfile.fields.locality')}>
          <Input
            value={billing.locality}
            onChange={(e) => patch('locality', e.target.value)}
            disabled={!canEdit}
            className="survey-brand-input"
          />
        </CrmStackedField>
        <CrmStackedField label={t('accounts.companyProfile.fields.countryCode')}>
          <Input
            value={billing.countryCode}
            onChange={(e) => patch('countryCode', e.target.value.toUpperCase().slice(0, 2))}
            disabled={!canEdit}
            placeholder="DE"
            className="survey-brand-input"
          />
        </CrmStackedField>
        <CrmStackedField label={t('accounts.companyProfile.fields.billingContactName')}>
          <Input
            value={billing.contactName}
            onChange={(e) => patch('contactName', e.target.value)}
            disabled={!canEdit}
            className="survey-brand-input"
          />
        </CrmStackedField>
        <CrmStackedField label={t('accounts.companyProfile.fields.billingContactEmail')}>
          <Input
            value={billing.contactEmail}
            onChange={(e) => patch('contactEmail', e.target.value)}
            disabled={!canEdit}
            type="email"
            className="survey-brand-input"
          />
        </CrmStackedField>
        <CrmStackedField label={t('accounts.companyProfile.fields.billingContactPhone')}>
          <Input
            value={billing.contactPhone}
            onChange={(e) => patch('contactPhone', e.target.value)}
            disabled={!canEdit}
            type="tel"
            className="survey-brand-input"
          />
        </CrmStackedField>
        <CrmStackedField label={t('accounts.companyProfile.fields.paymentTermsDays')}>
          <Input
            value={billing.paymentTermsDays ?? ''}
            onChange={(e) => {
              const raw = e.target.value.trim()
              patch('paymentTermsDays', raw === '' ? null : Number.parseInt(raw, 10))
            }}
            disabled={!canEdit}
            type="number"
            min={0}
            max={365}
            placeholder="14"
            className="survey-brand-input"
          />
        </CrmStackedField>
        <CrmStackedField label={t('accounts.companyProfile.fields.poNumber')}>
          <Input
            value={billing.poNumber}
            onChange={(e) => patch('poNumber', e.target.value)}
            disabled={!canEdit}
            className="survey-brand-input"
          />
        </CrmStackedField>
        <CrmStackedField label={t('accounts.companyProfile.fields.notes')}>
          <TextArea
            value={billing.notes}
            onChange={(e) => patch('notes', e.target.value)}
            disabled={!canEdit}
            rows={2}
            className="survey-brand-input"
          />
        </CrmStackedField>
      </CrmStackedFieldList>
    </section>
  )
}
