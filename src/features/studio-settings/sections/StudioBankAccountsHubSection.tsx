'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { Landmark, Pencil, Star, Trash2 } from 'lucide-react'
import { ConfirmDialog } from '@/components/molecules'
import type { DropdownMenuEntry } from '@/components/molecules'
import {
  StudioSalesListLayout,
  StudioBankAccountsListToolbar,
  StudioSortableListCard,
} from '@/features/studio-settings/components'
import { useStudioBankAccountsListUiStore } from '@/stores/studioBankAccountsListUiStore'
import { useStudioProfileStore } from '@/stores/studioProfileStore'
import { studioBankAccountDetailPath } from '@/lib/studio/studioBankAccountsPaths'
import { formatIbanForDisplay } from '@/lib/studio/ibanValidate'
import type { StudioBankAccount } from '@/stores/studioProfileTypes'

const BLOCK = 'studio-bank-accounts'

function buildSearchHaystack(account: StudioBankAccount): string {
  return [
    account.label,
    account.holderName,
    account.bankName,
    account.iban,
    account.bic,
    account.currency,
    account.note,
  ]
    .join(' ')
    .toLowerCase()
}

export function StudioBankAccountsHubSection() {
  const { t } = useTranslation()
  const router = useRouter()
  const bankAccounts = useStudioProfileStore((s) => s.general.bankAccounts)
  const removeBankAccount = useStudioProfileStore((s) => s.removeBankAccount)
  const setDefaultBankAccount = useStudioProfileStore((s) => s.setDefaultBankAccount)
  const reorderBankAccounts = useStudioProfileStore((s) => s.reorderBankAccounts)

  const search = useStudioBankAccountsListUiStore((s) => s.search)
  const viewMode = useStudioBankAccountsListUiStore((s) => s.viewMode)
  const filter = useStudioBankAccountsListUiStore((s) => s.filter)

  const [removeId, setRemoveId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase()
    return bankAccounts.filter((b) => {
      if (filter === 'default' && !b.isDefault) return false
      if (needle.length === 0) return true
      return buildSearchHaystack(b).includes(needle)
    })
  }, [bankAccounts, search, filter])

  const filteredIds = filtered.map((b) => b.id)
  const byId = useMemo(() => new Map(bankAccounts.map((b) => [b.id, b])), [bankAccounts])
  const noResults =
    bankAccounts.length > 0 && filteredIds.length === 0 && (search.trim().length > 0 || filter !== 'all')

  return (
    <section className="space-y-3">
      <StudioBankAccountsListToolbar />

      {bankAccounts.length === 0 ? (
        <p className="text-sm text-muted">{t('studioSettings.invoicing.bankAccountsEmpty')}</p>
      ) : noResults ? (
        <p className="text-sm text-muted">{t('studioSettings.invoicing.bankAccountsToolbar.noResults')}</p>
      ) : (
        <StudioSalesListLayout
          blockId={BLOCK}
          itemIds={filteredIds}
          listLabel={t('studioSettings.invoicing.bankAccountsListAria')}
          viewMode={viewMode}
          isManualOrder={filter === 'all' && search.trim().length === 0}
          onReorder={reorderBankAccounts}
        >
          {(id, dragHandle) => {
            const account = byId.get(id)
            if (!account) return null

            const displayTitle =
              account.label.trim() ||
              account.bankName.trim() ||
              t('studioSettings.invoicing.bankAccountUntitled')

            const ibanDisplay = formatIbanForDisplay(account.iban)
            const subtitle = account.holderName.trim() || null

            const href = studioBankAccountDetailPath(id)
            const menuItems: DropdownMenuEntry[] = [
              {
                label: t('studioSettings.edit'),
                icon: Pencil,
                onClick: () => router.push(href),
              },
              ...(account.isDefault
                ? []
                : [
                    {
                      label: t('studioSettings.invoicing.bankAccountSetDefault'),
                      icon: Star,
                      onClick: () => setDefaultBankAccount(id),
                    } as DropdownMenuEntry,
                  ]),
              { separator: true },
              {
                label: t('studioSettings.invoicing.removeBankAccount'),
                icon: Trash2,
                variant: 'destructive',
                onClick: () => setRemoveId(id),
              },
            ]

            return (
              <StudioSortableListCard
                dragHandle={dragHandle}
                href={href}
                menuTriggerAriaLabel={t('studioSettings.sortableListCardMenuAria')}
                menuItems={menuItems}
                eyebrow={
                  account.isDefault
                    ? t('studioSettings.invoicing.bankAccountDefaultBadge')
                    : account.currency
                }
                title={displayTitle}
                subtitle={subtitle}
                description={account.note.trim() || null}
                metaLine={
                  ibanDisplay.length > 0
                    ? { icon: Landmark, text: ibanDisplay }
                    : null
                }
                footerMutedLine={
                  account.bic.trim().length > 0
                    ? t('studioSettings.invoicing.bankAccountCardBic', { bic: account.bic })
                    : null
                }
              />
            )
          }}
        </StudioSalesListLayout>
      )}

      <ConfirmDialog
        open={removeId !== null}
        onClose={() => setRemoveId(null)}
        onConfirm={() => {
          if (removeId) removeBankAccount(removeId)
          setRemoveId(null)
        }}
        title={t('studioSettings.invoicing.confirmRemoveBankAccountTitle')}
        message={t('studioSettings.invoicing.confirmRemoveBankAccountBody')}
        variant="destructive"
        confirmLabel={t('studioSettings.invoicing.removeBankAccount')}
      />
    </section>
  )
}
