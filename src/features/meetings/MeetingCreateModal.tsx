'use client'

import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from '@headlessui/react'
import { Check, ChevronDown, Search } from 'lucide-react'
import { Button } from '@/components/atoms'
import { Modal } from '@/components/molecules/Modal'
import { toast } from '@/components/molecules/Toast'
import { refetchMeetingSurfaces } from '@/features/meetings/api/meetingsQueryKeys'
import { fetchProspects, PROSPECTS_QUERY_KEY } from '@/features/prospects/api/prospectsApi'
import { MeetingFormFields } from '@/features/meetings/MeetingFormFields'
import {
  defaultEndsAtLocal,
  defaultStartsAtLocal,
  fromLocalDatetimeInput,
} from '@/features/meetings/lib/meetingFormUtils'
import { useUserStore } from '@/stores/userStore'
import { cn } from '@/lib/cn'

interface MeetingCreateModalProps {
  open: boolean
  onClose: () => void
  /** Pre-fill prospect when opened from prospect card. */
  prospectId?: string | null
  /** Pre-fill start when clicking a day slot on the calendar. */
  initialStartsAt?: string | null
  onCreated?: (meeting: import('@/lib/meetings/schema').MeetingDTO) => void
}

export function MeetingCreateModal({
  open,
  onClose,
  prospectId: fixedProspectId,
  initialStartsAt,
  onCreated,
}: MeetingCreateModalProps) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const userId = useUserStore((s) => s.user.id)
  const { data: prospects = [] } = useQuery({
    queryKey: PROSPECTS_QUERY_KEY,
    queryFn: ({ signal }) => fetchProspects(signal),
    enabled: open && !fixedProspectId,
    staleTime: 30_000,
  })

  const [prospectId, setProspectId] = useState(fixedProspectId ?? '')
  const [prospectSearch, setProspectSearch] = useState('')
  const [title, setTitle] = useState('')
  const [startsAt, setStartsAt] = useState(defaultStartsAtLocal())
  const [endsAt, setEndsAt] = useState(defaultEndsAtLocal(defaultStartsAtLocal()))
  const [location, setLocation] = useState('')
  const [assigneeId, setAssigneeId] = useState(userId)
  const [submitting, setSubmitting] = useState(false)

  const effectiveProspectId = fixedProspectId ?? prospectId
  const selectedProspect = prospects.find((p) => p.id === effectiveProspectId) ?? null

  const filteredProspects = useMemo(() => {
    const q = prospectSearch.trim().toLowerCase()
    if (!q) return prospects.slice(0, 40)
    return prospects
      .filter((p) => p.account.name.toLowerCase().includes(q))
      .slice(0, 40)
  }, [prospects, prospectSearch])

  useEffect(() => {
    if (!open) return
    const start = initialStartsAt ? initialStartsAt : defaultStartsAtLocal()
    setStartsAt(start)
    setEndsAt(defaultEndsAtLocal(start))
    setTitle('')
    setLocation('')
    setAssigneeId(userId)
    if (fixedProspectId) setProspectId(fixedProspectId)
    else setProspectId('')
    setProspectSearch('')
  }, [open, initialStartsAt, fixedProspectId, userId])

  function handleStartsChange(v: string) {
    setStartsAt(v)
    setEndsAt(defaultEndsAtLocal(v))
  }

  async function handleSubmit() {
    if (!effectiveProspectId || !title.trim() || !assigneeId) return
    setSubmitting(true)
    try {
      const startIso = fromLocalDatetimeInput(startsAt)
      const endIso = fromLocalDatetimeInput(endsAt)
      const res = await fetch(`/api/prospects/${effectiveProspectId}/meetings`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          startsAt: startIso,
          endsAt: endIso,
          location: location.trim() || null,
          assigneeId,
        }),
      })
      if (!res.ok) {
        toast(t('meetings.errors.create_failed'), 'error')
        return
      }
      const data = (await res.json()) as { meeting: import('@/lib/meetings/schema').MeetingDTO }
      await refetchMeetingSurfaces(queryClient, effectiveProspectId)
      onCreated?.(data.meeting)
      toast(t('meetings.toasts.created'), 'success')
      onClose()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('meetings.createTitle')}
      panelClassName="max-w-lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            {t('common.cancel')}
          </Button>
          <Button
            onClick={() => void handleSubmit()}
            disabled={submitting || !effectiveProspectId || !title.trim() || !assigneeId}
          >
            {t('meetings.add')}
          </Button>
        </>
      }
    >
      <div className="space-y-4 overflow-y-auto px-6 py-4">
        {!fixedProspectId ? (
          <div className="space-y-1.5">
            <span className="crm-meta-label">{t('meetings.fields.prospect')}</span>
            <Listbox value={prospectId} onChange={setProspectId}>
              <div className="relative">
                <ListboxButton className="survey-brand-input flex h-10 w-full items-center justify-between border border-input bg-transparent px-3 text-sm">
                  <span className="truncate">
                    {selectedProspect ? selectedProspect.account.name : t('meetings.fields.prospectPlaceholder')}
                  </span>
                  <ChevronDown size={14} className="shrink-0 text-muted" />
                </ListboxButton>
                <ListboxOptions className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-sm border border-border bg-background py-1 shadow-lg">
                  <div className="sticky top-0 border-b border-border bg-background px-2 py-2">
                    <div className="relative">
                      <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-muted" />
                      <input
                        type="search"
                        value={prospectSearch}
                        onChange={(e) => setProspectSearch(e.target.value)}
                        placeholder={t('meetings.fields.prospectSearch')}
                        className="h-8 w-full rounded-sm border border-input bg-transparent pl-7 pr-2 text-xs outline-none"
                      />
                    </div>
                  </div>
                  {filteredProspects.map((p) => (
                    <ListboxOption
                      key={p.id}
                      value={p.id}
                      className={({ focus }) =>
                        cn(
                          'flex cursor-pointer items-center justify-between px-3 py-2 text-sm',
                          focus && 'bg-hover',
                        )
                      }
                    >
                      <span className="truncate">{p.account.name}</span>
                      {prospectId === p.id ? <Check size={14} className="shrink-0" /> : null}
                    </ListboxOption>
                  ))}
                </ListboxOptions>
              </div>
            </Listbox>
          </div>
        ) : selectedProspect ? (
          <p className="text-sm text-muted">
            {t('meetings.fields.prospect')}: <span className="font-medium text-foreground">{selectedProspect.account.name}</span>
          </p>
        ) : null}

        <MeetingFormFields
          title={title}
          onTitleChange={setTitle}
          startsAt={startsAt}
          onStartsAtChange={handleStartsChange}
          endsAt={endsAt}
          onEndsAtChange={setEndsAt}
          location={location}
          onLocationChange={setLocation}
          assigneeId={assigneeId}
          onAssigneeIdChange={setAssigneeId}
          territory={selectedProspect?.territory ?? null}
          disabled={submitting}
        />
      </div>
    </Modal>
  )
}
