'use client'

import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Mail, Phone, Linkedin } from 'lucide-react'
import { Button } from '@/components/atoms'
import { studioTintPanel } from '@/features/studio-settings/studioBlockChrome'
import type { ContactDTO } from '@/features/contacts/types'

interface ProspectRelationshipsPanelProps {
  prospectId: string
  onOpenDossierTab: () => void
}

export function ProspectRelationshipsPanel({
  prospectId,
  onOpenDossierTab,
}: ProspectRelationshipsPanelProps) {
  const { t } = useTranslation()
  const [items, setItems] = useState<ContactDTO[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(() => {
    setLoading(true)
    void fetch(`/api/prospects/${prospectId}/contacts`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then((data: { items?: ContactDTO[] }) => setItems(data.items ?? []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }, [prospectId])

  useEffect(() => {
    load()
  }, [load])

  if (loading) {
    return <p className="text-sm text-muted">{t('common.loading')}</p>
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted">{t('prospects.workspace.relationshipsHint')}</p>
      {items.length === 0 ? (
        <p className="text-sm text-muted">{t('contacts.empty')}</p>
      ) : (
        <ul className="grid gap-2">
          {items.map((c) => (
            <li key={c.id} className={studioTintPanel}>
              <p className="text-sm font-medium">{c.fullName}</p>
              {c.role ? <p className="text-xs text-muted">{c.role}</p> : null}
              <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted">
                {c.email ? (
                  <span className="inline-flex items-center gap-1">
                    <Mail size={12} /> {c.email}
                  </span>
                ) : null}
                {c.phone ? (
                  <span className="inline-flex items-center gap-1">
                    <Phone size={12} /> {c.phone}
                  </span>
                ) : null}
                {c.linkedinUrl ? (
                  <a
                    href={c.linkedinUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 hover:text-foreground"
                  >
                    <Linkedin size={12} /> LinkedIn
                  </a>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
      <Button type="button" variant="secondary" size="sm" onClick={onOpenDossierTab}>
        {t('prospects.workspace.openDossierForContacts')}
      </Button>
    </div>
  )
}
