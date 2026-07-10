'use client'

import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { cn } from '@/lib/cn'
import { toast } from '@/components/molecules/Toast'
import { studioTintPanel } from '@/features/studio-settings/studioBlockChrome'
import { useUserStore } from '@/stores/userStore'
import { ACTIVITY_COMPOSER_ROLES, OPS_PRIVILEGED_ROLES, hasRole } from '@/lib/auth/roleGuards'
import {
  prospectActivitiesQueryKey,
  prospectHeaderQueryKey,
} from '@/features/prospects/api/prospectDetailQueryKeys'
import { ActivityComposer } from './ActivityComposer'
import { ActivityTimeline } from './ActivityTimeline'
import type { ActivityComposerValues, ActivityDTO, UserActivityType } from './types'

interface ActivityPanelProps {
  prospectId: string
  composerSeedType?: UserActivityType
  composerSeedNonce?: number
}

function buildPayload(values: ActivityComposerValues): Record<string, unknown> {
  const contact =
    values.contactId !== undefined && values.contactId !== ''
      ? { contactId: values.contactId }
      : {}
  switch (values.type) {
    case 'note':
      return { summary: values.summary, ...contact }
    case 'call':
      return {
        summary: values.summary,
        ...(values.durationMinutes !== undefined
          ? { durationMinutes: values.durationMinutes }
          : {}),
        ...contact,
      }
    case 'email':
      return {
        summary: values.summary,
        ...(values.subject ? { subject: values.subject } : {}),
        ...contact,
      }
    case 'linkedin':
      return {
        summary: values.summary,
        ...(values.url ? { url: values.url } : {}),
        ...contact,
      }
  }
}

async function fetchActivities(prospectId: string, signal?: AbortSignal): Promise<ActivityDTO[]> {
  const res = await fetch(`/api/prospects/${prospectId}/activities?limit=200`, {
    credentials: 'include',
    signal,
  })
  if (!res.ok) return []
  const data = (await res.json()) as { items: ActivityDTO[] }
  return data.items ?? []
}

export function ActivityPanel({
  prospectId,
  composerSeedType,
  composerSeedNonce,
}: ActivityPanelProps) {
  const { t } = useTranslation()
  const role = useUserStore((s) => s.role)
  const userId = useUserStore((s) => s.user.id || null)
  const queryClient = useQueryClient()
  const queryKey = prospectActivitiesQueryKey(prospectId)

  const { data: activities = [], isLoading: loading } = useQuery({
    queryKey,
    queryFn: ({ signal }) => fetchActivities(prospectId, signal),
  })

  const canCompose = hasRole(role, ACTIVITY_COMPOSER_ROLES)
  const isPrivileged = hasRole(role, OPS_PRIVILEGED_ROLES)

  const invalidateHeader = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: prospectHeaderQueryKey(prospectId) })
  }, [prospectId, queryClient])

  const handleCreate = useCallback(
    async (values: ActivityComposerValues): Promise<boolean> => {
      const res = await fetch(`/api/prospects/${prospectId}/activities`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: values.type, payload: buildPayload(values) }),
      })
      if (!res.ok) {
        if (res.status === 409) {
          toast(t('activities.errors.duplicate_contact'), 'error')
        } else {
          toast(t('activities.errors.create_failed'), 'error')
        }
        return false
      }
      const data = (await res.json()) as { activity: ActivityDTO }
      queryClient.setQueryData<ActivityDTO[]>(queryKey, (items) => [data.activity, ...(items ?? [])])
      invalidateHeader()
      toast(t('activities.toasts.created'), 'success')
      return true
    },
    [prospectId, queryClient, queryKey, invalidateHeader, t],
  )

  const handleUpdate = useCallback(
    async (id: string, summary: string): Promise<boolean> => {
      const target = activities.find((a) => a.id === id)
      if (!target) return false
      const payload: Record<string, unknown> = { ...(target.payload as Record<string, unknown>) }
      payload.summary = summary
      const res = await fetch(`/api/prospects/${prospectId}/activities/${id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: target.type, payload }),
      })
      if (!res.ok) {
        toast(t('activities.errors.update_failed'), 'error')
        return false
      }
      const data = (await res.json()) as { activity: ActivityDTO }
      queryClient.setQueryData<ActivityDTO[]>(queryKey, (items) =>
        (items ?? []).map((a) => (a.id === id ? data.activity : a)),
      )
      toast(t('activities.toasts.updated'), 'success')
      return true
    },
    [activities, prospectId, queryClient, queryKey, t],
  )

  const handleDelete = useCallback(
    async (id: string): Promise<boolean> => {
      const res = await fetch(`/api/prospects/${prospectId}/activities/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (!res.ok) {
        toast(t('activities.errors.delete_failed'), 'error')
        return false
      }
      queryClient.setQueryData<ActivityDTO[]>(queryKey, (items) =>
        (items ?? []).filter((a) => a.id !== id),
      )
      toast(t('activities.toasts.deleted'), 'success')
      return true
    },
    [prospectId, queryClient, queryKey, t],
  )

  return (
    <div className="grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_min(100%,360px)]">
      <div className="min-w-0">
        <ActivityTimeline
          activities={activities}
          loading={loading}
          currentUserId={userId}
          isPrivilegedActor={isPrivileged}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
        />
      </div>
      <aside className="min-w-0 xl:sticky xl:top-4 xl:self-start">
        {canCompose ? (
          <ActivityComposer
            prospectId={prospectId}
            onSubmit={handleCreate}
            initialType={composerSeedType}
            seedNonce={composerSeedNonce}
          />
        ) : (
          <div className={cn(studioTintPanel, 'text-xs text-muted')}>
            {t('activities.composer.readOnlyHint')}
          </div>
        )}
      </aside>
    </div>
  )
}
