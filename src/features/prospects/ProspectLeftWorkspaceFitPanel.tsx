'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import Image from 'next/image'
import Link from 'next/link'
import { ExternalLink } from 'lucide-react'
import { Checkbox } from '@/components/atoms'
import { SearchInput } from '@/components/molecules'
import { cn } from '@/lib/cn'
import { toast } from '@/components/molecules/Toast'
import { STUDIO_RELATION_RAIL_DESC_CHARS } from '@/features/studio-settings/constants'
import { StudioRelationListShell } from '@/features/studio-settings/components/StudioRelationListShell'
import {
  catalogIdsForLinkedWorks,
  mergeReviewCatalogFromWork,
  pruneReviewCatalogAfterWorkUnlink,
} from '@/features/studio-settings/lib/studioReviewCatalogFromWorks'
import {
  studioMemberRowRail,
  studioMemberRowRailSelected,
  studioRadiusNested,
  studioRelationMemberList,
  studioRelationMemberThumb,
  studioTintPanel,
} from '@/features/studio-settings/studioBlockChrome'
import type { StudioServiceCatalogItem, StudioWork } from '@/stores/studioProfileTypes'

const PITCH_CATALOG_MAX = 200

interface ServiceItem {
  id: string
  title: string
  summary: string | null
  linkedWorkId: string | null
}
interface WorkItem {
  id: string
  title: string
  clientName: string | null
  categoryLabel: string | null
  caseUrl: string | null
  linkedCatalogIds: string[]
  thumbUrl: string | null
}
interface MappingPayload {
  workspaceId: string
  services: ServiceItem[]
  works: WorkItem[]
  selectedServiceIds: string[]
  selectedWorkIds: string[]
}

function asStudioWorks(works: WorkItem[]): StudioWork[] {
  return works.map((w) => ({
    id: w.id,
    linkedCatalogIds: w.linkedCatalogIds,
  })) as StudioWork[]
}

function asStudioCatalog(services: ServiceItem[]): StudioServiceCatalogItem[] {
  return services.map((s) => ({
    id: s.id,
    linkedWorkId: s.linkedWorkId,
  })) as StudioServiceCatalogItem[]
}

function excerpt(text: string | null, max = STUDIO_RELATION_RAIL_DESC_CHARS): string {
  if (!text?.trim()) return ''
  const plain = text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  return plain.length <= max ? plain : `${plain.slice(0, max).trim()}…`
}

function WorkThumb({ src }: { src: string | null }) {
  if (src) {
    return <Image src={src} alt="" width={48} height={36} className={studioRelationMemberThumb} unoptimized />
  }
  return <span className={studioRelationMemberThumb} aria-hidden />
}

function ServiceChip({ title, variant }: { title: string; variant: 'auto' | 'manual' }) {
  return (
    <li
      className={cn(
        'max-w-full truncate rounded-sm px-1.5 py-0.5 text-[10px]',
        variant === 'auto'
          ? 'bg-foreground/6 text-foreground dark:bg-white/8'
          : 'border border-border/60 text-muted',
      )}
    >
      {title}
    </li>
  )
}

export function ProspectLeftWorkspaceFitPanel({ prospectId }: { prospectId: string }) {
  const { t } = useTranslation()
  const [data, setData] = useState<MappingPayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [serviceIds, setServiceIds] = useState<string[]>([])
  const [workIds, setWorkIds] = useState<string[]>([])
  const [worksQuery, setWorksQuery] = useState('')
  const [servicesQuery, setServicesQuery] = useState('')
  const [servicesExpanded, setServicesExpanded] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    void fetch(`/api/prospects/${prospectId}/studio-mapping`, { credentials: 'include', cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((payload: MappingPayload | null) => {
        if (cancelled) return
        setData(payload)
        setServiceIds(payload?.selectedServiceIds ?? [])
        setWorkIds(payload?.selectedWorkIds ?? [])
        if (
          payload &&
          payload.selectedWorkIds.length === 0 &&
          payload.selectedServiceIds.length > 0
        ) {
          setServicesExpanded(true)
        }
      })
      .catch(() => {
        if (!cancelled) setData(null)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [prospectId])

  const persist = useCallback(
    async (body: { serviceIds?: string[]; workIds?: string[] }) => {
      const res = await fetch(`/api/prospects/${prospectId}/studio-mapping`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) toast(t('error.somethingWentWrong'), 'error')
    },
    [prospectId, t],
  )

  const studioWorks = useMemo(() => (data ? asStudioWorks(data.works) : []), [data])
  const studioCatalog = useMemo(() => (data ? asStudioCatalog(data.services) : []), [data])

  const toggleService = useCallback(
    (id: string) => {
      setServiceIds((prev) => {
        const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        void persist({ serviceIds: next })
        return next
      })
    },
    [persist],
  )

  const toggleWork = useCallback(
    (id: string) => {
      setWorkIds((prevWorkIds) => {
        const isSelected = prevWorkIds.includes(id)
        const nextWorkIds = isSelected ? prevWorkIds.filter((x) => x !== id) : [...prevWorkIds, id]

        setServiceIds((prevServiceIds) => {
          const nextServiceIds = isSelected
            ? pruneReviewCatalogAfterWorkUnlink(
                prevServiceIds,
                id,
                nextWorkIds,
                studioWorks,
                studioCatalog,
              )
            : mergeReviewCatalogFromWork(
                prevServiceIds,
                id,
                studioWorks,
                studioCatalog,
                PITCH_CATALOG_MAX,
              )
          void persist({ workIds: nextWorkIds, serviceIds: nextServiceIds })
          return nextServiceIds
        })

        return nextWorkIds
      })
    },
    [persist, studioCatalog, studioWorks],
  )

  const worksQ = worksQuery.trim().toLowerCase()

  const filteredWorks = useMemo(() => {
    if (!data) return []
    if (!worksQ) return data.works
    return data.works.filter((w) => {
      const hay = [w.title, w.clientName, w.categoryLabel].filter(Boolean).join(' ').toLowerCase()
      return hay.includes(worksQ)
    })
  }, [data, worksQ])

  const filteredServices = useMemo(() => {
    if (!data) return []
    const servicesQ = servicesQuery.trim().toLowerCase()
    if (!servicesQ) return data.services
    return data.services.filter((s) => {
      const hay = [s.title, s.summary].filter(Boolean).join(' ').toLowerCase()
      return hay.includes(servicesQ)
    })
  }, [data, servicesQuery])

  const orderedWorkIds = useMemo(() => {
    const poolIds = filteredWorks.map((w) => w.id)
    const poolSet = new Set(poolIds)
    const selected = workIds.filter((id) => poolSet.has(id))
    const selectedSet = new Set(selected)
    return [...selected, ...poolIds.filter((id) => !selectedSet.has(id))]
  }, [filteredWorks, workIds])

  const orderedServiceIds = useMemo(() => {
    const poolIds = filteredServices.map((s) => s.id)
    const poolSet = new Set(poolIds)
    const selected = serviceIds.filter((id) => poolSet.has(id))
    const selectedSet = new Set(selected)
    return [...selected, ...poolIds.filter((id) => !selectedSet.has(id))]
  }, [filteredServices, serviceIds])

  const linkedServiceIds = useMemo(() => {
    if (!data || workIds.length === 0) return new Set<string>()
    return new Set(catalogIdsForLinkedWorks(workIds, studioWorks, studioCatalog))
  }, [data, studioCatalog, studioWorks, workIds])

  const serviceChips = useMemo(() => {
    if (!data) return { auto: [], manual: [] }
    const auto: { id: string; title: string }[] = []
    const manual: { id: string; title: string }[] = []
    for (const id of serviceIds) {
      const title = data.services.find((s) => s.id === id)?.title?.trim()
      if (!title) continue
      if (linkedServiceIds.has(id)) auto.push({ id, title })
      else manual.push({ id, title })
    }
    return { auto, manual }
  }, [data, linkedServiceIds, serviceIds])

  if (loading) return <p className="w-full text-xs text-muted">{t('common.loading')}</p>
  if (!data) return <p className="w-full text-xs text-muted">{t('prospects.workspace.fitLoadError')}</p>

  const hasCatalog = data.services.length > 0 || data.works.length > 0
  if (!hasCatalog) {
    return (
      <div className={cn(studioTintPanel, 'w-full text-xs')}>
        <p className="crm-meta-label w-full">{t('prospects.workspace.fitTitle2')}</p>
        <p className="mt-1 w-full text-sm text-muted">{t('prospects.workspace.fitEmpty')}</p>
        <Link
          href="/settings/studio/sales/works"
          className="mt-3 inline-block text-xs font-medium text-primary underline-offset-4 hover:underline"
        >
          {t('prospects.workspace.openStudioSetup')}
        </Link>
      </div>
    )
  }

  const worksById = new Map(data.works.map((w) => [w.id, w]))
  const servicesById = new Map(data.services.map((s) => [s.id, s]))
  const showServicesHint = workIds.length === 0 && serviceChips.auto.length === 0 && serviceChips.manual.length === 0

  return (
    <div className="flex min-h-0 w-full min-w-0 flex-col gap-3 text-xs">
      <section className="flex min-h-0 flex-col gap-2">
        <p className="crm-meta-label shrink-0">{t('prospects.workspace.fitPortfolio')}</p>
        {showServicesHint ? (
          <p className="text-[11px] leading-snug text-muted">{t('prospects.workspace.fitPortfolioHint')}</p>
        ) : null}
        <StudioRelationListShell
          className="max-h-80"
          selectedCount={workIds.length}
          toolbar={
            <SearchInput
              value={worksQuery}
              onChange={setWorksQuery}
              placeholder={t('studioSettings.works.searchWorks')}
              className="min-w-0"
              inputClassName="h-8 text-xs"
            />
          }
        >
          {data.works.length === 0 ? (
            <p className="px-2 py-3 text-center text-[10px] text-muted">
              {t('prospects.workspace.fitWorksEmpty')}
            </p>
          ) : filteredWorks.length === 0 ? (
            <p className="px-2 py-3 text-center text-[10px] text-muted">
              {t('studioSettings.works.worksEmptyFiltered')}
            </p>
          ) : (
            <ul className={studioRelationMemberList} aria-label={t('prospects.workspace.fitPortfolio')}>
              {orderedWorkIds.map((id) => {
                const w = worksById.get(id)
                if (!w) return null
                const selected = workIds.includes(id)
                const meta = [w.clientName, w.categoryLabel].filter(Boolean).join(' · ')
                const desc = excerpt(meta || null)

                return (
                  <li key={id}>
                    <div className={cn(studioMemberRowRail, selected && studioMemberRowRailSelected)}>
                      <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selected}
                          onChange={(next) => {
                            if (next !== selected) toggleWork(id)
                          }}
                          ariaLabel={w.title}
                        />
                      </div>
                      <button
                        type="button"
                        aria-pressed={selected}
                        onClick={() => toggleWork(id)}
                        className={cn(
                          'flex min-h-0 min-w-0 flex-1 items-center gap-2 px-1 py-0.5 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                          studioRadiusNested,
                        )}
                      >
                        <WorkThumb src={w.thumbUrl} />
                        <span className="flex min-h-0 min-w-0 flex-1 flex-col justify-center">
                          <span className="block truncate text-[11px] font-semibold leading-snug text-foreground">
                            {w.title}
                          </span>
                          {desc ? (
                            <span className="mt-0.5 block truncate text-[10px] leading-tight text-muted">
                              {desc}
                            </span>
                          ) : null}
                        </span>
                      </button>
                      {w.caseUrl ? (
                        <a
                          href={w.caseUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="shrink-0 p-1 text-muted hover:text-foreground"
                          aria-label={t('prospects.workspace.fitOpenCase')}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ExternalLink size={12} aria-hidden />
                        </a>
                      ) : null}
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </StudioRelationListShell>
      </section>

      {serviceChips.auto.length > 0 || serviceChips.manual.length > 0 ? (
        <section className="shrink-0 space-y-2">
          {serviceChips.auto.length > 0 ? (
            <div className="space-y-1.5">
              <p className="crm-meta-label">{t('prospects.workspace.fitLinkedServices')}</p>
              <ul className="flex flex-wrap gap-1">
                {serviceChips.auto.map(({ id, title }) => (
                  <ServiceChip key={id} title={title} variant="auto" />
                ))}
              </ul>
            </div>
          ) : null}
          {serviceChips.manual.length > 0 ? (
            <div className="space-y-1.5">
              <p className="crm-meta-label">{t('prospects.workspace.fitManualServices')}</p>
              <ul className="flex flex-wrap gap-1">
                {serviceChips.manual.map(({ id, title }) => (
                  <ServiceChip key={id} title={title} variant="manual" />
                ))}
              </ul>
            </div>
          ) : null}
        </section>
      ) : null}

      {data.services.length > 0 ? (
        <section className="shrink-0 space-y-2 border-t border-border/50 pt-2">
          <button
            type="button"
            onClick={() => setServicesExpanded((open) => !open)}
            className="text-left text-[11px] font-medium text-muted transition-colors hover:text-foreground"
          >
            {servicesExpanded
              ? t('prospects.workspace.fitServicesManualHide')
              : t('prospects.workspace.fitServicesManual')}
          </button>
          {servicesExpanded ? (
            <>
              <p className="text-[10px] leading-snug text-muted">{t('prospects.workspace.fitServicesManualHint')}</p>
              <StudioRelationListShell
                className="max-h-52"
                selectedCount={serviceIds.length}
                toolbar={
                  <SearchInput
                    value={servicesQuery}
                    onChange={setServicesQuery}
                    placeholder={t('studioSettings.services.searchCatalog')}
                    className="min-w-0"
                    inputClassName="h-8 text-xs"
                  />
                }
              >
                {filteredServices.length === 0 ? (
                  <p className="px-2 py-3 text-center text-[10px] text-muted">
                    {t('studioSettings.services.catalogEmptyFiltered')}
                  </p>
                ) : (
                  <ul className={studioRelationMemberList} aria-label={t('prospects.workspace.fitServices')}>
                    {orderedServiceIds.map((id) => {
                      const s = servicesById.get(id)
                      if (!s) return null
                      const selected = serviceIds.includes(id)
                      const fromWork = linkedServiceIds.has(id)
                      const desc = excerpt(s.summary)

                      return (
                        <li key={id}>
                          <div className={cn(studioMemberRowRail, selected && studioMemberRowRailSelected)}>
                            <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
                              <Checkbox
                                checked={selected}
                                onChange={(next) => {
                                  if (next !== selected) toggleService(id)
                                }}
                                ariaLabel={s.title}
                              />
                            </div>
                            <button
                              type="button"
                              aria-pressed={selected}
                              onClick={() => toggleService(id)}
                              className={cn(
                                'flex min-h-0 min-w-0 flex-1 flex-col justify-center px-1 py-0.5 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                                studioRadiusNested,
                              )}
                            >
                              <span className="block truncate text-[11px] font-semibold leading-snug text-foreground">
                                {s.title}
                                {fromWork && selected ? (
                                  <span className="ml-1 font-normal text-muted">
                                    · {t('prospects.workspace.fitFromWork')}
                                  </span>
                                ) : null}
                              </span>
                              {desc ? (
                                <span className="mt-0.5 block truncate text-[10px] leading-tight text-muted">
                                  {desc}
                                </span>
                              ) : null}
                            </button>
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </StudioRelationListShell>
            </>
          ) : null}
        </section>
      ) : null}
    </div>
  )
}
