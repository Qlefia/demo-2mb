'use client'

import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Input } from '@/components/atoms'
import { Field } from '@/features/dossiers/sections/Field'
import { AssigneePicker } from './AssigneePicker'
import { EMPTY_TASK_FORM, type TaskFormValues } from './types'

interface TaskFormProps {
  initial?: Partial<TaskFormValues>
  territory?: 'DE' | 'UK' | 'EU_other' | null
  submitting?: boolean
  submitLabelKey?: string
  onSubmit: (values: TaskFormValues) => Promise<void> | void
  onCancel?: () => void
}

function toDateInputValue(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  // Local datetime input value: yyyy-MM-ddTHH:mm
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function fromDateInputValue(local: string): string | null {
  if (!local) return null
  const d = new Date(local)
  if (Number.isNaN(d.getTime())) return null
  return d.toISOString()
}

export function TaskForm({
  initial,
  territory,
  submitting,
  submitLabelKey,
  onSubmit,
  onCancel,
}: TaskFormProps) {
  const { t } = useTranslation()
  const [values, setValues] = useState<TaskFormValues>({ ...EMPTY_TASK_FORM, ...initial })
  const [error, setError] = useState<string | null>(null)
  const [dueLocal, setDueLocal] = useState<string>(toDateInputValue(values.dueAt))

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!values.title.trim()) {
      setError(t('tasks.errors.titleRequired'))
      return
    }
    if (!values.assigneeId) {
      setError(t('tasks.errors.assigneeRequired'))
      return
    }
    setError(null)
    await onSubmit({
      title: values.title.trim(),
      assigneeId: values.assigneeId,
      dueAt: fromDateInputValue(dueLocal),
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Field htmlFor="task-title" label={t('tasks.fields.title')}>
        <Input
          id="task-title"
          value={values.title}
          onChange={(e) => setValues((v) => ({ ...v, title: e.target.value }))}
          placeholder={t('tasks.fields.titlePlaceholder')}
          disabled={submitting}
          error={error ?? undefined}
        />
      </Field>
      <div className="grid grid-cols-1 gap-3">
        <Field htmlFor="task-assignee" label={t('tasks.fields.assignee')}>
          <AssigneePicker
            value={values.assigneeId}
            onChange={(id) => setValues((v) => ({ ...v, assigneeId: id }))}
            territory={territory ?? null}
            disabled={submitting}
          />
        </Field>
        <Field htmlFor="task-due" label={t('tasks.fields.dueAt')}>
          <Input
            id="task-due"
            type="datetime-local"
            value={dueLocal}
            onChange={(e) => setDueLocal(e.target.value)}
            disabled={submitting}
          />
        </Field>
      </div>
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
