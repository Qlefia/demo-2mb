'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useParams, usePathname } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Input } from '@/components/atoms'
import { Select, toast } from '@/components/molecules'
import { StudioFieldHeader, StudioSalesDetailHeader } from '@/features/studio-settings/components'
import {
  PlaybookKindSelect,
  PlaybookSectionsFields,
} from '@/features/playbooks/components/PlaybookSectionsFields'
import {
  studioEditorPanelBody,
  studioGhostAction,
  studioSectionStack,
  studioSettingsDetailPad,
  studioSettingsMainScroll,
} from '@/features/studio-settings/studioBlockChrome'
import { fetchPlaybook, updatePlaybook } from '@/features/playbooks/lib/playbooksApi'
import { playbookDetailQueryKey, playbooksListQueryKey } from '@/features/playbooks/lib/playbookQueryKeys'
import {
  PLAYBOOK_KINDS,
  PLAYBOOK_LANGUAGES,
  emptyPlaybookSections,
  type PlaybookKind,
  type PlaybookLanguage,
  type PlaybookSections,
} from '@/lib/playbooks/schema'
import { hasRole, OPS_PRIVILEGED_ROLES } from '@/lib/auth/roleGuards'
import { studioPlaybooksListPath } from '@/lib/studio/studioSalesPaths'
import { useUserStore } from '@/stores/userStore'
import { cn } from '@/lib/cn'

const DEBOUNCE_MS = 700

type Draft = {
  name: string
  language: PlaybookLanguage
  kind: PlaybookKind
  summary: string
  sections: PlaybookSections
}

export function StudioPlaybookDetailSection() {
  const { t } = useTranslation()
  const pathname = usePathname()
  const params = useParams<{ playbookId: string }>()
  const playbookId = params.playbookId
  const listHref = studioPlaybooksListPath(pathname)
  const queryClient = useQueryClient()
  const role = useUserStore((s) => s.role)
  const canWrite = hasRole(role, OPS_PRIVILEGED_ROLES) || role === 'sales_de' || role === 'sales_uk'

  const { data, isLoading, isError } = useQuery({
    queryKey: playbookDetailQueryKey(playbookId),
    queryFn: ({ signal }) => fetchPlaybook(playbookId, signal),
    enabled: Boolean(playbookId),
    staleTime: 10_000,
  })

  const [draft, setDraft] = useState<Draft | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastSavedRef = useRef<string>('')

  useEffect(() => {
    if (!data) return
    const next: Draft = {
      name: data.name,
      language: data.language as PlaybookLanguage,
      kind: data.kind,
      summary: data.summary,
      sections: data.sections ?? emptyPlaybookSections(),
    }
    const snapshot = JSON.stringify(next)
    if (snapshot === lastSavedRef.current) return
    setDraft(next)
    lastSavedRef.current = snapshot
  }, [data])

  const saveMutation = useMutation({
    mutationFn: (patch: Draft) => updatePlaybook(playbookId, patch),
    onSuccess: (next) => {
      queryClient.setQueryData(playbookDetailQueryKey(playbookId), next)
      void queryClient.invalidateQueries({ queryKey: playbooksListQueryKey })
      lastSavedRef.current = JSON.stringify({
        name: next.name,
        language: next.language,
        kind: next.kind,
        summary: next.summary,
        sections: next.sections,
      })
    },
    onError: () => toast(t('error.somethingWentWrong'), 'error'),
  })

  const scheduleSave = useCallback(
    (next: Draft) => {
      if (!canWrite) return
      setDraft(next)
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        const snapshot = JSON.stringify(next)
        if (snapshot === lastSavedRef.current) return
        saveMutation.mutate(next)
      }, DEBOUNCE_MS)
    },
    [canWrite, saveMutation],
  )

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  const kindOptions = PLAYBOOK_KINDS.map((kind) => ({
    value: kind,
    label: t(`studioSettings.playbooks.kind.${kind}`),
  }))

  const sectionLabel = (key: keyof PlaybookSections) =>
    t(`studioSettings.playbooks.sections.${key}.label`)
  const sectionHint = (key: keyof PlaybookSections) => {
    const k = `studioSettings.playbooks.sections.${key}.hint`
    const v = t(k)
    return v === k ? null : v
  }
  const sectionPlaceholder = (key: keyof PlaybookSections) =>
    t(`studioSettings.playbooks.sections.${key}.placeholder`)

  if (!playbookId) {
    return (
      <div className="space-y-2">
        <p className="text-sm text-muted">{t('studioSettings.playbooks.notFound')}</p>
        <Link href={listHref} className={studioGhostAction}>
          {t('studioSettings.playbooks.backToList')}
        </Link>
      </div>
    )
  }

  if (isLoading || !draft) {
    return <p className="text-sm text-muted">{t('common.loading')}</p>
  }

  if (isError || !data) {
    return (
      <div className="space-y-2">
        <p className="text-sm text-muted">{t('studioSettings.playbooks.notFound')}</p>
        <Link href={listHref} className={studioGhostAction}>
          {t('studioSettings.playbooks.backToList')}
        </Link>
      </div>
    )
  }

  const headerTitle = draft.name.trim() || t('studioSettings.playbooks.untitled')
  const readOnly = !canWrite

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className={cn('min-h-0 min-w-0 flex-1', studioSettingsMainScroll, studioSettingsDetailPad)}>
        <div className={studioSectionStack}>
          <StudioSalesDetailHeader
            backHref={listHref}
            backLabelKey="studioSettings.playbooks.backToList"
            title={headerTitle}
            endAdornment={
              saveMutation.isPending ? (
                <span className="text-xs text-muted">{t('studioSettings.playbooks.saving')}</span>
              ) : null
            }
          />

          <div className={studioEditorPanelBody}>
            <div className="grid gap-[var(--studio-stack-block-gap)] sm:grid-cols-2">
              <div className="studio-field-stack sm:col-span-2">
                <StudioFieldHeader htmlFor="pb-name" label={t('studioSettings.playbooks.name')} showAi={false} />
                <Input
                  id="pb-name"
                  value={draft.name}
                  readOnly={readOnly}
                  onChange={(e) => scheduleSave({ ...draft, name: e.target.value })}
                  placeholder={t('studioSettings.playbooks.namePlaceholder')}
                />
              </div>

              <div className="studio-field-stack sm:col-span-2">
                <StudioFieldHeader htmlFor="pb-summary" label={t('studioSettings.playbooks.summary')} showAi={false} />
                <p className="text-xs text-muted">{t('studioSettings.playbooks.summaryHint')}</p>
                <Input
                  id="pb-summary"
                  value={draft.summary}
                  readOnly={readOnly}
                  onChange={(e) => scheduleSave({ ...draft, summary: e.target.value })}
                  placeholder={t('studioSettings.playbooks.summaryPlaceholder')}
                />
              </div>

              <PlaybookKindSelect
                value={draft.kind}
                readOnly={readOnly}
                label={t('studioSettings.playbooks.kindLabel')}
                options={kindOptions}
                onChange={(value) => scheduleSave({ ...draft, kind: value as PlaybookKind })}
              />

              <div className="studio-field-stack">
                <StudioFieldHeader label={t('studioSettings.playbooks.language')} showAi={false} />
                <Select
                  value={draft.language}
                  disabled={readOnly}
                  onChange={(value) =>
                    scheduleSave({ ...draft, language: value as PlaybookLanguage })
                  }
                  options={PLAYBOOK_LANGUAGES.map((lang) => ({
                    value: lang,
                    label: t(`studioSettings.playbooks.languageOption.${lang}`),
                  }))}
                  aria-label={t('studioSettings.playbooks.language')}
                />
              </div>
            </div>

            <div className="border-t border-border pt-[var(--studio-stack-block-gap)]">
              <p className="mb-3 text-sm font-medium text-foreground">
                {t('studioSettings.playbooks.sectionsTitle')}
              </p>
              <p className="mb-4 text-xs text-muted">{t('studioSettings.playbooks.sectionsIntro')}</p>
              <PlaybookSectionsFields
                sections={draft.sections}
                readOnly={readOnly}
                labelFor={sectionLabel}
                hintFor={sectionHint}
                placeholderFor={sectionPlaceholder}
                onChange={(sections) => scheduleSave({ ...draft, sections })}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
