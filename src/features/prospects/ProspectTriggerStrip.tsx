'use client'

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Sparkles, Wallet } from 'lucide-react'
import { cn } from '@/lib/cn'
import { formatDateTime } from '@/lib/intl/datetime'
import type { Prospect } from '@/features/prospects/types'
import type { ProspectOpenDeal } from '@/lib/prospects/headerData'
import { formatOpenDealSummary } from '@/features/prospects/lib/openDealSummary'
import { studioTintPanel } from '@/features/studio-settings/studioBlockChrome'
import { ProspectAddTriggerDialog } from '@/features/prospects/ProspectAddTriggerDialog'

interface ProspectTriggerStripProps {
  prospect: Prospect
  openDeal?: ProspectOpenDeal | null
  canAddTrigger?: boolean
  onTriggerAdded?: () => void
}

export function ProspectTriggerStrip({
  prospect,
  openDeal,
  canAddTrigger,
  onTriggerAdded,
}: ProspectTriggerStripProps) {
  const { t, i18n } = useTranslation()
  const [triggerOpen, setTriggerOpen] = useState(false)
  const trigger = prospect.latestTrigger

  return (
    <>
      <section className={cn(studioTintPanel, 'space-y-2')}>
        <div className="flex items-start justify-between gap-2">
          <p className="crm-meta-label">{t('prospects.latestTrigger')}</p>
          {canAddTrigger ? (
            <button
              type="button"
              onClick={() => setTriggerOpen(true)}
              className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              <Plus size={12} aria-hidden />
              {t('prospects.trigger.addOnCard')}
            </button>
          ) : null}
        </div>

        {trigger?.text ? (
          <div className="flex gap-2 text-sm leading-snug text-foreground">
            <Sparkles size={14} className="mt-0.5 shrink-0 text-muted" aria-hidden />
            <div className="min-w-0">
              <p>{trigger.text}</p>
              <p className="mt-1 text-xs text-muted">
                {formatDateTime(trigger.capturedAt, i18n.language)}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted">{t('prospects.noTrigger')}</p>
        )}

        {openDeal ? (
          <div className="flex items-center gap-2 border-t border-border/60 pt-2 text-sm text-foreground">
            <Wallet size={14} className="shrink-0 text-muted" aria-hidden />
            <span>
              {formatOpenDealSummary(openDeal, i18n.language, t)}
            </span>
          </div>
        ) : null}
      </section>

      <ProspectAddTriggerDialog
        prospectId={prospect.id}
        open={triggerOpen}
        onClose={() => setTriggerOpen(false)}
        onCreated={onTriggerAdded}
      />
    </>
  )
}
