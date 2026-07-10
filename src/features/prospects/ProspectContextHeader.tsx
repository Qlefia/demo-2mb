'use client'

import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import {
  Activity,
  ArrowLeft,
  Briefcase,
  ExternalLink,
  FileText,
  Phone,
  Sparkles,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/cn'
import {
  studioRadiusBlock,
  studioRadiusNested,
  studioSalesDetailHeaderBack,
} from '@/features/studio-settings/studioBlockChrome'
import type { Prospect } from '@/features/prospects/types'
import type { NextBestAction, ProspectActionKind } from '@/features/prospects/nextBestAction'
import { ProspectPinButton } from '@/features/prospects/ProspectPinButton'

const NBA_ICON: Record<ProspectActionKind, LucideIcon> = {
  enrich: Sparkles,
  dossier: FileText,
  logCall: Phone,
  proposal: Briefcase,
  activity: Activity,
}

interface ProspectContextHeaderProps {
  prospect: Prospect
  nextBestAction: NextBestAction
  nextBestActionBusy?: boolean
  onPrimaryAction: () => void
  proposalHref: string
  onLogCall: () => void
}

const quickActionClass = cn(
  'inline-flex h-8 w-8 shrink-0 items-center justify-center text-muted transition-colors',
  'hover:bg-foreground/[0.07] hover:text-foreground dark:hover:bg-white/[0.08]',
  'outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background',
  studioRadiusNested,
)

export function ProspectContextHeader({
  prospect,
  nextBestAction,
  nextBestActionBusy,
  onPrimaryAction,
  proposalHref,
  onLogCall,
}: ProspectContextHeaderProps) {
  const { t } = useTranslation()
  const PrimaryIcon = NBA_ICON[nextBestAction.kind]
  const website = prospect.account.website

  return (
    <header
      className={cn(
        'shrink-0 bg-foreground/4 px-3 py-2 dark:bg-white/5',
        studioRadiusBlock,
      )}
    >
      <div className="flex min-w-0 items-center gap-2">
        <Link href="/prospects" className={studioSalesDetailHeaderBack} aria-label={t('common.back')}>
          <ArrowLeft size={16} aria-hidden />
        </Link>

        <div className="flex min-w-0 flex-1 items-center gap-2">
          <h1
            className="min-w-0 truncate text-sm font-semibold leading-tight text-foreground sm:text-base"
            title={prospect.account.name}
          >
            {prospect.account.name}
          </h1>
          {website ? (
            <a
              href={website}
              target="_blank"
              rel="noreferrer"
              className="hidden shrink-0 text-muted hover:text-foreground sm:inline-flex"
              aria-label={t('prospects.workspace.openWebsite')}
              title={website}
            >
              <ExternalLink size={14} aria-hidden />
            </a>
          ) : null}
        </div>

        <button
          type="button"
          onClick={onPrimaryAction}
          disabled={nextBestActionBusy}
          aria-label={t(nextBestAction.labelKey)}
          title={t(nextBestAction.labelKey)}
          className={cn(
            'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent text-white outline-none transition-colors',
            'hover:bg-accent/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
            'disabled:cursor-not-allowed disabled:opacity-60',
            'sm:w-auto sm:gap-1.5 sm:px-3',
          )}
        >
          <PrimaryIcon size={14} strokeWidth={1.75} aria-hidden />
          <span className="hidden text-xs font-medium sm:inline">{t(nextBestAction.labelKey)}</span>
        </button>

        <div className="flex shrink-0 items-center gap-1">
          <ProspectPinButton prospectId={prospect.id} />
          <Link
            href={proposalHref}
            className={cn(quickActionClass, nextBestAction.kind === 'proposal' && 'hidden')}
            aria-label={t('prospects.workspace.createProposal')}
            title={t('prospects.workspace.createProposal')}
          >
            <Briefcase size={16} strokeWidth={1.5} aria-hidden />
          </Link>
          <button
            type="button"
            onClick={onLogCall}
            className={cn(quickActionClass, nextBestAction.kind === 'logCall' && 'hidden')}
            aria-label={t('prospects.workspace.logCall')}
            title={t('prospects.workspace.logCall')}
          >
            <Phone size={16} strokeWidth={1.5} aria-hidden />
          </button>
        </div>
      </div>
    </header>
  )
}
