'use client'

import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { BookOpen, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/cn'
import { PlaybookScriptReader } from '@/features/playbooks/components/PlaybookScriptReader'
import { fetchPlaybook } from '@/features/playbooks/lib/playbooksApi'
import { playbookDetailQueryKey } from '@/features/playbooks/lib/playbookQueryKeys'
import { STUDIO_SALES_PLAYBOOKS } from '@/lib/studio/studioSalesPaths'
import { prospectSideRailPanelBody } from '@/features/prospects/prospectSideRailChrome'

interface ProspectPlaybookReaderProps {
  playbookId: string | null | undefined
}

export function ProspectPlaybookReader({ playbookId }: ProspectPlaybookReaderProps) {
  const { t } = useTranslation()

  const { data, isLoading, isError } = useQuery({
    queryKey: playbookId ? playbookDetailQueryKey(playbookId) : ['playbooks', 'detail', 'none'],
    queryFn: ({ signal }) => fetchPlaybook(playbookId!, signal),
    enabled: Boolean(playbookId),
    staleTime: 60_000,
  })

  if (!playbookId) {
    return (
      <div className={cn(prospectSideRailPanelBody, 'text-sm')}>
        <p className="text-xs text-muted">{t('prospects.playbook.readerNone')}</p>
        <Link
          href={STUDIO_SALES_PLAYBOOKS}
          className="inline-flex items-center gap-1 text-xs font-medium text-primary underline-offset-4 hover:underline"
        >
          <BookOpen size={12} aria-hidden />
          {t('prospects.playbook.manageLink')}
        </Link>
      </div>
    )
  }

  if (isLoading) {
    return <p className="text-xs text-muted">{t('common.loading')}</p>
  }

  if (isError || !data) {
    return <p className="text-xs text-muted">{t('prospects.playbook.readerLoadError')}</p>
  }

  return (
    <div className={cn(prospectSideRailPanelBody, 'min-h-0 flex-1 text-sm')}>
      <div className="shrink-0 space-y-1">
        <p className="text-sm font-medium text-foreground">{data.name}</p>
        <p className="text-xs text-muted">
          {t(`studioSettings.playbooks.kind.${data.kind}`)} · {data.language.toUpperCase()} · v
          {data.version}
        </p>
      </div>
      <PlaybookScriptReader
        sections={data.sections}
        body={data.body}
        emptyLabel={t('prospects.playbook.readerEmptyBody')}
        className="min-h-0 flex-1"
      />
      <Link
        href={`${STUDIO_SALES_PLAYBOOKS}/${data.id}`}
        className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-primary underline-offset-4 hover:underline"
      >
        {t('prospects.playbook.openInLibrary')}
        <ExternalLink size={11} aria-hidden />
      </Link>
    </div>
  )
}
