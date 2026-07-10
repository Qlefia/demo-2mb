'use client'

import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { Button, PageLoadingCenter } from '@/components/atoms'
import {
  fetchStudioSettings,
  STUDIO_SETTINGS_QUERY_KEY,
} from '@/features/studio-settings/lib/studioSettingsApi'
import { useStudioProfileReady } from '@/features/studio-settings/lib/studioProfileSyncState'

type StudioSyncGateProps = {
  children: ReactNode
}

/**
 * Blocks the studio-settings body until the first server snapshot has been
 * applied to the Zustand store. Without this, every hub/section reads an
 * empty initial-state array and renders "No groups yet" / "No segments
 * yet" while the GET is in flight — exactly the symptom the user reported
 * after switching between tabs and Fast Refresh reloads.
 */
export function StudioSyncGate({ children }: StudioSyncGateProps) {
  const ready = useStudioProfileReady()
  const { t } = useTranslation()
  const { isError, isFetching, refetch } = useQuery({
    queryKey: STUDIO_SETTINGS_QUERY_KEY,
    queryFn: ({ signal }) => fetchStudioSettings(signal),
    staleTime: 30_000,
    enabled: false,
  })

  if (ready) return <>{children}</>

  if (isError && !isFetching) {
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 p-8">
        <p className="text-sm text-muted">{t('error.somethingWentWrong')}</p>
        <Button type="button" variant="secondary" size="sm" onClick={() => void refetch()}>
          {t('common.retry')}
        </Button>
      </div>
    )
  }

  return <PageLoadingCenter className="min-h-0 flex-1" />
}
