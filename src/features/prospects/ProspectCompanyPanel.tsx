'use client'

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Check, Pencil } from 'lucide-react'
import type { Dispatch, SetStateAction } from 'react'
import type { Prospect } from '@/features/prospects/types'
import type { DossierSections } from '@/lib/dossiers/schema'
import type { DossierRecordDTO } from '@/features/dossiers/types'
import { useProspectContacts } from '@/features/contacts'
import { IconButton } from '@/components/atoms'
import { ProspectCompanyGlance } from '@/features/prospects/ProspectCompanyGlance'
import { Section1Snapshot } from '@/features/dossiers/sections/Section1Snapshot'
import { Section2WhatTheyDo } from '@/features/dossiers/sections/Section2WhatTheyDo'
import { useDossierSectionsAutosave } from '@/features/dossiers/lib/useDossierSectionsAutosave'

interface ProspectCompanyPanelProps {
  prospect: Prospect
  sections: DossierSections
  setSections: Dispatch<SetStateAction<DossierSections>>
  canEdit: boolean
  onDossierSaved?: (result: { dossier: DossierRecordDTO; sections: DossierSections }) => void
}

export function ProspectCompanyPanel({
  prospect,
  sections,
  setSections,
  canEdit,
  onDossierSaved,
}: ProspectCompanyPanelProps) {
  const { t } = useTranslation()
  const [editing, setEditing] = useState(false)
  const { contacts, loading: contactsLoading } = useProspectContacts(prospect.id)
  const { queueSave } = useDossierSectionsAutosave({
    prospectId: prospect.id,
    enabled: canEdit && editing,
    onSaved: onDossierSaved,
  })

  const showEdit = canEdit && !editing
  const showDone = canEdit && editing

  const patchSections = (patch: Partial<DossierSections>) => {
    setSections((current) => {
      const next = { ...current, ...patch }
      queueSave(next)
      return next
    })
  }

  return (
    <div className="space-y-3">
      <div className="flex min-w-0 items-center gap-2">
        {!editing ? (
          <h3 className="min-w-0 flex-1 truncate text-base font-semibold text-foreground">
            {prospect.account.name}
          </h3>
        ) : (
          <p className="min-w-0 flex-1 text-sm font-medium text-foreground">
            {t('prospects.company.editTitle')}
          </p>
        )}
        {showEdit ? (
          <IconButton
            icon={Pencil}
            label={t('prospects.company.edit')}
            variant="secondary"
            size="xs"
            className="shrink-0"
            onClick={() => setEditing(true)}
          />
        ) : null}
        {showDone ? (
          <IconButton
            icon={Check}
            label={t('prospects.company.done')}
            variant="secondary"
            size="xs"
            className="shrink-0"
            onClick={() => setEditing(false)}
          />
        ) : null}
      </div>

      {editing ? (
        <div className="space-y-4">
          <Section1Snapshot
            value={sections.snapshot}
            onChange={(next) => patchSections({ snapshot: next })}
            disabled={!canEdit}
          />
          <Section2WhatTheyDo
            value={sections.what_they_do}
            onChange={(next) => patchSections({ what_they_do: next })}
            disabled={!canEdit}
          />
        </div>
      ) : (
        <ProspectCompanyGlance
          prospect={prospect}
          sections={sections}
          contacts={contacts}
          contactsLoading={contactsLoading}
          showName={false}
        />
      )}
    </div>
  )
}
