'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { STUDIO_WORK_PUBLICATION_STATUSES } from '@/features/studio-settings/lib/studioWorkPublicationStatus'
import { studioWorkThumbSrc } from '@/features/studio-settings/lib/studioWorkThumb'
import type { StudioWorkPublicationStatus } from '@/stores/studioProfileTypes'
import { useStudioProfileStore } from '@/stores/studioProfileStore'
import { studioWorksBasePath } from '@/lib/studio/studioSalesPaths'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/cn'

type StudioWorksPublicationKanbanProps = {
  workIds: readonly string[]
}

function workListTitle(w: { headline: string; title: string }, untitled: string): string {
  return w.headline.trim() || w.title.trim() || untitled
}

export function StudioWorksPublicationKanban({ workIds }: StudioWorksPublicationKanbanProps) {
  const { t } = useTranslation()
  const pathname = usePathname()
  const worksBase = studioWorksBasePath(pathname)
  const works = useStudioProfileStore((s) => s.works)

  const byStatus = useMemo(() => {
    const map = new Map<StudioWorkPublicationStatus, string[]>()
    for (const status of STUDIO_WORK_PUBLICATION_STATUSES) map.set(status, [])
    const idSet = new Set(workIds)
    for (const w of works) {
      if (!idSet.has(w.id)) continue
      map.get(w.publicationStatus)?.push(w.id)
    }
    return map
  }, [workIds, works])

  return (
    <div className="flex gap-3 overflow-x-auto pb-2">
      {STUDIO_WORK_PUBLICATION_STATUSES.map((status) => {
        const columnIds = byStatus.get(status) ?? []
        return (
          <section
            key={status}
            className="flex w-56 shrink-0 flex-col gap-2"
            aria-label={t(`studioSettings.works.publicationStatus.${status}`)}
          >
            <header className="flex items-center justify-between gap-2 px-0.5">
              <h3 className="text-xs font-medium text-foreground">
                {t(`studioSettings.works.publicationStatus.${status}`)}
              </h3>
              <span className="text-xs tabular-nums text-muted">{columnIds.length}</span>
            </header>
            <ul className="flex min-h-[4rem] flex-col gap-2 rounded-sm border border-dashed border-border/80 bg-muted/10 p-2">
              {columnIds.length === 0 ? (
                <li className="px-1 py-2 text-xs text-muted">{t('studioSettings.sales.listToolbar.kanbanEmpty')}</li>
              ) : (
                columnIds.map((id) => {
                  const w = works.find((x) => x.id === id)
                  if (!w) return null
                  const title = workListTitle(w, t('studioSettings.works.untitled'))
                  const thumb = studioWorkThumbSrc(w)
                  return (
                    <li key={id}>
                      <Link
                        href={`${worksBase}/${id}`}
                        className={cn(
                          'block rounded-sm border border-border bg-background p-2 transition-colors',
                          'hover:border-foreground/20 hover:bg-muted/20',
                        )}
                      >
                        <div className="flex gap-2">
                          {thumb ? (
                            <Image
                              src={thumb}
                              alt=""
                              width={40}
                              height={28}
                              className="h-7 w-10 shrink-0 rounded-sm object-cover"
                              unoptimized
                            />
                          ) : (
                            <span className="h-7 w-10 shrink-0 rounded-sm bg-muted/40" aria-hidden />
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="line-clamp-2 text-xs font-medium leading-snug text-foreground">{title}</p>
                          </div>
                        </div>
                      </Link>
                    </li>
                  )
                })
              )}
            </ul>
          </section>
        )
      })}
    </div>
  )
}
