'use client'

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { appFetch } from '@/lib/http/appFetch'
import { Button, Input } from '@/components/atoms'
import { Modal } from '@/components/molecules/Modal'
import { useUserStore } from '@/stores/userStore'
import { useAuthStore } from '@/stores/authStore'

const PERSIST_KEYS = [
  '2mb-crm-user',
  '2mb-crm-language',
  '2mb-crm-prospects-ui',
] as const

function clearAllUserData() {
  if (typeof window === 'undefined') return
  for (const key of PERSIST_KEYS) window.localStorage.removeItem(key)
}

export function DangerZone() {
  const { t } = useTranslation()
  const displayName = useUserStore((s) => s.user.displayName)
  // Don't hit /api/prospects from the Settings → Data screen just to render
  // a count — that triggered an unrelated network request (and spinner if
  // the dashboard was the next route the user opened). The delete-account
  // copy is intentionally generic: it says "all your prospects" without
  // exposing the exact number, which was never validated against reality
  // anyway (RLS could hide rows from the current user).
  const prospectCount = 0
  const signOut = useAuthStore((s) => s.signOut)
  const [open, setOpen] = useState(false)
  const [confirmName, setConfirmName] = useState('')
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    if (confirmName !== displayName) return
    setDeleting(true)

    const res = await appFetch('/api/account/delete', { method: 'POST' })
    if (!res.ok) {
      setDeleting(false)
      return
    }

    await signOut()
    clearAllUserData()
    window.location.href = '/login'
  }

  return (
    <section className="rounded-sm border border-border p-6">
      <p className="text-sm text-muted">{t('settingsPage.deleteAccountDesc')}</p>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-2 text-sm text-muted transition-colors hover:underline hover:text-destructive"
      >
        {t('settingsPage.deleteAccount')}
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title={t('settingsPage.deleteAccount')}>
        <div className="space-y-4">
          <p className="text-sm text-muted">{t('settingsPage.deleteAccountPreview')}</p>
          <ul className="list-disc pl-4 space-y-0.5 text-sm text-muted">
            <li>{t('settingsPage.deleteAccountProspects', { count: prospectCount })}</li>
            <li>{t('settingsPage.deleteAccountFiles')}</li>
          </ul>
          <p className="text-sm text-muted">{t('settingsPage.deleteAccountConfirmName')}</p>
          <Input
            value={confirmName}
            onChange={(e) => setConfirmName(e.target.value)}
            placeholder={displayName}
          />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              variant="destructive"
              disabled={confirmName !== displayName || deleting}
              loading={deleting}
              onClick={handleDelete}
            >
              {t('settingsPage.deleteAccountButton')}
            </Button>
          </div>
        </div>
      </Modal>
    </section>
  )
}
