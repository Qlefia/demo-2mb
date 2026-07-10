'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { X, ExternalLink, ArrowRight } from 'lucide-react'
import { IconButton } from '@/components/atoms'
import { CrmStackedField, CrmStackedFieldList } from '@/components/molecules/CrmStackedField'
import { cn } from '@/lib/cn'
import { formatDateTime } from '@/lib/intl/datetime'
import {
  CRM_DETAIL_PANEL_ASIDE_CLASS,
  CRM_DETAIL_PANEL_CTA_CLASS,
  CRM_DETAIL_PANEL_MOBILE_SCRIM_CLASS,
} from '@/lib/ui/crmDetailPanelChrome'
import type { Prospect } from './types'
import { STAGE_META_BY_ID } from './stageMeta'
import { formatTerritoryBadge } from './labels'
import { OwnerReassignCombobox } from './OwnerReassignCombobox'
import { ProspectPinButton } from './ProspectPinButton'

interface ProspectDetailPanelProps {
  prospect: Prospect
  onClose: () => void
}

export function ProspectDetailPanel({ prospect, onClose }: ProspectDetailPanelProps) {
  const { t, i18n } = useTranslation()
  const stage = STAGE_META_BY_ID[prospect.stage]

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <>
      <button
        type="button"
        className={CRM_DETAIL_PANEL_MOBILE_SCRIM_CLASS}
        aria-label={t('common.close')}
        onClick={onClose}
      />
      <aside
        className={CRM_DETAIL_PANEL_ASIDE_CLASS}
        role="dialog"
        aria-modal="true"
        aria-label={prospect.account.name}
      >
        <header className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3">
          <div className="min-w-0">
            <h2 className="truncate text-sm font-semibold">{prospect.account.name}</h2>
            <p className="text-xs text-muted">
              {t('prospects.cols.territory')}: {formatTerritoryBadge(prospect.territory)}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-0.5">
            <ProspectPinButton prospectId={prospect.id} />
            <IconButton icon={X} label={t('common.close')} onClick={onClose} />
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 [scrollbar-gutter:stable]">
          <CrmStackedFieldList tinted={false} className="px-0">
            <CrmStackedField
              label={t('prospects.cols.stage')}
              value={
                <span className="inline-flex items-center gap-1.5">
                  <span className={cn('h-2 w-2 rounded-full', stage.accentClass)} />
                  {t(stage.labelKey)}
                </span>
              }
            />
            <CrmStackedField
              label={t('prospects.cols.account')}
              value={<span className="font-medium">{prospect.account.name}</span>}
            />
            {prospect.account.website ? (
              <CrmStackedField
                label={t('prospects.workspace.website')}
                value={
                  <a
                    href={prospect.account.website}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-primary hover:underline"
                  >
                    {prospect.account.website}
                    <ExternalLink size={11} />
                  </a>
                }
              />
            ) : null}
            <CrmStackedField
              label={t('prospects.latestTrigger')}
              value={
                prospect.latestTrigger ? (
                  <span>
                    <span className="block">{prospect.latestTrigger.text}</span>
                    <span className="mt-1 block text-xs text-muted">
                      {formatDateTime(prospect.latestTrigger.capturedAt, i18n.language)}
                    </span>
                  </span>
                ) : (
                  t('prospects.noTrigger')
                )
              }
            />
            <CrmStackedField
              label={t('prospects.cols.source')}
              value={t(`prospects.sources.${prospect.source}`, { defaultValue: prospect.source })}
            />
            <CrmStackedField label={t('prospects.cols.priority')} value={`P${prospect.priority}`} />
            <CrmStackedField
              label={t('prospects.cols.created')}
              value={formatDateTime(prospect.createdAt, i18n.language)}
            />
            <CrmStackedField
              label={t('prospects.cols.owner')}
              value={prospect.ownerLabel ?? t('prospects.unassigned')}
            />
            <CrmStackedField
              label={t('prospects.card.createdBy')}
              value={prospect.createdByLabel ?? '—'}
            />
          </CrmStackedFieldList>

          <div className="mt-4">
            <OwnerReassignCombobox
              prospectId={prospect.id}
              territory={prospect.territory}
              currentOwnerId={prospect.ownerId}
            />
          </div>

          <Link href={`/prospects/${prospect.id}`} className={CRM_DETAIL_PANEL_CTA_CLASS}>
            <span>{t('prospects.openFullView')}</span>
            <ArrowRight size={14} aria-hidden="true" />
          </Link>
        </div>
      </aside>
    </>
  )
}
