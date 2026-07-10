'use client'

import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from '@headlessui/react'
import { Check, ChevronDown, User } from 'lucide-react'
import type { AssignableOwner } from '@/lib/team/types'

interface AssigneePickerProps {
  value: string
  onChange: (id: string) => void
  territory?: 'DE' | 'UK' | 'EU_other' | null
  disabled?: boolean
  /** Allow leaving the picker empty (default false — tasks always need an assignee). */
  allowUnassigned?: boolean
}

export function AssigneePicker({
  value,
  onChange,
  territory,
  disabled,
  allowUnassigned = false,
}: AssigneePickerProps) {
  const { t } = useTranslation()
  const [owners, setOwners] = useState<AssignableOwner[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    const params = new URLSearchParams()
    if (territory === 'DE' || territory === 'UK') params.set('territory', territory)
    void fetch(`/api/team/assignable-owners?${params.toString()}`, { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : { owners: [] }))
      .then((data: { owners?: AssignableOwner[] }) => {
        if (!cancelled) setOwners(data.owners ?? [])
      })
      .catch(() => {
        if (!cancelled) setOwners([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [territory])

  const selected = owners.find((o) => o.id === value) ?? null

  return (
    <Listbox value={value} onChange={onChange} disabled={disabled || loading}>
      <div className="relative">
        <ListboxButton className="survey-brand-input flex h-10 w-full items-center justify-between border border-input bg-transparent px-3 text-sm outline-none transition-colors focus:outline-none disabled:cursor-not-allowed disabled:opacity-50">
          <span className="flex min-w-0 items-center gap-2">
            <User size={14} className="shrink-0 text-muted" />
            <span className="truncate">
              {selected ? selected.displayName : t('tasks.assignee.placeholder')}
            </span>
          </span>
          <ChevronDown size={14} className="text-muted" />
        </ListboxButton>

        <ListboxOptions className="survey-brand-surface absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-sm border border-border bg-background py-1 shadow-none focus:outline-none">
          {allowUnassigned && (
            <ListboxOption
              value=""
              className="flex cursor-pointer items-center justify-between px-3 py-2 text-sm text-muted data-focus:bg-primary/5"
            >
              <span>{t('tasks.assignee.placeholder')}</span>
              {!value && <Check size={14} />}
            </ListboxOption>
          )}
          {owners.length === 0 && !loading && (
            <li className="px-3 py-2 text-xs text-muted">{t('tasks.assignee.noOwners')}</li>
          )}
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
              {value === owner.id && <Check size={14} />}
            </ListboxOption>
          ))}
        </ListboxOptions>
      </div>
    </Listbox>
  )
}
