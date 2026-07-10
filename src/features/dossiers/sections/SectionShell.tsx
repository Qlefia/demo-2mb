'use client'

import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/react'
import { ChevronDown } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/cn'
import { studioRadiusBlock } from '@/features/studio-settings/studioBlockChrome'
import type { ReactNode } from 'react'

interface SectionShellProps {
  id: number
  labelKey: string
  helpKey: string
  status?: 'passed' | 'failed' | 'pending' | null
  children: ReactNode
}

const STATUS_CLASS: Record<NonNullable<SectionShellProps['status']>, string> = {
  passed: 'bg-emerald-500',
  failed: 'bg-destructive',
  pending: 'bg-amber-500',
}

export function SectionShell({ id, labelKey, helpKey, status, children }: SectionShellProps) {
  const { t } = useTranslation()
  const label = t(labelKey)

  return (
    <Disclosure defaultOpen={true}>
      {({ open }) => (
        <section
          id={`dossier-section-${id}`}
          className={cn(studioRadiusBlock, 'overflow-hidden bg-foreground/4 dark:bg-white/5')}
        >
          <DisclosureButton
            type="button"
            aria-label={
              open
                ? t('dossier.sections.a11y.collapseSection', { number: id, label })
                : t('dossier.sections.a11y.expandSection', { number: id, label })
            }
            className="flex w-full items-start justify-between gap-3 p-4 text-left outline-none transition-colors hover:bg-foreground/3 focus-visible:outline-none dark:hover:bg-white/[0.07]"
          >
            <div className="flex min-w-0 flex-1 items-start gap-2">
              <ChevronDown
                aria-hidden
                className={cn(
                  'mt-1 h-4 w-4 shrink-0 text-muted transition-transform',
                  open && 'rotate-180',
                )}
              />
              <div className="min-w-0">
                <h3 className="text-sm font-semibold">
                  <span className="mr-2 text-muted">{id}.</span>
                  {label}
                </h3>
                <p className="mt-1 text-xs text-muted">{t(helpKey)}</p>
              </div>
            </div>
            {status && (
              <span
                aria-label={t(`dossier.sectionStatus.${status}`)}
                title={t(`dossier.sectionStatus.${status}`)}
                className={cn('mt-1 h-2 w-2 shrink-0 rounded-full', STATUS_CLASS[status])}
              />
            )}
          </DisclosureButton>

          <DisclosurePanel className="@container border-t border-border/60 px-4 pb-4 pt-3">
            <div className="space-y-3">{children}</div>
          </DisclosurePanel>
        </section>
      )}
    </Disclosure>
  )
}
