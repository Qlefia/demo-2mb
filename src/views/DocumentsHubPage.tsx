'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { ExternalLink, FileText } from 'lucide-react'
import { Container, Button } from '@/components/atoms'
import { cn } from '@/lib/cn'
import { PAGE_FRAME_CLASS } from '@/lib/layout/pageFrame'
import { STAGE_META_BY_ID } from '@/features/prospects/stageMeta'
import type { DocumentKind } from '@/lib/proposals/documentKind'
import type { ProspectStage } from '@/lib/db/schema/enums'

type DocumentListItem = {
  proposal: {
    id: string
    prospectId: string
    title: string
    status: string
    version: number
    updatedAt: string
  }
  accountName: string
  prospectStage: ProspectStage
  prospectTerritory: string
}

type DocumentsHubPageProps = {
  documentKind: DocumentKind
}

export function DocumentsHubPage({ documentKind }: DocumentsHubPageProps) {
  const { t } = useTranslation()
  const ns = documentKind === 'offer' ? 'offersHub' : 'proposalsHub'
  const editorSegment = documentKind === 'offer' ? 'offer' : 'proposal'
  const listUrl = documentKind === 'offer' ? '/api/offers' : '/api/proposals?kind=proposal'

  const [items, setItems] = useState<DocumentListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(listUrl, { credentials: 'include' })
      if (!res.ok) {
        setError(t(`${ns}.loadError`))
        setItems([])
        return
      }
      const data = (await res.json()) as { items?: DocumentListItem[] }
      setItems(data.items ?? [])
    } catch {
      setError(t(`${ns}.loadError`))
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [listUrl, ns, t])

  useEffect(() => {
    void load()
  }, [load])

  const empty = useMemo(() => !loading && items.length === 0, [loading, items.length])

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <Container className="flex flex-col gap-4 py-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">{t(`${ns}.title`)}</h1>
            <p className="mt-1 max-w-2xl text-sm text-muted">{t(`${ns}.subtitle`)}</p>
          </div>
          <Button type="button" variant="secondary" size="sm" onClick={() => void load()}>
            {t(`${ns}.refresh`)}
          </Button>
        </div>
      </Container>

      <div className="flex min-h-0 flex-1 overflow-auto">
        <div className={cn(PAGE_FRAME_CLASS, 'pb-10')}>
          {loading && <p className="text-sm text-muted">{t('common.loading')}</p>}
          {error && !loading && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
          {empty && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <FileText className="mb-3 h-10 w-10 text-muted" aria-hidden />
              <p className="text-sm font-medium text-foreground">{t(`${ns}.emptyTitle`)}</p>
              <p className="mt-1 max-w-md text-sm text-muted">{t(`${ns}.emptyBody`)}</p>
            </div>
          )}
          {!loading && items.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] border border-border text-sm">
                <thead className="border-b border-border bg-primary/[0.02] text-xs uppercase tracking-wider text-muted">
                  <tr>
                    <th className="px-3 py-2 text-left">{t(`${ns}.cols.document`)}</th>
                    <th className="px-3 py-2 text-left">{t(`${ns}.cols.account`)}</th>
                    <th className="px-3 py-2 text-left">{t(`${ns}.cols.stage`)}</th>
                    <th className="px-3 py-2 text-left">{t(`${ns}.cols.territory`)}</th>
                    <th className="px-3 py-2 text-left">{t(`${ns}.cols.status`)}</th>
                    <th className="px-3 py-2 text-left">{t(`${ns}.cols.updated`)}</th>
                    <th className="px-3 py-2 text-right">{t(`${ns}.cols.actions`)}</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((row) => {
                    const stageMeta = STAGE_META_BY_ID[row.prospectStage]
                    return (
                      <tr
                        key={row.proposal.id}
                        className="border-t border-border transition-colors hover:bg-primary/5"
                      >
                        <td className="px-3 py-2">
                          <div className="font-medium">{row.proposal.title}</div>
                          <div className="text-xs text-muted tabular-nums">v{row.proposal.version}</div>
                        </td>
                        <td className="px-3 py-2 text-muted">{row.accountName}</td>
                        <td className="px-3 py-2">
                          <span className="inline-flex items-center gap-1.5 text-xs">
                            <span className={cn('h-2 w-2 rounded-full', stageMeta.accentClass)} />
                            {t(stageMeta.labelKey)}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-xs text-muted">{row.prospectTerritory}</td>
                        <td className="px-3 py-2">
                          <span className="inline-flex rounded-sm bg-primary/5 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-foreground">
                            {t(`proposals.status.${row.proposal.status}`)}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-xs text-muted tabular-nums">
                          {new Date(row.proposal.updatedAt).toLocaleString()}
                        </td>
                        <td className="px-3 py-2 text-right">
                          <Link
                            href={`/prospects/${row.proposal.prospectId}/${editorSegment}?proposalId=${encodeURIComponent(row.proposal.id)}`}
                            className="inline-flex items-center gap-1 text-xs font-medium text-foreground underline-offset-4 hover:underline"
                          >
                            {t(`${ns}.openBuilder`)}
                            <ExternalLink size={12} aria-hidden />
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
