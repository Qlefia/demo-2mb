'use client'

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Mail,
  Phone,
  Linkedin,
  Edit2,
  Trash2,
  Plus,
  Copy,
  ExternalLink,
  MoreVertical,
  PhoneCall,
  Send,
  AlertTriangle,
  Star,
} from 'lucide-react'
import { Button, Checkbox, IconButton } from '@/components/atoms'
import { toast } from '@/components/molecules/Toast'
import { ConfirmDialog } from '@/components/molecules/ConfirmDialog'
import { DropdownMenu, type DropdownMenuEntry } from '@/components/molecules/DropdownMenu'
import { studioTintPanel } from '@/features/studio-settings/studioBlockChrome'
import { openEasybellCall, openIonosEmail } from '@/lib/comms'
import { cn } from '@/lib/cn'
import { ContactForm } from './ContactForm'
import type { ContactDTO, ContactFormValues } from './types'

async function copyToClipboard(value: string, ok: string, err: string) {
  try {
    await navigator.clipboard.writeText(value)
    toast(ok, 'success')
  } catch {
    toast(err, 'error')
  }
}

interface ContactsListProps {
  contacts: ContactDTO[]
  selectedIds: string[]
  onSelectionChange: (next: string[]) => void
  onCreate: (values: ContactFormValues) => Promise<ContactDTO | null>
  onUpdate: (id: string, values: ContactFormValues) => Promise<ContactDTO | null>
  onDelete: (id: string) => Promise<boolean>
  loading?: boolean
  canEdit: boolean
  /** Show the decision-maker selection checkbox. Off for the People panel. */
  selectable?: boolean
  primaryContactId?: string | null
  onSetPrimary?: (contactId: string) => void | Promise<void>
}

export function ContactsList({
  contacts,
  selectedIds,
  onSelectionChange,
  onCreate,
  onUpdate,
  onDelete,
  loading,
  canEdit,
  selectable = true,
  primaryContactId,
  onSetPrimary,
}: ContactsListProps) {
  const { t } = useTranslation()
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const toggleSelected = (id: string) => {
    onSelectionChange(
      selectedIds.includes(id)
        ? selectedIds.filter((s) => s !== id)
        : [...selectedIds, id],
    )
  }

  const handleCreate = async (values: ContactFormValues) => {
    setSubmitting(true)
    try {
      const created = await onCreate(values)
      if (created) {
        setAdding(false)
        onSelectionChange([...selectedIds, created.id])
        toast(t('contacts.toasts.created'), 'success')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdate = async (id: string, values: ContactFormValues) => {
    setSubmitting(true)
    try {
      const updated = await onUpdate(id, values)
      if (updated) {
        setEditingId(null)
        toast(t('contacts.toasts.updated'), 'success')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    setSubmitting(true)
    try {
      const ok = await onDelete(id)
      if (ok) {
        setConfirmDeleteId(null)
        onSelectionChange(selectedIds.filter((s) => s !== id))
        toast(t('contacts.toasts.deleted'), 'success')
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <p className="text-xs text-muted">{t('common.loading')}</p>
  }

  return (
    <div className="space-y-3">
      {contacts.length === 0 && !adding && (
        <p className={cn(studioTintPanel, 'text-xs text-muted')}>{t('contacts.empty')}</p>
      )}

      <ul className="grid gap-2">
        {contacts.map((contact) => {
          const selected = selectedIds.includes(contact.id)
          if (editingId === contact.id) {
            return (
              <li key={contact.id} className={studioTintPanel}>
                <ContactForm
                  initial={{
                    fullName: contact.fullName,
                    role: contact.role ?? '',
                    email: contact.email ?? '',
                    phone: contact.phone ?? '',
                    linkedinUrl: contact.linkedinUrl ?? '',
                    optedOut: Boolean(contact.optedOutAt),
                  }}
                  onSubmit={(v) => handleUpdate(contact.id, v)}
                  onCancel={() => setEditingId(null)}
                  submitting={submitting}
                  submitLabelKey="common.save"
                />
              </li>
            )
          }
          const menuItems: DropdownMenuEntry[] = [
            { label: t('common.edit'), icon: Edit2, onClick: () => setEditingId(contact.id) },
          ]
          if (onSetPrimary && primaryContactId !== contact.id) {
            menuItems.push({
              label: t('prospects.people.setPrimary'),
              icon: Star,
              onClick: () => void onSetPrimary(contact.id),
            })
          }
          if (contact.email) {
            menuItems.push({
              label: t('prospects.workspace.copyEmail'),
              icon: Copy,
              onClick: () =>
                void copyToClipboard(
                  contact.email!,
                  t('prospects.workspace.copied'),
                  t('prospects.workspace.copyFailed'),
                ),
            })
          }
          if (contact.phone) {
            menuItems.push({
              label: t('prospects.workspace.copyPhone'),
              icon: Copy,
              onClick: () =>
                void copyToClipboard(
                  contact.phone!,
                  t('prospects.workspace.copied'),
                  t('prospects.workspace.copyFailed'),
                ),
            })
            menuItems.push({
              label: t('contacts.actions.callEasybell'),
              icon: PhoneCall,
              onClick: () => {
                if (!openEasybellCall(contact.phone!)) {
                  toast(t('contacts.comms.invalidPhone'), 'error')
                }
              },
            })
          }
          if (contact.email) {
            menuItems.push({
              label: t('contacts.actions.emailIonos'),
              icon: Send,
              onClick: () => {
                if (!openIonosEmail({ to: contact.email! })) {
                  toast(t('contacts.comms.invalidEmail'), 'error')
                }
              },
            })
          }
          if (contact.linkedinUrl) {
            menuItems.push({
              label: t('contacts.actions.openLinkedin'),
              icon: ExternalLink,
              onClick: () => window.open(contact.linkedinUrl!, '_blank', 'noopener'),
            })
          }
          menuItems.push({ separator: true })
          menuItems.push({
            label: t('common.delete'),
            icon: Trash2,
            onClick: () => setConfirmDeleteId(contact.id),
            variant: 'destructive',
          })
          return (
            <li key={contact.id} className={cn('flex items-center gap-3', studioTintPanel)}>
              {canEdit && selectable && (
                <div className="shrink-0">
                  <Checkbox
                    checked={selected}
                    onChange={() => toggleSelected(contact.id)}
                    disabled={submitting}
                  />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="truncate text-sm font-medium">{contact.fullName}</p>
                  <span className="inline-flex shrink-0 items-center gap-1.5">
                    {primaryContactId === contact.id ? (
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-medium uppercase text-primary">
                        <Star size={10} aria-hidden />
                        {t('prospects.people.primaryBadge')}
                      </span>
                    ) : null}
                    {contact.optedOutAt && (
                      <span className="inline-flex items-center gap-1 text-[10px] uppercase text-amber-600">
                        <AlertTriangle size={10} /> {t('contacts.fields.optedOutBadge')}
                      </span>
                    )}
                  </span>
                </div>
                {contact.role && <p className="text-xs text-muted">{contact.role}</p>}
                <div className="mt-1.5 flex flex-wrap gap-3 text-[11px] text-muted">
                  {contact.email && (
                    <button
                      type="button"
                      className="inline-flex cursor-pointer items-center gap-1 hover:text-foreground"
                      onClick={() => {
                        if (!openIonosEmail({ to: contact.email! })) {
                          toast(t('contacts.comms.invalidEmail'), 'error')
                        }
                      }}
                    >
                      <Mail size={11} /> {contact.email}
                    </button>
                  )}
                  {contact.phone && (
                    <button
                      type="button"
                      className="inline-flex cursor-pointer items-center gap-1 hover:text-foreground"
                      onClick={() => {
                        if (!openEasybellCall(contact.phone!)) {
                          toast(t('contacts.comms.invalidPhone'), 'error')
                        }
                      }}
                    >
                      <Phone size={11} /> {contact.phone}
                    </button>
                  )}
                  {contact.linkedinUrl && (
                    <a
                      href={contact.linkedinUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 hover:text-foreground"
                    >
                      <Linkedin size={11} /> LinkedIn
                    </a>
                  )}
                </div>
              </div>
              {canEdit && (
                <DropdownMenu
                  align="right"
                  trigger={
                    <IconButton
                      icon={MoreVertical}
                      variant="ghost"
                      size="sm"
                      label={t('common.actions')}
                      disabled={submitting}
                    />
                  }
                  items={menuItems}
                />
              )}
            </li>
          )
        })}
      </ul>

      <ConfirmDialog
        open={confirmDeleteId !== null}
        onClose={() => setConfirmDeleteId(null)}
        onConfirm={() => confirmDeleteId && void handleDelete(confirmDeleteId)}
        title={t('common.delete')}
        message={t('contacts.deleteConfirm')}
        variant="destructive"
        loading={submitting}
      />

      {canEdit && adding && (
        <div className={studioTintPanel}>
          <ContactForm
            onSubmit={handleCreate}
            onCancel={() => setAdding(false)}
            submitting={submitting}
            submitLabelKey="contacts.actions.add"
          />
        </div>
      )}

      {canEdit && !adding && (
        <Button variant="secondary" size="sm" onClick={() => setAdding(true)}>
          <Plus size={14} />
          {t('contacts.actions.add')}
        </Button>
      )}
    </div>
  )
}
