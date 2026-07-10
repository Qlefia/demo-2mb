'use client'

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/cn'
import { useUserStore } from '@/stores/userStore'
import { CONTACT_EDITOR_ROLES, hasRole } from '@/lib/auth/roleGuards'
import { ContactsList, useProspectContacts, useSetPrimaryContactMutation } from '@/features/contacts'
import type { Prospect } from '@/features/prospects/types'
import { studioTintPanel } from '@/features/studio-settings/studioBlockChrome'

interface ProspectPeoplePanelProps {
  prospect: Prospect
  onProspectUpdated: (next: Prospect) => void
}

export function ProspectPeoplePanel({ prospect, onProspectUpdated }: ProspectPeoplePanelProps) {
  const { t } = useTranslation()
  const role = useUserStore((s) => s.role)
  const { contacts, loading, create, update, remove } = useProspectContacts(prospect.id)
  const setPrimary = useSetPrimaryContactMutation(prospect.id)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const canEdit = hasRole(role, CONTACT_EDITOR_ROLES)

  return (
    <div className="space-y-3">
      <p className={cn(studioTintPanel, 'text-xs text-muted')}>{t('prospects.people.hint')}</p>
      <ContactsList
        contacts={contacts}
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        onCreate={create}
        onUpdate={update}
        onDelete={remove}
        loading={loading}
        canEdit={canEdit}
        selectable={false}
        primaryContactId={prospect.primaryContactId}
        onSetPrimary={
          canEdit
            ? async (contactId) => {
                const next = await setPrimary.mutateAsync(contactId)
                onProspectUpdated(next)
              }
            : undefined
        }
      />
    </div>
  )
}
