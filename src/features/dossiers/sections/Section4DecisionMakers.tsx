'use client'

import { useTranslation } from 'react-i18next'
import { TextArea } from '@/components/atoms'
import { ContactsList } from '@/features/contacts'
import type { ContactDTO, ContactFormValues } from '@/features/contacts'
import type { DecisionMakersSection } from '@/lib/dossiers/schema'
import { Field } from './Field'

interface Props {
  value: DecisionMakersSection | undefined
  onChange: (next: DecisionMakersSection) => void
  contacts: ContactDTO[]
  contactsLoading: boolean
  canEditContacts: boolean
  onCreateContact: (values: ContactFormValues) => Promise<ContactDTO | null>
  onUpdateContact: (id: string, values: ContactFormValues) => Promise<ContactDTO | null>
  onDeleteContact: (id: string) => Promise<boolean>
  disabled?: boolean
}

export function Section4DecisionMakers({
  value,
  onChange,
  contacts,
  contactsLoading,
  canEditContacts,
  onCreateContact,
  onUpdateContact,
  onDeleteContact,
  disabled,
}: Props) {
  const { t } = useTranslation()
  const current: DecisionMakersSection = value ?? { contactIds: [] }

  return (
    <div className="space-y-4">
      <ContactsList
        contacts={contacts}
        selectedIds={current.contactIds ?? []}
        onSelectionChange={(ids) => onChange({ ...current, contactIds: ids })}
        onCreate={onCreateContact}
        onUpdate={onUpdateContact}
        onDelete={onDeleteContact}
        loading={contactsLoading}
        canEdit={canEditContacts && !disabled}
      />
      <p className="text-xs text-muted">
        {t('dossier.sections.decision_makers.selectionHint', {
          count: current.contactIds?.length ?? 0,
        })}
      </p>
      <Field
        htmlFor="decision-notes"
        label={t('dossier.sections.decision_makers.fields.notes')}
      >
        <TextArea
          id="decision-notes"
          rows={2}
          value={current.notes ?? ''}
          onChange={(e) => onChange({ ...current, notes: e.target.value || undefined })}
          disabled={disabled || !canEditContacts}
        />
      </Field>
    </div>
  )
}
