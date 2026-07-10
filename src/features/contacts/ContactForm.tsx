'use client'

import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Checkbox, Input } from '@/components/atoms'
import { Field } from '@/features/dossiers/sections/Field'
import { EMPTY_FORM, type ContactFormValues } from './types'

interface ContactFormProps {
  initial?: Partial<ContactFormValues>
  onSubmit: (values: ContactFormValues) => Promise<void> | void
  onCancel?: () => void
  submitting?: boolean
  submitLabelKey?: string
}

export function ContactForm({
  initial,
  onSubmit,
  onCancel,
  submitting,
  submitLabelKey,
}: ContactFormProps) {
  const { t } = useTranslation()
  const [values, setValues] = useState<ContactFormValues>({ ...EMPTY_FORM, ...initial })
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!values.fullName.trim()) {
      setError(t('contacts.errors.fullNameRequired'))
      return
    }
    setError(null)
    await onSubmit(values)
  }

  const update = <K extends keyof ContactFormValues>(key: K, val: ContactFormValues[K]) =>
    setValues((v) => ({ ...v, [key]: val }))

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <Field htmlFor="contact-name" label={t('contacts.fields.fullName')}>
          <Input
            id="contact-name"
            value={values.fullName}
            onChange={(e) => update('fullName', e.target.value)}
            disabled={submitting}
            error={error ?? undefined}
          />
        </Field>
        <Field htmlFor="contact-role" label={t('contacts.fields.role')}>
          <Input
            id="contact-role"
            value={values.role}
            onChange={(e) => update('role', e.target.value)}
            placeholder={t('contacts.fields.rolePlaceholder')}
            disabled={submitting}
          />
        </Field>
        <Field htmlFor="contact-email" label={t('contacts.fields.email')}>
          <Input
            id="contact-email"
            type="email"
            value={values.email}
            onChange={(e) => update('email', e.target.value)}
            disabled={submitting}
          />
        </Field>
        <Field htmlFor="contact-phone" label={t('contacts.fields.phone')}>
          <Input
            id="contact-phone"
            type="tel"
            value={values.phone}
            onChange={(e) => update('phone', e.target.value)}
            disabled={submitting}
          />
        </Field>
        <Field
          htmlFor="contact-linkedin"
          label={t('contacts.fields.linkedinUrl')}
          fullWidth
        >
          <Input
            id="contact-linkedin"
            value={values.linkedinUrl}
            onChange={(e) => update('linkedinUrl', e.target.value)}
            placeholder="https://www.linkedin.com/in/…"
            disabled={submitting}
          />
        </Field>
      </div>
      <Checkbox
        checked={values.optedOut}
        onChange={(checked) => update('optedOut', checked)}
        disabled={submitting}
        label={t('contacts.fields.optedOut')}
      />
      <div className="flex items-center justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="ghost" size="sm" onClick={onCancel} disabled={submitting}>
            {t('common.cancel')}
          </Button>
        )}
        <Button type="submit" variant="primary" size="sm" loading={submitting}>
          {t(submitLabelKey ?? 'common.save')}
        </Button>
      </div>
    </form>
  )
}
