'use client'

import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useUserStore } from '@/stores/userStore'
import { toast } from '@/components/molecules/Toast'
import {
  createEmptyBilling,
  normalizeCompanyProfile,
  type AccountBilling,
  type AccountCompanyProfile,
  type AccountOffice,
} from '@/lib/accounts/companyProfile'
import { AccountBillingPanel } from './AccountBillingPanel'
import { AccountOfficesPanel, ACCOUNT_PROFILE_DEBOUNCE_MS } from './AccountOfficesPanel'
import {
  useAccountCompanyProfile,
  useSaveAccountCompanyProfile,
} from './useAccountCompanyProfile'

const EDITOR_ROLES = new Set(['founder', 'ops', 'admin', 'sales_de', 'sales_uk'])

function emptyProfile(): AccountCompanyProfile {
  return { offices: [], billing: createEmptyBilling() }
}

type ProspectAddressPanelProps = {
  accountId: string
}

export function ProspectAddressPanel({ accountId }: ProspectAddressPanelProps) {
  const { t } = useTranslation()
  const role = useUserStore((s) => s.role)
  const canEdit = role !== null && EDITOR_ROLES.has(role)

  const { data, isError } = useAccountCompanyProfile(accountId)
  const { mutate } = useSaveAccountCompanyProfile(accountId)

  const [draft, setDraft] = useState<AccountCompanyProfile>(emptyProfile)
  const skipNextSaveRef = useRef(true)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hydratedAccountRef = useRef<string | null>(null)

  useEffect(() => {
    hydratedAccountRef.current = null
    skipNextSaveRef.current = true
    setDraft(emptyProfile())
  }, [accountId])

  useEffect(() => {
    if (!data || hydratedAccountRef.current === accountId) return
    hydratedAccountRef.current = accountId
    skipNextSaveRef.current = true
    setDraft(normalizeCompanyProfile(data))
  }, [data, accountId])

  useEffect(() => {
    if (skipNextSaveRef.current) {
      skipNextSaveRef.current = false
      return
    }
    if (!canEdit) return

    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      mutate(draft, {
        onError: () => toast(t('accounts.companyProfile.saveError'), 'error'),
      })
    }, ACCOUNT_PROFILE_DEBOUNCE_MS)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [draft, canEdit, mutate, t])

  const setOffices = (offices: AccountOffice[]) => {
    setDraft((prev) => ({
      offices,
      billing: prev.billing,
    }))
  }

  const setBilling = (billing: AccountBilling) => {
    setDraft((prev) => ({
      offices: prev.offices,
      billing,
    }))
  }

  return (
    <div className="space-y-5 text-xs">
      {isError ? (
        <p className="text-xs text-destructive">{t('accounts.companyProfile.loadError')}</p>
      ) : null}
      <AccountOfficesPanel offices={draft.offices} canEdit={canEdit} onChange={setOffices} />
      <AccountBillingPanel billing={draft.billing} canEdit={canEdit} onChange={setBilling} />
    </div>
  )
}
