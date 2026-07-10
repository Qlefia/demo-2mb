'use client'

import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Mail, Phone, Linkedin, NotebookPen, Send } from 'lucide-react'
import { cn } from '@/lib/cn'
import { Button, Input, TextArea } from '@/components/atoms'
import { Select } from '@/components/molecules/Select'
import { Field } from '@/features/dossiers/sections/Field'
import { studioTintPanel } from '@/features/studio-settings/studioBlockChrome'
import type { ContactDTO } from '@/lib/contacts/schema'
import { USER_ACTIVITY_TYPES } from '@/lib/activities/schema'
import type { ActivityComposerValues, UserActivityType } from './types'

interface ActivityComposerProps {
  prospectId: string
  onSubmit: (values: ActivityComposerValues) => Promise<boolean>
  disabled?: boolean
  /** Preselect a type (e.g. 'call' when launched from the header "Log call"). */
  initialType?: UserActivityType
  /** Changes whenever the header re-triggers a seed, so the same type re-applies. */
  seedNonce?: number
}

const ICONS: Record<UserActivityType, typeof Mail> = {
  note: NotebookPen,
  call: Phone,
  email: Mail,
  linkedin: Linkedin,
}

export function ActivityComposer({
  prospectId,
  onSubmit,
  disabled,
  initialType,
  seedNonce,
}: ActivityComposerProps) {
  const { t } = useTranslation()
  const [type, setType] = useState<UserActivityType>(initialType ?? 'note')
  const [summary, setSummary] = useState('')
  const [duration, setDuration] = useState('')
  const [subject, setSubject] = useState('')
  const [url, setUrl] = useState('')
  const [contactId, setContactId] = useState('')
  const [contacts, setContacts] = useState<ContactDTO[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (initialType) setType(initialType)
    // `seedNonce` lets the header re-apply the same type on repeated clicks.
  }, [initialType, seedNonce])

  useEffect(() => {
    let cancelled = false
    void fetch(`/api/prospects/${prospectId}/contacts`, { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : { items: [] }))
      .then((data: { items?: ContactDTO[] }) => {
        if (!cancelled) setContacts(data.items ?? [])
      })
      .catch(() => {
        if (!cancelled) setContacts([])
      })
    return () => {
      cancelled = true
    }
  }, [prospectId])

  const handleSubmit = async () => {
    if (!summary.trim()) {
      setError(t('activities.composer.summaryRequired'))
      return
    }
    setError(null)
    setSubmitting(true)
    try {
      const ok = await onSubmit({
        type,
        summary: summary.trim(),
        durationMinutes:
          type === 'call' && duration.trim() !== '' ? Number.parseInt(duration, 10) : undefined,
        subject: type === 'email' && subject.trim() ? subject.trim() : undefined,
        url: type === 'linkedin' && url.trim() ? url.trim() : undefined,
        contactId: contactId.trim() !== '' ? contactId : undefined,
      })
      if (ok) {
        setSummary('')
        setDuration('')
        setSubject('')
        setUrl('')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className={cn('space-y-3', studioTintPanel)}>
      <div className="flex flex-wrap gap-1">
        {USER_ACTIVITY_TYPES.map((typeKey) => {
          const Icon = ICONS[typeKey]
          const active = type === typeKey
          return (
            <button
              key={typeKey}
              type="button"
              onClick={() => setType(typeKey)}
              disabled={disabled || submitting}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs transition-colors disabled:opacity-50',
                active
                  ? 'bg-primary/10 font-medium text-foreground'
                  : 'text-muted hover:bg-hover hover:text-foreground',
              )}
            >
              <Icon size={12} />
              {t(`activities.types.${typeKey}`)}
            </button>
          )
        })}
      </div>

      {contacts.length > 0 && (
        <Field htmlFor="composer-contact" label={t('activities.composer.contact')}>
          <Select
            value={contactId}
            onChange={setContactId}
            disabled={disabled || submitting}
            placeholder={t('activities.composer.noContact')}
            options={[
              { value: '', label: t('activities.composer.noContact') },
              ...contacts.map((c) => ({
                value: c.id,
                label: c.role ? `${c.fullName} · ${c.role}` : c.fullName,
              })),
            ]}
          />
        </Field>
      )}

      {type === 'call' && (
        <Field htmlFor="composer-duration" label={t('activities.composer.durationMinutes')}>
          <Input
            id="composer-duration"
            type="number"
            inputMode="numeric"
            min={1}
            max={600}
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            disabled={disabled || submitting}
          />
        </Field>
      )}

      {type === 'email' && (
        <Field htmlFor="composer-subject" label={t('activities.composer.subject')}>
          <Input
            id="composer-subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            disabled={disabled || submitting}
          />
        </Field>
      )}

      {type === 'linkedin' && (
        <Field htmlFor="composer-url" label={t('activities.composer.url')}>
          <Input
            id="composer-url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.linkedin.com/messaging/…"
            disabled={disabled || submitting}
          />
        </Field>
      )}

      <Field htmlFor="composer-summary" label={t('activities.composer.summary')}>
        <TextArea
          id="composer-summary"
          rows={3}
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          placeholder={t(`activities.composer.placeholder.${type}`)}
          error={error ?? undefined}
          disabled={disabled || submitting}
        />
      </Field>

      <div className="flex justify-end">
        <Button
          variant="primary"
          size="sm"
          onClick={() => void handleSubmit()}
          loading={submitting}
          disabled={disabled || !summary.trim()}
        >
          <Send size={12} />
          {t('activities.composer.submit')}
        </Button>
      </div>
    </div>
  )
}
