'use client'

import { useTranslation } from 'react-i18next'
import { Check, AlertCircle, Clock } from 'lucide-react'
import { cn } from '@/lib/cn'
import type { QualityCheck, QualityResult } from '@/lib/dossiers/validate'

interface QualityChecklistProps {
  result: QualityResult
  /** Hide the internal title + score when the wrapper already shows them. */
  hideHeader?: boolean
}

const ICONS: Record<QualityCheck['status'], typeof Check> = {
  passed: Check,
  failed: AlertCircle,
  pending: Clock,
}

const COLOR: Record<QualityCheck['status'], string> = {
  passed: 'text-emerald-600',
  failed: 'text-destructive',
  pending: 'text-amber-500',
}

export function QualityChecklist({ result, hideHeader = false }: QualityChecklistProps) {
  const { t } = useTranslation()
  const passedCount = result.checks.filter((c) => c.status === 'passed').length
  const total = result.checks.length

  return (
    <div className="space-y-2">
      {hideHeader ? null : (
        <header className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">{t('dossier.checklist.title')}</h3>
          <span className={cn('text-xs', passedCount === total ? 'text-emerald-600' : 'text-muted')}>
            {t('dossier.checklist.score', { passed: passedCount, total })}
          </span>
        </header>
      )}
      <ul className="divide-y divide-border/60">
        {result.checks.map((check) => {
          const Icon = ICONS[check.status]
          return (
            <li key={check.code} className="flex items-start gap-2 py-1.5 text-xs">
              <Icon size={14} strokeWidth={2} className={cn('mt-0.5 shrink-0', COLOR[check.status])} />
              <span className="flex-1">
                {check.sectionId ? (
                  <span className="text-muted">
                    {t('dossier.checklist.sectionRef', { number: check.sectionId })}
                  </span>
                ) : null}
                {t(check.messageKey)}
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
