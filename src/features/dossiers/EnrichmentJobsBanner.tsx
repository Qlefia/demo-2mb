'use client'

import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/cn'
import { studioRadiusBlock } from '@/features/studio-settings/studioBlockChrome'

type JobRow = {
  id: string
  provider: string
  status: string
  error: string | null
  startedAt: string | null
  finishedAt: string | null
  createdAt: string
}

function latestPerProvider(items: JobRow[]): JobRow[] {
  const map = new Map<string, JobRow>()
  for (const row of items) {
    const prev = map.get(row.provider)
    if (!prev || new Date(row.createdAt) > new Date(prev.createdAt)) {
      map.set(row.provider, row)
    }
  }
  return [...map.values()].sort((a, b) => a.provider.localeCompare(b.provider))
}

export function EnrichmentJobsBanner({ prospectId }: { prospectId: string }) {
  const { t } = useTranslation()
  const [items, setItems] = useState<JobRow[] | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let cancelled = false
    void fetch(`/api/prospects/${prospectId}/enrichment-jobs`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((json: { items?: JobRow[] } | null) => {
        if (cancelled || !json?.items) return
        setItems(latestPerProvider(json.items))
      })
      .catch(() => {
        if (!cancelled) setFailed(true)
      })
    return () => {
      cancelled = true
    }
  }, [prospectId])

  const chips = useMemo(() => items ?? [], [items])

  if (failed || chips.length === 0) return null

  return (
    <div
      className={cn(studioRadiusBlock, 'bg-foreground/4 px-3 py-2 text-xs dark:bg-white/5')}
      aria-label={t('dossier.enrichmentProvenance.ariaLabel')}
    >
      <p className="font-medium text-foreground">{t('dossier.enrichmentProvenance.title')}</p>
      <ul className="mt-2 flex flex-wrap gap-2">
        {chips.map((j) => (
          <li
            key={j.id}
            className="rounded-lg bg-foreground/6 px-2 py-1 tabular-nums dark:bg-white/8"
          >
            <span className="text-muted">
              {t(`opsToday.enrichmentProviders.${j.provider}`, { defaultValue: j.provider })}
            </span>
            <span
              className={
                j.status === 'success'
                  ? 'text-emerald-700 dark:text-emerald-400'
                  : j.status === 'failed'
                    ? 'text-destructive'
                    : 'text-muted'
              }
            >
              {j.status}
            </span>
            {j.status === 'failed' && j.error ? (
              <span className="ml-1 text-destructive" title={j.error}>
                ({t('enrichmentJobs.error')})
              </span>
            ) : null}
          </li>
        ))}
      </ul>
      <p className="mt-2 text-muted">{t('dossier.enrichmentProvenance.snapshotHint')}</p>
    </div>
  )
}
