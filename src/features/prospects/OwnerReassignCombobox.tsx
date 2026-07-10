'use client'

import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from '@headlessui/react'
import { Check, ChevronDown, UserPlus } from 'lucide-react'
import { toast } from '@/components/molecules/Toast'
import { useUserStore } from '@/stores/userStore'
import { useReassignProspectOwnerMutation } from '@/features/prospects/api'
import type { AssignableOwner } from '@/lib/team/types'

const REASSIGN_ROLES = new Set(['founder', 'ops', 'admin'])

interface OwnerReassignComboboxProps {
  prospectId: string
  territory: 'DE' | 'UK' | 'EU_other'
  currentOwnerId: string | null
  hideLabel?: boolean
}

export function OwnerReassignCombobox({
  prospectId,
  territory,
  currentOwnerId,
  hideLabel = false,
}: OwnerReassignComboboxProps) {
  const { t } = useTranslation()
  const role = useUserStore((s) => s.role)
  const reassign = useReassignProspectOwnerMutation()

  const [owners, setOwners] = useState<AssignableOwner[]>([])
  const [loading, setLoading] = useState(false)

  const canReassign = role !== null && REASSIGN_ROLES.has(role) && role !== 'admin'

  useEffect(() => {
    if (!canReassign) return
    const controller = new AbortController()
    setLoading(true)
    const params = new URLSearchParams()
    if (territory === 'DE' || territory === 'UK') {
      params.set('territory', territory)
    }
    void fetch(`/api/team/assignable-owners?${params.toString()}`, {
      credentials: 'include',
      signal: controller.signal,
    })
      .then((res) => (res.ok ? res.json() : { owners: [] }))
      .then((data: { owners?: AssignableOwner[] }) => {
        setOwners(data.owners ?? [])
        setLoading(false)
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === 'AbortError') return
        setOwners([])
        setLoading(false)
      })
    return () => controller.abort()
  }, [canReassign, territory])

  if (!canReassign) {
    return null
  }

  const selected = owners.find((o) => o.id === currentOwnerId) ?? null

  const handleChange = (nextOwnerId: string) => {
    if (reassign.isPending) return
    const target: string | null = nextOwnerId === '' ? null : nextOwnerId
    if (target === currentOwnerId) return
    const nextOwnerLabel =
      target && owners.length > 0
        ? (owners.find((o) => o.id === target)?.displayName ?? null)
        : null
    reassign.mutate(
      { prospectId, nextOwnerId: target, nextOwnerLabel },
      {
        onSuccess: () => toast(t('prospects.ownerReassigned'), 'success'),
        onError: (err) => {
          const payload = err.payload as { reason?: string; error?: string } | null
          toast(payload?.reason ?? payload?.error ?? 'reassign_failed', 'error')
        },
      },
    )
  }

  return (
    <div>
      {hideLabel ? null : <p className="mb-2 crm-meta-label">{t('prospects.reassignOwner')}</p>}
      <Listbox value={currentOwnerId ?? ''} onChange={handleChange} disabled={reassign.isPending || loading}>
        <div className="relative">
          <ListboxButton className="survey-brand-input flex min-h-11 w-full items-center justify-between border border-input bg-transparent px-3 text-sm outline-none transition-colors focus:outline-none disabled:cursor-not-allowed disabled:opacity-50">
            <span className="flex min-w-0 items-center gap-2">
              <UserPlus size={14} className="shrink-0 text-muted" />
              <span className="truncate">
                {selected
                  ? selected.displayName
                  : currentOwnerId
                    ? t('prospects.unassigned')
                    : t('prospects.unassigned')}
              </span>
            </span>
            <ChevronDown size={14} className="text-muted" />
          </ListboxButton>

          <ListboxOptions className="survey-brand-surface absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-sm border border-border bg-background py-1 shadow-none focus:outline-none">
            <ListboxOption
              value=""
              className="flex cursor-pointer items-center justify-between px-3 py-2 text-sm text-muted data-focus:bg-primary/5"
            >
              <span>{t('prospects.unassigned')}</span>
              {!currentOwnerId && <Check size={14} />}
            </ListboxOption>
            {owners.map((owner) => (
              <ListboxOption
                key={owner.id}
                value={owner.id}
                className="flex cursor-pointer items-center justify-between px-3 py-2 text-sm data-focus:bg-primary/5"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{owner.displayName}</p>
                  <p className="truncate text-xs text-muted">
                    {owner.role && t(`team.${owner.role}`)}
                    {owner.territory ? ` · ${owner.territory}` : ''}
                  </p>
                </div>
                {currentOwnerId === owner.id && <Check size={14} />}
              </ListboxOption>
            ))}
          </ListboxOptions>
        </div>
      </Listbox>
    </div>
  )
}
