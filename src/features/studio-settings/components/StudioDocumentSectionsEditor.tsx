'use client'

import { useMemo } from 'react'
import { useFormContext, useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Trash2 } from 'lucide-react'
import { IconButton, Input, TextArea } from '@/components/atoms'
import { Select } from '@/components/molecules/Select'
import { StudioListAddButton } from '@/features/studio-settings/components/StudioListAddButton'
import { studioTintPanel } from '@/features/studio-settings/studioBlockChrome'
import {
  STUDIO_DOCUMENT_SECTION_LIMITS,
  STUDIO_DOCUMENT_SECTIONS_MAX,
} from '@/features/studio-settings/constants'
import { studioBrandKitNewId } from '@/features/studio-settings/lib/studioBrandKitHelpers'
import {
  STUDIO_DOCUMENT_SECTION_KINDS,
  STUDIO_DOCUMENT_SECTION_LOCALES,
  type StudioDocumentSectionKind,
  type StudioDocumentSectionLocale,
} from '@/stores/studioProfileTypes'
import { cn } from '@/lib/cn'
import type { GeneralForm } from '@/features/studio-settings/sections/studioGeneralForm'

const FIELD = 'documentSections' as const

export function StudioDocumentSectionsEditor() {
  const { t } = useTranslation()
  const { control, setValue } = useFormContext<GeneralForm>()
  const sections = (useWatch({ control, name: FIELD }) ?? []) as GeneralForm['documentSections']

  const kindOptions = useMemo(
    () =>
      STUDIO_DOCUMENT_SECTION_KINDS.map((kind) => ({
        value: kind,
        label: t(`studioSettings.sections.kind.${kind}`),
      })),
    [t],
  )

  const localeOptions = useMemo(
    () =>
      STUDIO_DOCUMENT_SECTION_LOCALES.map((locale) => ({
        value: locale,
        label: t(`studioSettings.sections.locale.${locale}`),
      })),
    [t],
  )

  function commit(next: GeneralForm['documentSections']) {
    setValue(FIELD, next, { shouldDirty: true, shouldTouch: true })
  }

  function patchAt(idx: number, patch: Partial<GeneralForm['documentSections'][number]>) {
    commit(sections.map((row, i) => (i === idx ? { ...row, ...patch } : row)))
  }

  function removeAt(idx: number) {
    commit(sections.filter((_, i) => i !== idx))
  }

  function setTagsAt(idx: number, raw: string) {
    const tags = raw
      .split(',')
      .map((token) => token.trim())
      .filter((token) => token.length > 0)
      .slice(0, STUDIO_DOCUMENT_SECTION_LIMITS.maxTags)
    patchAt(idx, { tags })
  }

  function addRow() {
    if (sections.length >= STUDIO_DOCUMENT_SECTIONS_MAX) return
    commit([
      ...sections,
      {
        id: studioBrandKitNewId(),
        kind: 'terms',
        name: '',
        body: '',
        tags: [],
        locale: 'any',
      },
    ])
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted">{t('studioSettings.sections.hint')}</p>

      {sections.length === 0 ? (
        <p className="text-sm text-muted">{t('studioSettings.sections.empty')}</p>
      ) : (
        <ul className="space-y-3">
          {sections.map((section, idx) => (
            <li key={section.id} className={cn(studioTintPanel, 'space-y-2')}>
              <div className="flex flex-wrap items-center gap-2">
                <Input
                  value={section.name}
                  onChange={(e) => patchAt(idx, { name: e.target.value })}
                  placeholder={t('studioSettings.sections.namePlaceholder')}
                  aria-label={t('studioSettings.sections.name')}
                  className="min-w-0 flex-1"
                  maxLength={STUDIO_DOCUMENT_SECTION_LIMITS.name}
                />
                <div className="w-40">
                  <Select
                    value={section.kind}
                    onChange={(v) => patchAt(idx, { kind: v as StudioDocumentSectionKind })}
                    options={kindOptions}
                    placeholder={t('studioSettings.sections.kindLabel')}
                  />
                </div>
                <div className="w-28">
                  <Select
                    value={section.locale}
                    onChange={(v) => patchAt(idx, { locale: v as StudioDocumentSectionLocale })}
                    options={localeOptions}
                    placeholder={t('studioSettings.sections.localeLabel')}
                  />
                </div>
                <IconButton
                  type="button"
                  variant="destructive"
                  size="sm"
                  icon={Trash2}
                  label={t('studioSettings.sections.remove')}
                  className="shrink-0"
                  onClick={() => removeAt(idx)}
                />
              </div>
              <TextArea
                rows={3}
                value={section.body}
                onChange={(e) => patchAt(idx, { body: e.target.value })}
                placeholder={t('studioSettings.sections.bodyPlaceholder')}
                aria-label={t('studioSettings.sections.body')}
                maxLength={STUDIO_DOCUMENT_SECTION_LIMITS.body}
              />
              <Input
                value={section.tags.join(', ')}
                onChange={(e) => setTagsAt(idx, e.target.value)}
                placeholder={t('studioSettings.sections.tagsPlaceholder')}
                aria-label={t('studioSettings.sections.tags')}
              />
            </li>
          ))}
        </ul>
      )}

      <StudioListAddButton
        type="button"
        onClick={addRow}
        disabled={sections.length >= STUDIO_DOCUMENT_SECTIONS_MAX}
      >
        {t('studioSettings.sections.add')}
      </StudioListAddButton>
    </div>
  )
}
