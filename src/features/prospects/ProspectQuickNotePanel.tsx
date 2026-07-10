'use client'

import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { TextArea } from '@/components/atoms'
import { useProspectQuery } from '@/features/prospects/api/useProspectDetailQuery'
import { patchProspect, PROSPECTS_QUERY_KEY } from '@/features/prospects/api/prospectsApi'
import { prospectDetailQueryKey } from '@/features/prospects/api/prospectDetailQueryKeys'
import type { Prospect } from '@/features/prospects/types'

const DEBOUNCE_MS = 500

interface ProspectQuickNotePanelProps {
  prospectId: string
}

export function ProspectQuickNotePanel({ prospectId }: ProspectQuickNotePanelProps) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { data: prospect, isLoading } = useProspectQuery(prospectId)
  const [draft, setDraft] = useState('')
  const lastPushedRef = useRef<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')

  useEffect(() => {
    if (!prospect) return
    const remote = prospect.quickNote ?? ''
    if (remote === lastPushedRef.current) return
    setDraft(remote)
    lastPushedRef.current = remote
  }, [prospect?.id, prospect?.quickNote])

  useEffect(
    () => () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    },
    [],
  )

  const mutation = useMutation({
    mutationFn: (quickNote: string | null) =>
      patchProspect({ prospectId, body: { quickNote } }),
    onMutate: () => setSaveState('saving'),
    onSuccess: ({ prospect: next }) => {
      const saved = next.quickNote ?? ''
      lastPushedRef.current = saved
      queryClient.setQueryData(prospectDetailQueryKey(prospectId), next)
      queryClient.setQueryData<Prospect[]>(PROSPECTS_QUERY_KEY, (list) =>
        list?.map((p) => (p.id === next.id ? { ...p, quickNote: next.quickNote } : p)),
      )
      setSaveState('saved')
    },
    onError: () => setSaveState('error'),
  })

  function scheduleSave(value: string) {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      const payload = value.length === 0 ? null : value
      if (payload === lastPushedRef.current || (payload === null && lastPushedRef.current === '')) {
        setSaveState('idle')
        return
      }
      mutation.mutate(payload)
    }, DEBOUNCE_MS)
  }

  const statusLabel =
    saveState === 'saving'
      ? t('prospects.workspace.quickNoteSaving')
      : saveState === 'saved'
        ? t('prospects.workspace.quickNoteSaved')
        : saveState === 'error'
          ? t('prospects.workspace.quickNoteError')
          : null

  return (
    <div className="space-y-2">
      <div className="flex min-h-5 items-center justify-between gap-2">
        <p className="crm-meta-label">{t('prospects.workspace.quickNote')}</p>
        {statusLabel ? <span className="text-[10px] text-muted">{statusLabel}</span> : null}
      </div>
      <TextArea
        rows={8}
        value={draft}
        disabled={isLoading && !prospect}
        onChange={(e) => {
          const next = e.target.value
          setDraft(next)
          setSaveState('idle')
          scheduleSave(next)
        }}
        placeholder={t('prospects.workspace.quickNotePlaceholder')}
        className="text-sm"
      />
      <p className="text-xs text-muted">{t('prospects.workspace.quickNoteHint')}</p>
    </div>
  )
}
