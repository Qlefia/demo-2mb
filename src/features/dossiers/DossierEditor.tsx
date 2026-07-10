'use client'

import { useCallback, useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from 'react'
import { useTranslation } from 'react-i18next'
import { History, Save, Sparkles } from 'lucide-react'
import { cn } from '@/lib/cn'
import { Button } from '@/components/atoms'
import { studioRadiusBlock } from '@/features/studio-settings/studioBlockChrome'
import { toast } from '@/components/molecules/Toast'
import { useUserStore } from '@/stores/userStore'
import { EMPTY_SECTIONS, type DossierSections } from '@/lib/dossiers/schema'
import { DOSSIER_SECTIONS } from '@/lib/dossiers/sections'
import { validateDossier } from '@/lib/dossiers/validate'
import type { ContactDTO, ContactFormValues } from '@/features/contacts'
import type { DossierRecordDTO } from './types'
import { Section3Signals } from './sections/Section3Signals'
import { Section4DecisionMakers } from './sections/Section4DecisionMakers'
import { Section5TechClues } from './sections/Section5TechClues'
import { Section6Competitive } from './sections/Section6Competitive'
import { Section7Hooks } from './sections/Section7Hooks'
import { Section8Cases } from './sections/Section8Cases'
import { Section9Risks } from './sections/Section9Risks'
import { Section10NextStep } from './sections/Section10NextStep'
import { SectionShell } from './sections/SectionShell'
import { MarkReadyButton } from './MarkReadyButton'
import { DossierVersionsDrawer } from './DossierVersionsDrawer'
import { EnrichmentJobsBanner } from './EnrichmentJobsBanner'

interface DossierEditorProps {
  prospectId: string
  initialDossier: DossierRecordDTO | null
  sections: DossierSections
  onSectionsChange: Dispatch<SetStateAction<DossierSections>>
  /** Bump when server replaces canonical sections (fetch, save, enrich) so unsaved state resets. */
  dossierBaseline: number
  onDossierChanged?: (next: DossierRecordDTO | null, nextSections: DossierSections | null) => void
  /** Section numbers (1–10) not rendered here (edited elsewhere, e.g. left rail). */
  omitSectionIds?: number[]
}

const EDITOR_ROLES = new Set(['founder', 'ops', 'admin'])
const REOPEN_ROLES = new Set(['founder', 'ops'])

function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true
  if (a == null || b == null) return a === b
  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b)) return false
    if (a.length !== b.length) return false
    return a.every((v, i) => deepEqual(v, b[i]))
  }
  if (typeof a === 'object' && typeof b === 'object') {
    const aObj = a as Record<string, unknown>
    const bObj = b as Record<string, unknown>
    const keys = new Set([...Object.keys(aObj), ...Object.keys(bObj)])
    for (const k of keys) {
      if (!deepEqual(aObj[k], bObj[k])) return false
    }
    return true
  }
  return false
}

export function DossierEditor({
  prospectId,
  initialDossier,
  sections,
  onSectionsChange,
  dossierBaseline,
  onDossierChanged,
  omitSectionIds,
}: DossierEditorProps) {
  const { t } = useTranslation()
  const role = useUserStore((s) => s.role)
  const [dossier, setDossier] = useState<DossierRecordDTO | null>(initialDossier)
  const [savedSections, setSavedSections] = useState<DossierSections>(sections)
  const baselineSyncRef = useRef(dossierBaseline)
  useEffect(() => {
    setDossier(initialDossier)
  }, [initialDossier])

  useEffect(() => {
    if (baselineSyncRef.current !== dossierBaseline) {
      baselineSyncRef.current = dossierBaseline
      setSavedSections(sections)
    }
  }, [dossierBaseline, sections])

  const [saving, setSaving] = useState(false)
  const [aiBusy, setAiBusy] = useState(false)
  const [versionsOpen, setVersionsOpen] = useState(false)
  const [refreshTick, setRefreshTick] = useState(0)
  const [contacts, setContacts] = useState<ContactDTO[]>([])
  const [contactsLoading, setContactsLoading] = useState(true)

  const canEdit = role !== null && EDITOR_ROLES.has(role) && dossier?.status !== 'ready'
  const canReopen = role !== null && REOPEN_ROLES.has(role)
  const hasUnsavedChanges = !deepEqual(sections, savedSections)
  const sectionStatus = dossier?.status ?? null

  // Selected contact IDs from JSONB → resolve through fetched contacts to get
  // a real boolean for the validateDossier call (no more `pending`).
  const hasContactMethod = useMemo<boolean>(() => {
    const ids = sections.decision_makers?.contactIds ?? []
    if (ids.length === 0) return false
    const map = new Map(contacts.map((c) => [c.id, c]))
    return ids.some((id) => {
      const c = map.get(id)
      return Boolean(c && (c.email || c.linkedinUrl))
    })
  }, [sections.decision_makers, contacts])

  const validation = useMemo(
    () => validateDossier(sections, { hasContactMethod, mode: 'manual' }),
    [sections, hasContactMethod],
  )

  /** Refresh dossier from server (e.g. after mark-ready / reopen) */
  const reloadDossier = useCallback(async () => {
    const res = await fetch(`/api/prospects/${prospectId}/dossier`, { credentials: 'include' })
    if (!res.ok) return
    const data = (await res.json()) as { dossier: DossierRecordDTO | null; sections: DossierSections }
    const nextSections = data.sections ?? EMPTY_SECTIONS
    setDossier(data.dossier)
    onSectionsChange(nextSections)
    setSavedSections(nextSections)
    onDossierChanged?.(data.dossier, nextSections)
  }, [prospectId, onDossierChanged, onSectionsChange])

  /** Initial + refresh contacts list */
  const reloadContacts = useCallback(async () => {
    setContactsLoading(true)
    try {
      const res = await fetch(`/api/prospects/${prospectId}/contacts`, { credentials: 'include' })
      if (!res.ok) {
        setContacts([])
        return
      }
      const data = (await res.json()) as { items: ContactDTO[] }
      setContacts(data.items ?? [])
    } finally {
      setContactsLoading(false)
    }
  }, [prospectId])

  useEffect(() => {
    void reloadContacts()
  }, [reloadContacts])

  const handleCreateContact = useCallback(
    async (values: ContactFormValues): Promise<ContactDTO | null> => {
      const res = await fetch(`/api/prospects/${prospectId}/contacts`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })
      if (!res.ok) {
        toast(t('contacts.errors.create_failed'), 'error')
        return null
      }
      const data = (await res.json()) as { contact: ContactDTO }
      setContacts((cs) => [...cs, data.contact])
      return data.contact
    },
    [prospectId, t],
  )

  const handleUpdateContact = useCallback(
    async (id: string, values: ContactFormValues): Promise<ContactDTO | null> => {
      const res = await fetch(`/api/prospects/${prospectId}/contacts/${id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })
      if (!res.ok) {
        toast(t('contacts.errors.update_failed'), 'error')
        return null
      }
      const data = (await res.json()) as { contact: ContactDTO }
      setContacts((cs) => cs.map((c) => (c.id === id ? data.contact : c)))
      return data.contact
    },
    [prospectId, t],
  )

  const handleDeleteContact = useCallback(
    async (id: string): Promise<boolean> => {
      const res = await fetch(`/api/prospects/${prospectId}/contacts/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (!res.ok) {
        toast(t('contacts.errors.delete_failed'), 'error')
        return false
      }
      setContacts((cs) => cs.filter((c) => c.id !== id))
      return true
    },
    [prospectId, t],
  )

  useEffect(() => {
    if (refreshTick === 0) return
    void reloadDossier()
  }, [refreshTick, reloadDossier])

  /** beforeunload warning when there are unsaved edits */
  useEffect(() => {
    if (!hasUnsavedChanges) return
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [hasUnsavedChanges])

  const handleAiDraft = useCallback(async () => {
    if (!canEdit || aiBusy) return
    setAiBusy(true)
    try {
      const res = await fetch(`/api/prospects/${prospectId}/dossier/generate`, {
        method: 'POST',
        credentials: 'include',
      })
      if (!res.ok) {
        toast(t('dossier.ai.error'), 'error')
        return
      }
      await reloadDossier()
      toast(t('dossier.ai.success'), 'success')
    } finally {
      setAiBusy(false)
    }
  }, [aiBusy, canEdit, prospectId, reloadDossier, t])

  const handleSave = async () => {
    if (saving || !canEdit) return
    setSaving(true)
    try {
      const res = await fetch(`/api/prospects/${prospectId}/dossier`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sections }),
      })
      if (!res.ok) {
        const payload = (await res.json().catch(() => ({}))) as { error?: string }
        toast(t(`dossier.errors.${payload.error ?? 'save_failed'}`), 'error')
        return
      }
      const data = (await res.json()) as {
        dossier: DossierRecordDTO
        sections: DossierSections
        versionWritten: boolean
        versionNumber: number
      }
      setDossier(data.dossier)
      setSavedSections(data.sections)
      onSectionsChange(data.sections)
      onDossierChanged?.(data.dossier, data.sections)
      toast(
        data.versionWritten
          ? t('dossier.toasts.savedVersion', { version: data.versionNumber })
          : t('dossier.toasts.savedNoChange'),
        'success',
      )
    } finally {
      setSaving(false)
    }
  }

  const renderSection = (sectionId: number) => {
    switch (sectionId) {
      case 3:
        return (
          <Section3Signals
            value={sections.signals}
            onChange={(next) => onSectionsChange((s) => ({ ...s, signals: next }))}
            disabled={!canEdit}
          />
        )
      case 4:
        return (
          <Section4DecisionMakers
            value={sections.decision_makers}
            onChange={(next) => onSectionsChange((s) => ({ ...s, decision_makers: next }))}
            contacts={contacts}
            contactsLoading={contactsLoading}
            canEditContacts={canEdit}
            onCreateContact={handleCreateContact}
            onUpdateContact={handleUpdateContact}
            onDeleteContact={handleDeleteContact}
            disabled={!canEdit}
          />
        )
      case 5:
        return (
          <Section5TechClues
            value={sections.tech_clues}
            onChange={(next) => onSectionsChange((s) => ({ ...s, tech_clues: next }))}
            disabled={!canEdit}
          />
        )
      case 6:
        return (
          <Section6Competitive
            value={sections.competitive}
            onChange={(next) => onSectionsChange((s) => ({ ...s, competitive: next }))}
            disabled={!canEdit}
          />
        )
      case 7:
        return (
          <Section7Hooks
            value={sections.hooks}
            onChange={(next) => onSectionsChange((s) => ({ ...s, hooks: next }))}
            disabled={!canEdit}
          />
        )
      case 8:
        return (
          <Section8Cases
            value={sections.cases}
            onChange={(next) => onSectionsChange((s) => ({ ...s, cases: next }))}
            disabled={!canEdit}
          />
        )
      case 9:
        return (
          <Section9Risks
            value={sections.risks}
            onChange={(next) => onSectionsChange((s) => ({ ...s, risks: next }))}
            disabled={!canEdit}
          />
        )
      case 10:
        return (
          <Section10NextStep
            value={sections.next_step}
            onChange={(next) => onSectionsChange((s) => ({ ...s, next_step: next }))}
            disabled={!canEdit}
          />
        )
      default:
        return null
    }
  }

  const qualityPassed = validation.passed
  const qualityPending = validation.checks.some((c) => c.status === 'pending')
  const blockReason = hasUnsavedChanges
    ? 'unsavedChanges'
    : !qualityPassed
      ? 'qualityFailed'
      : qualityPending
        ? 'qualityPending'
        : null

  const omitted = useMemo(() => new Set(omitSectionIds ?? []), [omitSectionIds])
  const visibleSections = useMemo(
    () => DOSSIER_SECTIONS.filter((m) => !omitted.has(m.id)),
    [omitted],
  )

  return (
    <div className="min-w-0 space-y-3">
        <header className={cn(studioRadiusBlock, 'flex flex-wrap items-center justify-between gap-3 bg-foreground/4 px-3 py-2 dark:bg-white/5')}>
          <div className="flex flex-1 items-center gap-3 text-xs">
            {dossier && (
              <span className="text-muted">
                {t('dossier.versionLabel', { version: dossier.version })}
              </span>
            )}
            {hasUnsavedChanges && (
              <span className="flex items-center gap-1.5 text-amber-600">
                <span className="h-2 w-2 rounded-full bg-amber-500" aria-hidden />
                <span className="sr-only">{t('dossier.unsavedChanges')}</span>
              </span>
            )}
            {sectionStatus !== 'ready' && blockReason && (
              <span className="text-muted">
                {t(`dossier.actions.markReadyHint.${blockReason}`)}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="w-8 px-0"
              onClick={() => setVersionsOpen(true)}
              disabled={!dossier}
              title={t('dossier.actions.history')}
            >
              <History size={16} />
            </Button>
            {canEdit && (
              <Button
                variant={hasUnsavedChanges ? 'primary' : 'secondary'}
                size="sm"
                className="w-8 px-0"
                onClick={handleSave}
                disabled={!hasUnsavedChanges}
                loading={saving}
                title={t('dossier.actions.save')}
              >
                {!saving && <Save size={16} />}
              </Button>
            )}
            {canEdit && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => void handleAiDraft()}
                disabled={aiBusy}
                loading={aiBusy}
                title={t('dossier.ai.generateTitle')}
                className="gap-1.5 px-2"
              >
                <Sparkles size={16} />
                <span className="hidden sm:inline">{t('dossier.ai.generate')}</span>
              </Button>
            )}
            <MarkReadyButton
              prospectId={prospectId}
              status={sectionStatus}
              canMarkInReview={canReopen}
              qualityPassed={validation.passed}
              qualityPending={validation.checks.some((c) => c.status === 'pending')}
              hasUnsavedChanges={hasUnsavedChanges}
              onChanged={() => setRefreshTick((n) => n + 1)}
            />
          </div>
        </header>

        {dossier?.aiMetadata && Object.keys(dossier.aiMetadata).length > 0 && (
          <div
            className={cn(studioRadiusBlock, 'bg-foreground/4 px-3 py-2 text-xs text-muted dark:bg-white/5')}
            aria-label={t('dossier.ai.lastRunAria')}
          >
            <p className="font-medium text-foreground">{t('dossier.ai.lastRun')}</p>
            <ul className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
              {typeof dossier.aiMetadata.model === 'string' && (
                <li>
                  {t('dossier.ai.metaModel')}: {dossier.aiMetadata.model}
                </li>
              )}
              {typeof dossier.aiMetadata.tokens_in === 'number' && (
                <li className="tabular-nums">
                  {t('dossier.ai.metaTokens')}: {dossier.aiMetadata.tokens_in} /{' '}
                  {typeof dossier.aiMetadata.tokens_out === 'number' ? dossier.aiMetadata.tokens_out : '—'}
                </li>
              )}
              {typeof dossier.aiMetadata.cost_usd === 'number' && (
                <li className="tabular-nums">
                  {t('dossier.ai.metaCost')}: ${dossier.aiMetadata.cost_usd.toFixed(4)}
                </li>
              )}
            </ul>
          </div>
        )}

        <EnrichmentJobsBanner prospectId={prospectId} />

        {visibleSections.map((meta) => {
          const sectionCheck = validation.checks.find((c) => c.sectionId === meta.id)
          const sectionEmpty = validation.failures.some(
            (f) => f.code === 'section_empty' && f.sectionId === meta.id,
          )
          const status = sectionCheck?.status ?? (sectionEmpty ? 'failed' : 'passed')
          return (
            <SectionShell
              key={meta.id}
              id={meta.id}
              labelKey={meta.labelKey}
              helpKey={meta.helpKey}
              status={status}
            >
              {renderSection(meta.id)}
            </SectionShell>
          )
        })}

      {!canEdit && dossier?.status === 'ready' && (
        <div className="border border-border bg-emerald-50 p-3 text-xs text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400">
          {t('dossier.readyHint')}
        </div>
      )}

      <DossierVersionsDrawer
        prospectId={prospectId}
        open={versionsOpen}
        refreshKey={dossier?.version ?? 0}
        onClose={() => setVersionsOpen(false)}
      />
    </div>
  )
}
