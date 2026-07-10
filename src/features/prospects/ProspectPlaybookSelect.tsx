'use client'

import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { BookOpen, ExternalLink } from 'lucide-react'
import { Select } from '@/components/molecules/Select'
import { toast } from '@/components/molecules/Toast'
import { patchProspect } from '@/features/prospects/api/prospectsApi'
import {
  prospectDetailQueryKey,
  prospectHeaderQueryKey,
} from '@/features/prospects/api/prospectDetailQueryKeys'
import { fetchPlaybooks } from '@/features/playbooks/lib/playbooksApi'
import { playbooksListQueryKey } from '@/features/playbooks/lib/playbookQueryKeys'
import type { Prospect } from '@/features/prospects/types'
import { STUDIO_SALES_PLAYBOOKS } from '@/lib/studio/studioSalesPaths'
import { cn } from '@/lib/cn'

interface ProspectPlaybookSelectProps {
  prospect: Prospect
  onProspectUpdated: (next: Prospect) => void
}

export function ProspectPlaybookSelect({ prospect, onProspectUpdated }: ProspectPlaybookSelectProps) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { data: playbooks = [], isLoading } = useQuery({
    queryKey: playbooksListQueryKey,
    queryFn: ({ signal }) => fetchPlaybooks(signal),
    staleTime: 60_000,
  })

  const mutation = useMutation({
    mutationFn: (suggestedPlaybookId: string | null) =>
      patchProspect({ prospectId: prospect.id, body: { suggestedPlaybookId } }),
    onSuccess: ({ prospect: next }) => {
      queryClient.setQueryData(prospectDetailQueryKey(prospect.id), next)
      void queryClient.invalidateQueries({ queryKey: prospectHeaderQueryKey(prospect.id) })
      onProspectUpdated(next)
    },
    onError: () => {
      toast(t('error.somethingWentWrong'), 'error')
    },
  })

  const options = [
    { value: '', label: t('prospects.playbook.none') },
    ...playbooks.map((pb) => ({
      value: pb.id,
      label: `${pb.name} (${t(`studioSettings.playbooks.kind.${pb.kind}`)}, ${pb.language.toUpperCase()} v${pb.version})`,
    })),
  ]

  return (
    <div className="space-y-2">
      <Select
        value={prospect.suggestedPlaybookId ?? ''}
        onChange={(value) => {
          mutation.mutate(value === '' ? null : value)
        }}
        options={options}
        disabled={isLoading || mutation.isPending}
        aria-label={t('prospects.playbook.label')}
      />
      {playbooks.length === 0 && !isLoading ? (
        <p className="text-xs text-muted">{t('prospects.playbook.emptyLibrary')}</p>
      ) : null}
      <Link
        href={STUDIO_SALES_PLAYBOOKS}
        className={cn(
          'inline-flex items-center gap-1 text-xs font-medium text-primary underline-offset-4 hover:underline',
        )}
      >
        <BookOpen size={12} aria-hidden />
        {t('prospects.playbook.manageLink')}
        <ExternalLink size={11} aria-hidden />
      </Link>
    </div>
  )
}
