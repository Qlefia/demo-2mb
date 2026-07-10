'use client'

import { Input, Label } from '@/components/atoms'
import { AssigneePicker } from '@/features/tasks/AssigneePicker'
import { useTranslation } from 'react-i18next'

interface MeetingFormFieldsProps {
  title: string
  onTitleChange: (v: string) => void
  startsAt: string
  onStartsAtChange: (v: string) => void
  endsAt: string
  onEndsAtChange: (v: string) => void
  location: string
  onLocationChange: (v: string) => void
  assigneeId: string
  onAssigneeIdChange: (v: string) => void
  territory?: 'DE' | 'UK' | 'EU_other' | null
  disabled?: boolean
}

export function MeetingFormFields({
  title,
  onTitleChange,
  startsAt,
  onStartsAtChange,
  endsAt,
  onEndsAtChange,
  location,
  onLocationChange,
  assigneeId,
  onAssigneeIdChange,
  territory,
  disabled,
}: MeetingFormFieldsProps) {
  const { t } = useTranslation()

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="meeting-title">{t('meetings.fields.title')}</Label>
        <Input
          id="meeting-title"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder={t('meetings.fields.titlePlaceholder')}
          maxLength={200}
          disabled={disabled}
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="meeting-starts">{t('meetings.fields.startsAt')}</Label>
          <Input
            id="meeting-starts"
            type="datetime-local"
            value={startsAt}
            onChange={(e) => onStartsAtChange(e.target.value)}
            disabled={disabled}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="meeting-ends">{t('meetings.fields.endsAt')}</Label>
          <Input
            id="meeting-ends"
            type="datetime-local"
            value={endsAt}
            onChange={(e) => onEndsAtChange(e.target.value)}
            disabled={disabled}
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="meeting-assignee">{t('meetings.fields.assignee')}</Label>
        <AssigneePicker
          value={assigneeId}
          onChange={onAssigneeIdChange}
          territory={territory === 'DE' || territory === 'UK' ? territory : null}
          disabled={disabled}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="meeting-location">{t('meetings.fields.location')}</Label>
        <Input
          id="meeting-location"
          value={location}
          onChange={(e) => onLocationChange(e.target.value)}
          placeholder={t('meetings.fields.locationPlaceholder')}
          maxLength={500}
          disabled={disabled}
        />
      </div>
    </div>
  )
}
