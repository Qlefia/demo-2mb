'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Check, Star } from 'lucide-react'
import { Button, Input, Label, TextArea } from '@/components/atoms'
import { Select } from '@/components/molecules/Select'
import { StudioFieldHeader, StudioSalesDetailHeader } from '@/features/studio-settings/components'
import {
  studioEditorPanelBody,
  studioFieldStack,
  studioGhostAction,
  studioSectionStack,
} from '@/features/studio-settings/studioBlockChrome'
import { cn } from '@/lib/cn'
import { useStudioProfileStore } from '@/stores/studioProfileStore'
import { useStudioTemplatesListUiStore } from '@/stores/studioTemplatesListUiStore'
import {
  STUDIO_DOCUMENT_TEMPLATE_LIMITS,
  STUDIO_DOCUMENT_TEMPLATES_MAX,
} from '@/features/studio-settings/constants'
import {
  STUDIO_TAX_MODES,
  type StudioDocumentTemplateKind,
  type StudioTaxMode,
} from '@/stores/studioProfileTypes'

const TAB_BY_KIND: Record<StudioDocumentTemplateKind, string> = {
  offer: '/settings/studio/offer',
  proposal: '/settings/studio/proposal',
  invoice: '/settings/studio/invoicing',
}

export function StudioTemplateDetailSection() {
  const { t } = useTranslation()
  const params = useParams<{ id: string }>()
  const id = params?.id ?? null

  const templates = useStudioProfileStore((s) => s.general.documentTemplates)
  const sections = useStudioProfileStore((s) => s.general.documentSections)
  const bankAccounts = useStudioProfileStore((s) => s.general.bankAccounts)
  const updateDocumentTemplate = useStudioProfileStore((s) => s.updateDocumentTemplate)
  const setDefaultDocumentTemplate = useStudioProfileStore((s) => s.setDefaultDocumentTemplate)
  const lastKind = useStudioTemplatesListUiStore((s) => s.lastKind)

  const tpl = useMemo(() => templates.find((x) => x.id === id), [templates, id])
  const fallbackTab = TAB_BY_KIND[lastKind]

  const sectionOptions = useMemo(
    () =>
      sections.map((sec) => ({
        id: sec.id,
        label:
          sec.name.trim().length > 0
            ? sec.name.trim()
            : t(`studioSettings.sections.kind.${sec.kind}`),
      })),
    [sections, t],
  )

  const bankOptions = useMemo(
    () => [
      { value: '', label: t('studioSettings.invoicing.useDefaultBank') },
      ...bankAccounts.map((account) => ({
        value: account.id,
        label: account.label.trim().length > 0 ? account.label : account.bankName || account.iban,
      })),
    ],
    [bankAccounts, t],
  )

  const taxOverrideOptions = useMemo(
    () => [
      { value: '', label: t('studioSettings.templates.taxOverrideNone') },
      ...STUDIO_TAX_MODES.map((mode) => ({
        value: mode,
        label: t(`studioSettings.invoicing.taxMode.${mode}`),
      })),
    ],
    [t],
  )

  if (!id || !tpl) {
    return (
      <div className="space-y-2 p-4">
        <p className="text-sm text-muted">{t('studioSettings.templates.notFound')}</p>
        <Link href={fallbackTab} className={studioGhostAction}>
          {t('studioSettings.templates.backToList')}
        </Link>
      </div>
    )
  }

  const backHref = TAB_BY_KIND[tpl.kind]
  const headerTitle = tpl.name.trim() || t('studioSettings.templates.untitled')
  const totalTemplatesCount = templates.length
  const totalAtCap = totalTemplatesCount >= STUDIO_DOCUMENT_TEMPLATES_MAX

  function toggleSection(sectionId: string) {
    if (!tpl) return
    const exists = tpl.sectionIds.includes(sectionId)
    const nextSectionIds = exists
      ? tpl.sectionIds.filter((sid) => sid !== sectionId)
      : [...tpl.sectionIds, sectionId]
    if (nextSectionIds.length > STUDIO_DOCUMENT_TEMPLATE_LIMITS.maxSectionsPerTemplate) return
    updateDocumentTemplate(tpl.id, { sectionIds: nextSectionIds })
  }

  return (
    <div className={studioSectionStack}>
      <StudioSalesDetailHeader
        backHref={backHref}
        backLabelKey="studioSettings.templates.backToList"
        title={headerTitle}
        endAdornment={
          tpl.isDefault ? (
            <span className="inline-flex items-center gap-1 rounded-sm bg-accent/12 px-2 py-1 text-xs font-medium text-foreground">
              <Star size={12} aria-hidden />
              {t('studioSettings.templates.defaultBadge')}
            </span>
          ) : (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setDefaultDocumentTemplate(tpl.id)}
            >
              <Star size={14} aria-hidden />
              {t('studioSettings.templates.setDefault')}
            </Button>
          )
        }
      />

      <div className={studioEditorPanelBody}>
        <div className={studioFieldStack}>
          <Label htmlFor={`tpl-name-${tpl.id}`}>{t('studioSettings.templates.name')}</Label>
          <Input
            id={`tpl-name-${tpl.id}`}
            value={tpl.name}
            onChange={(e) => updateDocumentTemplate(tpl.id, { name: e.target.value })}
            placeholder={t('studioSettings.templates.namePlaceholder')}
            maxLength={STUDIO_DOCUMENT_TEMPLATE_LIMITS.name}
          />
        </div>

        <div className={studioFieldStack}>
          <Label htmlFor={`tpl-desc-${tpl.id}`}>
            {t('studioSettings.optionalFieldLabel', {
              field: t('studioSettings.templates.description'),
            })}
          </Label>
          <TextArea
            id={`tpl-desc-${tpl.id}`}
            rows={2}
            value={tpl.description}
            onChange={(e) => updateDocumentTemplate(tpl.id, { description: e.target.value })}
            placeholder={t('studioSettings.templates.descriptionPlaceholder')}
            maxLength={STUDIO_DOCUMENT_TEMPLATE_LIMITS.description}
          />
        </div>

        <div className={studioFieldStack}>
          <StudioFieldHeader
            label={t('studioSettings.templates.sectionsLabel')}
            hint={t('studioSettings.templates.sectionsHint', {
              max: STUDIO_DOCUMENT_TEMPLATE_LIMITS.maxSectionsPerTemplate,
            })}
            showAi={false}
          />
          {sectionOptions.length === 0 ? (
            <p className="text-sm text-muted">{t('studioSettings.templates.noSectionsAvailable')}</p>
          ) : (
            <ul className="grid gap-1 sm:grid-cols-2">
              {sectionOptions.map((option) => {
                const checked = tpl.sectionIds.includes(option.id)
                return (
                  <li key={option.id}>
                    <button
                      type="button"
                      onClick={() => toggleSection(option.id)}
                      aria-pressed={checked}
                      className={cn(
                        'flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-xs transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
                        checked
                          ? 'bg-accent/12 text-foreground'
                          : 'bg-foreground/4 text-muted hover:bg-foreground/10 dark:bg-white/5 dark:hover:bg-white/10',
                      )}
                    >
                      <span
                        className={cn(
                          'flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border',
                          checked
                            ? 'border-accent bg-accent text-white'
                            : 'border-input bg-background',
                        )}
                      >
                        {checked ? <Check size={12} aria-hidden /> : null}
                      </span>
                      <span className="min-w-0 truncate">{option.label}</span>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        <div className="grid gap-[var(--studio-stack-block-gap)] sm:grid-cols-3">
          <div className={studioFieldStack}>
            <Label>{t('studioSettings.templates.bankFieldLabel')}</Label>
            <Select
              value={tpl.defaults.bankAccountId ?? ''}
              onChange={(v) =>
                updateDocumentTemplate(tpl.id, {
                  defaults: { ...tpl.defaults, bankAccountId: v === '' ? null : v },
                })
              }
              options={bankOptions}
              placeholder={t('studioSettings.invoicing.useDefaultBank')}
            />
            <p className="text-xs text-muted">{t('studioSettings.templates.bankFieldHint')}</p>
          </div>
          <div className={studioFieldStack}>
            <Label>{t('studioSettings.templates.taxOverrideLabel')}</Label>
            <Select
              value={tpl.defaults.taxModeOverride ?? ''}
              onChange={(v) =>
                updateDocumentTemplate(tpl.id, {
                  defaults: {
                    ...tpl.defaults,
                    taxModeOverride: v === '' ? null : (v as StudioTaxMode),
                  },
                })
              }
              options={taxOverrideOptions}
              placeholder={t('studioSettings.templates.taxOverrideNone')}
            />
            <p className="text-xs text-muted">{t('studioSettings.templates.taxFieldHint')}</p>
          </div>
          <div className={studioFieldStack}>
            <Label htmlFor={`tpl-validity-${tpl.id}`}>
              {t('studioSettings.templates.validityDays')}
            </Label>
            <Input
              id={`tpl-validity-${tpl.id}`}
              inputMode="numeric"
              value={tpl.defaults.validityDays}
              onChange={(e) =>
                updateDocumentTemplate(tpl.id, {
                  defaults: {
                    ...tpl.defaults,
                    validityDays: e.target.value
                      .replace(/\D/g, '')
                      .slice(0, STUDIO_DOCUMENT_TEMPLATE_LIMITS.validityDays),
                  },
                })
              }
              placeholder={t('studioSettings.templates.validityPlaceholder')}
            />
            <p className="text-xs text-muted">{t('studioSettings.templates.validityHint')}</p>
          </div>
        </div>

        {totalAtCap ? (
          <p className="text-xs text-muted">
            {t('studioSettings.templates.totalCapHint', { max: STUDIO_DOCUMENT_TEMPLATES_MAX })}
          </p>
        ) : null}
      </div>
    </div>
  )
}
