'use client'

import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle, Portal } from '@headlessui/react'
import { History, X } from 'lucide-react'
import { cn } from '@/lib/cn'
import { Button, IconButton } from '@/components/atoms'
import { studioRadiusBlock } from '@/features/studio-settings/studioBlockChrome'
import { formatDateTime } from '@/lib/intl/datetime'
import type { DossierVersionListItem } from './types'

interface DossierVersionsDrawerProps {
  prospectId: string
  open: boolean
  /**
   * Bump this when the parent knows a new version may have been written
   * (after Save / Mark Ready) so the drawer re-fetches even if it stays open.
   */
  refreshKey?: number
  onClose: () => void
}

export function DossierVersionsDrawer({ prospectId, open, refreshKey = 0, onClose }: DossierVersionsDrawerProps) {
  const { t, i18n } = useTranslation()
  const [versions, setVersions] = useState<DossierVersionListItem[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    let cancelled = false
    setLoading(true)
    void fetch(`/api/prospects/${prospectId}/dossier/versions`, { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : { versions: [] }))
      .then((data: { versions?: DossierVersionListItem[] }) => {
        if (!cancelled) setVersions(data.versions ?? [])
      })
      .catch(() => {
        if (!cancelled) setVersions([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [open, prospectId, refreshKey])

  return (
    <Portal>
      <Dialog open={open} onClose={onClose} className="relative z-40">
        <DialogBackdrop className="fixed inset-0 bg-[color:var(--ui-scrim)] transition-opacity" />

        <div className="fixed inset-0 flex justify-end">
          <DialogPanel className="flex h-full w-full max-w-md flex-col border-l border-border bg-background">
            <header className="flex items-center justify-between border-b border-border px-4 py-3">
              <div className="flex items-center gap-2">
                <History size={16} className="text-muted" aria-hidden />
                <DialogTitle className="text-sm font-semibold">{t('dossier.versions.title')}</DialogTitle>
              </div>
              <IconButton icon={X} label={t('common.close')} onClick={onClose} />
            </header>
            <div className="flex-1 overflow-y-auto p-4">
              {loading && <p className="text-xs text-muted">{t('common.loading')}</p>}
              {!loading && versions.length === 0 && (
                <p className="text-xs text-muted">{t('dossier.versions.empty')}</p>
              )}
              <ul className="space-y-2">
                {versions.map((v) => (
                  <li key={v.id} className={cn(studioRadiusBlock, 'bg-foreground/4 p-3 text-xs dark:bg-white/5')}>
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">
                        {t('dossier.versionLabel', { version: v.version })}
                      </span>
                      <span className="text-muted">{formatDateTime(v.generatedAt, i18n.language)}</span>
                    </div>
                    {v.changedKeys.length > 0 && (
                      <p className="mt-1 text-xs text-muted">
                        {t('dossier.versions.changedSections')}: {v.changedKeys.join(', ')}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </div>
            <footer className="border-t border-border px-4 py-3 text-right">
              <Button variant="ghost" size="sm" onClick={onClose}>
                {t('common.close')}
              </Button>
            </footer>
          </DialogPanel>
        </div>
      </Dialog>
    </Portal>
  )
}
