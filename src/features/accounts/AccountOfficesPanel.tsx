'use client'

import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/react'
import { ChevronDown, MapPin, MoreVertical, Plus, Star, Trash2 } from 'lucide-react'
import { Input, TextArea } from '@/components/atoms'
import { ConfirmDialog } from '@/components/molecules/ConfirmDialog'
import { CrmStackedField, CrmStackedFieldList } from '@/components/molecules/CrmStackedField'
import { DropdownMenu, type DropdownMenuEntry } from '@/components/molecules/DropdownMenu'
import { Select } from '@/components/molecules/Select'
import { StudioAccentAddButton } from '@/features/studio-settings/components/StudioAccentAddButton'
import {
  studioTintPanel,
} from '@/features/studio-settings/studioBlockChrome'
import { cn } from '@/lib/cn'
import {
  ACCOUNT_OFFICES_MAX,
  ACCOUNT_OFFICE_KINDS,
  ACCOUNT_OFFICE_PHONES_MAX,
  createEmptyOffice,
  createEmptyPhone,
  setPrimaryOffice,
  type AccountOffice,
  type AccountOfficeKind,
} from '@/lib/accounts/companyProfile'

const DEBOUNCE_MS = 700

type AccountOfficesPanelProps = {
  offices: AccountOffice[]
  canEdit: boolean
  onChange: (next: AccountOffice[]) => void
}

function officeTitle(office: AccountOffice, t: (key: string) => string): string {
  const label = office.label.trim()
  if (label) return label
  const city = office.city.trim()
  if (city) return city
  return t('accounts.companyProfile.officeUntitled')
}

export function AccountOfficesPanel({ offices, canEdit, onChange }: AccountOfficesPanelProps) {
  const { t } = useTranslation()
  const [removeId, setRemoveId] = useState<string | null>(null)

  const kindOptions = ACCOUNT_OFFICE_KINDS.map((kind) => ({
    value: kind,
    label: t(`accounts.companyProfile.officeKinds.${kind}`),
  }))

  const patchOffice = useCallback(
    (id: string, patch: Partial<AccountOffice>) => {
      onChange(offices.map((o) => (o.id === id ? { ...o, ...patch } : o)))
    },
    [offices, onChange],
  )

  const addOffice = () => {
    if (offices.length >= ACCOUNT_OFFICES_MAX) return
    const isFirst = offices.length === 0
    onChange([...offices, createEmptyOffice(isFirst ? 'hq' : 'branch', isFirst)])
  }

  const removeOffice = (id: string) => {
    const next = offices.filter((o) => o.id !== id)
    if (next.length > 0 && !next.some((o) => o.isPrimary)) {
      next[0] = { ...next[0], isPrimary: true }
    }
    onChange(next)
    setRemoveId(null)
  }

  const addPhone = (officeId: string) => {
    const office = offices.find((o) => o.id === officeId)
    if (!office || office.phones.length >= ACCOUNT_OFFICE_PHONES_MAX) return
    patchOffice(officeId, { phones: [...office.phones, createEmptyPhone()] })
  }

  const patchPhone = (officeId: string, phoneId: string, field: 'label' | 'number', value: string) => {
    const office = offices.find((o) => o.id === officeId)
    if (!office) return
    patchOffice(officeId, {
      phones: office.phones.map((p) => (p.id === phoneId ? { ...p, [field]: value } : p)),
    })
  }

  const removePhone = (officeId: string, phoneId: string) => {
    const office = offices.find((o) => o.id === officeId)
    if (!office) return
    patchOffice(officeId, { phones: office.phones.filter((p) => p.id !== phoneId) })
  }

  return (
    <section className="space-y-2" aria-label={t('accounts.companyProfile.officesTitle')}>
      <p className="crm-meta-label">{t('accounts.companyProfile.officesTitle')}</p>
      <p className="text-xs text-muted">{t('accounts.companyProfile.officesHint')}</p>

      {offices.length === 0 ? (
        <p className={cn(studioTintPanel, 'text-xs text-muted')}>{t('accounts.companyProfile.officesEmpty')}</p>
      ) : (
        <ul className="space-y-2">
          {offices.map((office) => {
            const menuItems: DropdownMenuEntry[] = []
            if (canEdit && !office.isPrimary) {
              menuItems.push({
                label: t('accounts.companyProfile.setPrimary'),
                icon: Star,
                onClick: () => onChange(setPrimaryOffice(offices, office.id)),
              })
            }
            if (canEdit) {
              menuItems.push({
                label: t('common.delete'),
                icon: Trash2,
                variant: 'destructive',
                onClick: () => setRemoveId(office.id),
              })
            }

            return (
              <li key={office.id} className={cn(studioTintPanel, 'overflow-hidden p-0')}>
                <Disclosure defaultOpen={offices.length === 1}>
                  {({ open }) => (
                    <>
                      <div className="flex items-center gap-1 pr-1">
                        <DisclosureButton className="flex min-w-0 flex-1 items-center gap-2 px-3 py-2.5 text-left text-xs font-medium text-foreground">
                          <MapPin size={14} className="shrink-0 text-muted" aria-hidden />
                          <span className="min-w-0 flex-1 truncate">{officeTitle(office, t)}</span>
                          {office.isPrimary ? (
                            <span className="shrink-0 rounded-sm bg-foreground/8 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted">
                              {t('accounts.companyProfile.primaryBadge')}
                            </span>
                          ) : null}
                          <ChevronDown
                            size={14}
                            className={cn('shrink-0 text-muted transition-transform', open && 'rotate-180')}
                            aria-hidden
                          />
                        </DisclosureButton>
                        {menuItems.length > 0 ? (
                          <DropdownMenu
                            trigger={
                              <button
                                type="button"
                                className="rounded-sm p-1.5 text-muted hover:bg-foreground/6 hover:text-foreground"
                                aria-label={t('common.edit')}
                              >
                                <MoreVertical size={14} />
                              </button>
                            }
                            items={menuItems}
                          />
                        ) : null}
                      </div>
                      <DisclosurePanel transition={false} className="border-t border-border/60 px-3 py-1">
                        <CrmStackedFieldList tinted={false} className="px-0">
                          <CrmStackedField label={t('accounts.companyProfile.fields.label')}>
                            <Input
                              value={office.label}
                              onChange={(e) => patchOffice(office.id, { label: e.target.value })}
                              disabled={!canEdit}
                              className="survey-brand-input"
                            />
                          </CrmStackedField>
                          <CrmStackedField label={t('accounts.companyProfile.fields.kind')}>
                            <Select
                              value={office.kind}
                              onChange={(value) =>
                                patchOffice(office.id, { kind: value as AccountOfficeKind })
                              }
                              options={kindOptions}
                              disabled={!canEdit}
                            />
                          </CrmStackedField>
                          <CrmStackedField label={t('accounts.companyProfile.fields.addressLine')}>
                            <Input
                              value={office.addressLine}
                              onChange={(e) => patchOffice(office.id, { addressLine: e.target.value })}
                              disabled={!canEdit}
                              className="survey-brand-input"
                            />
                          </CrmStackedField>
                          <CrmStackedField label={t('accounts.companyProfile.fields.addressLine2')}>
                            <Input
                              value={office.addressLine2}
                              onChange={(e) => patchOffice(office.id, { addressLine2: e.target.value })}
                              disabled={!canEdit}
                              className="survey-brand-input"
                            />
                          </CrmStackedField>
                          <CrmStackedField label={t('accounts.companyProfile.fields.postalCode')}>
                            <Input
                              value={office.postalCode}
                              onChange={(e) => patchOffice(office.id, { postalCode: e.target.value })}
                              disabled={!canEdit}
                              className="survey-brand-input"
                            />
                          </CrmStackedField>
                          <CrmStackedField label={t('accounts.companyProfile.fields.city')}>
                            <Input
                              value={office.city}
                              onChange={(e) => patchOffice(office.id, { city: e.target.value })}
                              disabled={!canEdit}
                              className="survey-brand-input"
                            />
                          </CrmStackedField>
                          <CrmStackedField label={t('accounts.companyProfile.fields.countryCode')}>
                            <Input
                              value={office.countryCode}
                              onChange={(e) =>
                                patchOffice(office.id, { countryCode: e.target.value.toUpperCase().slice(0, 2) })
                              }
                              disabled={!canEdit}
                              placeholder="DE"
                              className="survey-brand-input"
                            />
                          </CrmStackedField>
                        </CrmStackedFieldList>

                        <div className="mt-2 border-t border-border/60 pt-2">
                          <p className="px-0 pb-2 text-xs text-muted">{t('accounts.companyProfile.phonesTitle')}</p>
                          {office.phones.length === 0 ? (
                            <p className="pb-2 text-xs text-muted">{t('accounts.companyProfile.phonesEmpty')}</p>
                          ) : (
                            <ul className="divide-y divide-border/60">
                              {office.phones.map((phone) => (
                                <li key={phone.id} className="space-y-0 py-1">
                                  <div className="flex items-start gap-2">
                                    <div className="min-w-0 flex-1">
                                      <CrmStackedFieldList tinted={false} className="px-0">
                                        <CrmStackedField label={t('accounts.companyProfile.phoneLabelPlaceholder')}>
                                          <Input
                                            value={phone.label}
                                            onChange={(e) =>
                                              patchPhone(office.id, phone.id, 'label', e.target.value)
                                            }
                                            disabled={!canEdit}
                                            placeholder={t('accounts.companyProfile.phoneLabelPlaceholder')}
                                            className="survey-brand-input"
                                          />
                                        </CrmStackedField>
                                        <CrmStackedField label={t('accounts.companyProfile.fields.billingContactPhone')}>
                                          <Input
                                            value={phone.number}
                                            onChange={(e) =>
                                              patchPhone(office.id, phone.id, 'number', e.target.value)
                                            }
                                            disabled={!canEdit}
                                            type="tel"
                                            placeholder="+49 …"
                                            className="survey-brand-input"
                                          />
                                        </CrmStackedField>
                                      </CrmStackedFieldList>
                                    </div>
                                    {canEdit ? (
                                      <button
                                        type="button"
                                        onClick={() => removePhone(office.id, phone.id)}
                                        className="mt-3 rounded-sm p-2 text-muted hover:bg-foreground/6 hover:text-foreground"
                                        aria-label={t('common.delete')}
                                      >
                                        <Trash2 size={14} />
                                      </button>
                                    ) : null}
                                  </div>
                                </li>
                              ))}
                            </ul>
                          )}
                          {canEdit && office.phones.length < ACCOUNT_OFFICE_PHONES_MAX ? (
                            <button
                              type="button"
                              onClick={() => addPhone(office.id)}
                              className="inline-flex items-center gap-1 py-2 text-xs font-medium text-primary hover:underline"
                            >
                              <Plus size={14} />
                              {t('accounts.companyProfile.addPhone')}
                            </button>
                          ) : null}
                        </div>

                        <CrmStackedFieldList tinted={false} className="mt-2 px-0">
                          <CrmStackedField label={t('accounts.companyProfile.fields.contactName')}>
                            <Input
                              value={office.contactName}
                              onChange={(e) => patchOffice(office.id, { contactName: e.target.value })}
                              disabled={!canEdit}
                              className="survey-brand-input"
                            />
                          </CrmStackedField>
                          <CrmStackedField label={t('accounts.companyProfile.fields.contactEmail')}>
                            <Input
                              value={office.contactEmail}
                              onChange={(e) => patchOffice(office.id, { contactEmail: e.target.value })}
                              disabled={!canEdit}
                              type="email"
                              className="survey-brand-input"
                            />
                          </CrmStackedField>
                          <CrmStackedField label={t('accounts.companyProfile.fields.notes')}>
                            <TextArea
                              value={office.notes}
                              onChange={(e) => patchOffice(office.id, { notes: e.target.value })}
                              disabled={!canEdit}
                              rows={2}
                              className="survey-brand-input"
                            />
                          </CrmStackedField>
                        </CrmStackedFieldList>
                      </DisclosurePanel>
                    </>
                  )}
                </Disclosure>
              </li>
            )
          })}
        </ul>
      )}

      {canEdit && offices.length < ACCOUNT_OFFICES_MAX ? (
        <StudioAccentAddButton layout="block" onClick={addOffice}>
          {t('accounts.companyProfile.addOffice')}
        </StudioAccentAddButton>
      ) : null}

      <ConfirmDialog
        open={removeId !== null}
        title={t('accounts.companyProfile.removeOfficeTitle')}
        message={t('accounts.companyProfile.removeOfficeBody')}
        confirmLabel={t('common.delete')}
        variant="destructive"
        onConfirm={() => removeId && removeOffice(removeId)}
        onClose={() => setRemoveId(null)}
      />
    </section>
  )
}

export { DEBOUNCE_MS as ACCOUNT_PROFILE_DEBOUNCE_MS }
