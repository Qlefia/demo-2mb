'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import {
  Briefcase,
  ChevronRight,
  ExternalLink,
  Mail,
  MoreHorizontal,
  PhoneCall,
  Radar,
  Star,
} from 'lucide-react'
import { IconButton } from '@/components/atoms'
import { DropdownMenu, type DropdownMenuEntry } from '@/components/molecules/DropdownMenu'
import { toast } from '@/components/molecules/Toast'
import { cn } from '@/lib/cn'
import { openEasybellCall, openIonosEmail } from '@/lib/comms'
import { studioRadiusNested, studioTintPanel } from '@/features/studio-settings/studioBlockChrome'
import type { DashboardFavoriteProspect } from '@/lib/dashboard/userProspectPins'
import { STAGE_META_BY_ID } from '@/features/prospects/stageMeta'
import type { ProspectStage } from '@/lib/db/schema/enums'
import { useToggleProspectPin } from '@/features/dashboard/lib/useToggleProspectPin'
import { favoriteShowsProposalLink } from '@/features/dashboard/lib/favoriteQuickActions'

const ACTION_ICON = cn(
  'inline-flex h-8 w-8 shrink-0 items-center justify-center text-muted transition-colors',
  'hover:bg-foreground/[0.07] hover:text-foreground dark:hover:bg-white/[0.08]',
  'outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background',
  studioRadiusNested,
)

function stageI18nKey(stage: string): string {
  return stage === '1st_call' ? 'first_call' : stage
}

interface DashboardFavoritesProps {
  items: DashboardFavoriteProspect[]
  onScanSignals?: (prospectId: string) => void
}

function FavoriteRow({
  item,
  onScanSignals,
}: {
  item: DashboardFavoriteProspect
  onScanSignals?: (prospectId: string) => void
}) {
  const { t } = useTranslation()
  const router = useRouter()
  const togglePin = useToggleProspectPin()
  const stageMeta = STAGE_META_BY_ID[item.stage as ProspectStage]
  const phone = item.primaryPhone
  const email = item.primaryEmail
  const showProposal = favoriteShowsProposalLink(item.stage)

  const menuItems: DropdownMenuEntry[] = [
    {
      label: t('homeDashboard.favorites.actions.open'),
      icon: ExternalLink,
      onClick: () => router.push(`/prospects/${item.prospectId}`),
    },
  ]

  if (showProposal) {
    menuItems.push({
      label: t('homeDashboard.favorites.actions.proposal'),
      icon: Briefcase,
      onClick: () => router.push(`/prospects/${item.prospectId}/proposal`),
    })
  }

  if (onScanSignals) {
    menuItems.push({
      label: t('homeDashboard.favorites.actions.scanSignals'),
      icon: Radar,
      onClick: () => onScanSignals(item.prospectId),
    })
  }

  menuItems.push({ separator: true })
  menuItems.push({
    label: t('homeDashboard.favorites.unpin'),
    icon: Star,
    variant: 'destructive',
    onClick: () => void togglePin.mutate(item.prospectId),
  })

  return (
    <li className="group -mx-1 rounded-sm px-1 transition-colors hover:bg-hover">
      <div className="flex min-w-0 items-center gap-0.5">
        <Link
          href={`/prospects/${item.prospectId}`}
          className="flex min-w-0 flex-1 items-center gap-3 py-2.5 pl-0.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-sm"
        >
          <span
            className={cn('size-2 shrink-0 rounded-full', stageMeta?.accentClass ?? 'bg-neutral-400')}
            aria-hidden
          />
          <div className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium">{item.accountName}</span>
            <span className="mt-0.5 block truncate text-xs text-muted">
              {t(`prospects.stages.${stageI18nKey(item.stage)}`)} · {item.territory}
            </span>
          </div>
        </Link>

        <div className="flex shrink-0 items-center gap-0.5 pr-0.5">
          {phone ? (
            <button
              type="button"
              className={ACTION_ICON}
              title={t('contacts.actions.callEasybell')}
              aria-label={t('contacts.actions.callEasybell')}
              onClick={() => {
                if (!openEasybellCall(phone)) {
                  toast(t('contacts.comms.invalidPhone'), 'error')
                }
              }}
            >
              <PhoneCall size={16} strokeWidth={1.5} aria-hidden />
            </button>
          ) : null}
          {email ? (
            <button
              type="button"
              className={ACTION_ICON}
              title={t('contacts.actions.emailIonos')}
              aria-label={t('contacts.actions.emailIonos')}
              onClick={() => {
                if (!openIonosEmail({ to: email })) {
                  toast(t('contacts.comms.invalidEmail'), 'error')
                }
              }}
            >
              <Mail size={16} strokeWidth={1.5} aria-hidden />
            </button>
          ) : null}
          {showProposal ? (
            <Link
              href={`/prospects/${item.prospectId}/proposal`}
              className={ACTION_ICON}
              title={t('homeDashboard.favorites.actions.proposal')}
              aria-label={t('homeDashboard.favorites.actions.proposal')}
            >
              <Briefcase size={16} strokeWidth={1.5} aria-hidden />
            </Link>
          ) : null}
          <DropdownMenu
            align="right"
            trigger={
              <IconButton
                icon={MoreHorizontal}
                label={t('homeDashboard.favorites.actions.menu')}
                variant="ghost"
                size="sm"
              />
            }
            items={menuItems}
          />
        </div>
      </div>
    </li>
  )
}

export function DashboardFavorites({ items, onScanSignals }: DashboardFavoritesProps) {
  const { t } = useTranslation()

  return (
    <section
      className={cn(studioTintPanel, 'flex flex-col gap-[var(--page-section-gap)] max-lg:gap-[var(--page-section-gap)]')}
      aria-label={t('homeDashboard.favorites.title')}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-foreground">{t('homeDashboard.favorites.title')}</h2>
          <p className="mt-0.5 text-xs text-muted">{t('homeDashboard.favorites.subtitle')}</p>
        </div>
        <Link
          href="/prospects"
          className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-foreground underline-offset-4 hover:underline"
        >
          {t('homeDashboard.favorites.manage')}
          <ChevronRight className="size-3.5" aria-hidden />
        </Link>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-muted">
          {t('homeDashboard.favorites.empty')}{' '}
          <Link href="/prospects" className="font-medium text-foreground underline-offset-4 hover:underline">
            {t('homeDashboard.favorites.browse')}
          </Link>
        </p>
      ) : (
        <ul className="divide-y divide-border/60">
          {items.map((item) => (
            <FavoriteRow key={item.prospectId} item={item} onScanSignals={onScanSignals} />
          ))}
        </ul>
      )}
    </section>
  )
}
