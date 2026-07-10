'use client'

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Bell, Inbox, BellOff } from 'lucide-react'
import { Button, Label } from '@/components/atoms'
import { toast } from '@/components/molecules/Toast'

type NotificationMode = 'realtime' | 'digest' | 'off'

interface ModeOption {
  value: NotificationMode
  labelKey: string
  icon: typeof Bell
}

const MODE_OPTIONS: ModeOption[] = [
  { value: 'realtime', labelKey: 'settingsPage.notificationModeRealtime', icon: Bell },
  { value: 'digest', labelKey: 'settingsPage.notificationModeDigest', icon: Inbox },
  { value: 'off', labelKey: 'settingsPage.notificationsOff', icon: BellOff },
]

const CATEGORY_KEYS = [
  'settingsPage.notificationCategoryAssigned',
  'settingsPage.notificationCategoryDossier',
  'settingsPage.notificationCategoryTaskDue',
  'settingsPage.notificationCategoryMention',
] as const

export function NotificationSettings() {
  const { t } = useTranslation()
  const [mode, setMode] = useState<NotificationMode>('realtime')

  const handleSave = () => {
    toast(t('common.save'), 'success')
  }

  return (
    <div className="crm-prose-width space-y-8">
      <div className="space-y-3">
        <Label>{t('settingsPage.notificationMode')}</Label>
        <div className="space-y-2" role="radiogroup" aria-label={t('settingsPage.notificationMode')}>
          {MODE_OPTIONS.map((opt) => {
            const Icon = opt.icon
            const checked = mode === opt.value
            return (
              <label
                key={opt.value}
                className={`flex cursor-pointer items-start gap-3 border-b border-border py-3 text-sm transition-colors last:border-b-0 ${
                  checked ? 'bg-active' : 'hover:bg-hover'
                }`}
              >
                <input
                  type="radio"
                  name="notification-mode"
                  value={opt.value}
                  checked={checked}
                  onChange={() => setMode(opt.value)}
                  className="mt-0.5 h-4 w-4 accent-foreground"
                />
                <Icon size={16} className="mt-0.5 shrink-0 text-muted" aria-hidden="true" />
                <span>{t(opt.labelKey)}</span>
              </label>
            )
          })}
        </div>
      </div>

      <div className="space-y-2">
        <Label>{t('settingsPage.notificationCategoriesTitle')}</Label>
        <p className="text-xs text-muted">{t('settingsPage.notificationCategoriesHint')}</p>
        <ul className="space-y-1.5 text-sm text-muted">
          {CATEGORY_KEYS.map((key) => (
            <li key={key} className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-muted/50" aria-hidden="true" />
              {t(key)}
            </li>
          ))}
        </ul>
      </div>

      <Button onClick={handleSave}>{t('common.save')}</Button>
    </div>
  )
}
