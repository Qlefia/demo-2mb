'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Star } from 'lucide-react'
import { Button, Input, Label, TextArea } from '@/components/atoms'
import { Select } from '@/components/molecules/Select'
import { StudioSalesDetailHeader } from '@/features/studio-settings/components'
import {
  studioEditorPanelBody,
  studioFieldStack,
  studioGhostAction,
  studioSectionStack,
} from '@/features/studio-settings/studioBlockChrome'
import { useStudioProfileStore } from '@/stores/studioProfileStore'
import { STUDIO_BANK_ACCOUNT_LIMITS } from '@/features/studio-settings/constants'
import { STUDIO_DISPLAY_CURRENCIES } from '@/features/studio-settings/lib/studioGlobalDefaultsOptions'
import {
  formatIbanForDisplay,
  normalizeIban,
  validateIban,
} from '@/lib/studio/ibanValidate'

const INVOICING_TAB = '/settings/studio/invoicing'

export function StudioBankAccountDetailSection() {
  const { t } = useTranslation()
  const params = useParams<{ id: string }>()
  const id = params?.id ?? null

  const bankAccounts = useStudioProfileStore((s) => s.general.bankAccounts)
  const updateBankAccount = useStudioProfileStore((s) => s.updateBankAccount)
  const setDefaultBankAccount = useStudioProfileStore((s) => s.setDefaultBankAccount)

  const account = useMemo(() => bankAccounts.find((b) => b.id === id), [bankAccounts, id])

  const currencyOptions = useMemo(
    () =>
      STUDIO_DISPLAY_CURRENCIES.map((code) => ({
        value: code,
        label: code,
      })),
    [],
  )

  if (!id || !account) {
    return (
      <div className="space-y-2 p-4">
        <p className="text-sm text-muted">{t('studioSettings.invoicing.bankAccountNotFound')}</p>
        <Link href={INVOICING_TAB} className={studioGhostAction}>
          {t('studioSettings.invoicing.backToBankAccountsList')}
        </Link>
      </div>
    )
  }

  const headerTitle =
    account.label.trim() ||
    account.bankName.trim() ||
    t('studioSettings.invoicing.bankAccountUntitled')

  const ibanCheck = account.iban.length > 0 ? validateIban(account.iban) : null
  const ibanInvalid = ibanCheck !== null && ibanCheck.ok === false

  return (
    <div className={studioSectionStack}>
      <StudioSalesDetailHeader
        backHref={INVOICING_TAB}
        backLabelKey="studioSettings.invoicing.backToBankAccountsList"
        title={headerTitle}
        endAdornment={
          account.isDefault ? (
            <span className="inline-flex items-center gap-1 rounded-sm bg-accent/12 px-2 py-1 text-xs font-medium text-foreground">
              <Star size={12} aria-hidden />
              {t('studioSettings.invoicing.bankAccountDefaultBadge')}
            </span>
          ) : (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setDefaultBankAccount(account.id)}
            >
              <Star size={14} aria-hidden />
              {t('studioSettings.invoicing.bankAccountSetDefault')}
            </Button>
          )
        }
      />

      <div className={studioEditorPanelBody}>
        <div className={studioFieldStack}>
          <Label htmlFor={`bank-label-${account.id}`}>
            {t('studioSettings.invoicing.bankAccountLabel')}
          </Label>
          <Input
            id={`bank-label-${account.id}`}
            value={account.label}
            onChange={(e) => updateBankAccount(account.id, { label: e.target.value })}
            placeholder={t('studioSettings.invoicing.bankAccountLabelPlaceholder')}
            maxLength={STUDIO_BANK_ACCOUNT_LIMITS.label}
          />
        </div>

        <div className="grid gap-[var(--studio-stack-block-gap)] sm:grid-cols-2">
          <div className={studioFieldStack}>
            <Label htmlFor={`bank-holder-${account.id}`}>
              {t('studioSettings.invoicing.bankHolder')}
            </Label>
            <Input
              id={`bank-holder-${account.id}`}
              value={account.holderName}
              onChange={(e) => updateBankAccount(account.id, { holderName: e.target.value })}
              placeholder={t('studioSettings.invoicing.bankHolderPlaceholder')}
              maxLength={STUDIO_BANK_ACCOUNT_LIMITS.holderName}
            />
          </div>
          <div className={studioFieldStack}>
            <Label htmlFor={`bank-name-${account.id}`}>
              {t('studioSettings.invoicing.bankName')}
            </Label>
            <Input
              id={`bank-name-${account.id}`}
              value={account.bankName}
              onChange={(e) => updateBankAccount(account.id, { bankName: e.target.value })}
              placeholder={t('studioSettings.invoicing.bankNamePlaceholder')}
              maxLength={STUDIO_BANK_ACCOUNT_LIMITS.bankName}
            />
          </div>
        </div>

        <div className="grid gap-[var(--studio-stack-block-gap)] sm:grid-cols-[2fr_1fr_120px]">
          <div className={studioFieldStack}>
            <Label htmlFor={`bank-iban-${account.id}`}>
              {t('studioSettings.invoicing.bankIban')}
            </Label>
            <Input
              id={`bank-iban-${account.id}`}
              value={formatIbanForDisplay(account.iban)}
              onChange={(e) =>
                updateBankAccount(account.id, { iban: normalizeIban(e.target.value) })
              }
              placeholder={t('studioSettings.invoicing.bankIbanPlaceholder')}
              autoComplete="off"
              spellCheck={false}
              maxLength={STUDIO_BANK_ACCOUNT_LIMITS.iban + 8}
            />
            {ibanInvalid ? (
              <p className="text-xs text-destructive">
                {t(`studioSettings.invoicing.ibanError.${ibanCheck.reason}`)}
              </p>
            ) : null}
          </div>
          <div className={studioFieldStack}>
            <Label htmlFor={`bank-bic-${account.id}`}>
              {t('studioSettings.invoicing.bankBic')}
            </Label>
            <Input
              id={`bank-bic-${account.id}`}
              value={account.bic}
              onChange={(e) =>
                updateBankAccount(account.id, { bic: e.target.value.toUpperCase() })
              }
              placeholder={t('studioSettings.invoicing.bankBicPlaceholder')}
              autoComplete="off"
              maxLength={STUDIO_BANK_ACCOUNT_LIMITS.bic}
            />
          </div>
          <div className={studioFieldStack}>
            <Label>{t('studioSettings.invoicing.bankCurrency')}</Label>
            <Select
              value={account.currency}
              onChange={(v) => updateBankAccount(account.id, { currency: v })}
              options={currencyOptions}
              placeholder={t('studioSettings.invoicing.bankCurrency')}
            />
          </div>
        </div>

        <div className={studioFieldStack}>
          <Label htmlFor={`bank-note-${account.id}`}>
            {t('studioSettings.optionalFieldLabel', {
              field: t('studioSettings.invoicing.bankNote'),
            })}
          </Label>
          <TextArea
            id={`bank-note-${account.id}`}
            rows={3}
            value={account.note}
            onChange={(e) => updateBankAccount(account.id, { note: e.target.value })}
            placeholder={t('studioSettings.invoicing.bankNotePlaceholder')}
            maxLength={STUDIO_BANK_ACCOUNT_LIMITS.note}
          />
        </div>
      </div>
    </div>
  )
}
