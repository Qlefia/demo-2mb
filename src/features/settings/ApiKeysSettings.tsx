'use client'

import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Eye, EyeOff, Trash2 } from 'lucide-react'
import { Button, Input, Label, Badge } from '@/components/atoms'
import { Alert, toast } from '@/components/molecules'

const KEY_ROWS = [
  { id: 'apollo' as const, labelKey: 'settingsPage.apiKeyApollo' },
  { id: 'phantombuster' as const, labelKey: 'settingsPage.apiKeyPhantomBuster' },
  { id: 'browse_ai' as const, labelKey: 'settingsPage.apiKeyBrowseAi' },
  { id: 'anthropic' as const, labelKey: 'settingsPage.apiKeyAnthropic' },
] as const

type KeyId = (typeof KEY_ROWS)[number]['id']

type ApiKeysStatusResponse = {
  keys: Record<KeyId, boolean>
  source: 'server_environment'
}

const emptyDrafts = (): Record<KeyId, string> => ({
  apollo: '',
  phantombuster: '',
  browse_ai: '',
  anthropic: '',
})

export function ApiKeysSettings() {
  const { t } = useTranslation()
  const [serverKeys, setServerKeys] = useState<Record<KeyId, boolean> | null>(null)
  const [drafts, setDrafts] = useState<Record<KeyId, string>>(emptyDrafts)
  const [visibleId, setVisibleId] = useState<string | null>(null)
  const [loadState, setLoadState] = useState<'loading' | 'idle' | 'forbidden' | 'error'>('loading')
  const loadGenerationRef = useRef(0)

  useEffect(() => {
    const myGen = ++loadGenerationRef.current
    void (async () => {
      try {
        setLoadState('loading')
        const res = await fetch('/api/settings/api-keys-status', {
          credentials: 'same-origin',
        })
        if (myGen !== loadGenerationRef.current) return
        if (res.status === 403) {
          setLoadState('forbidden')
          return
        }
        if (!res.ok) {
          setLoadState('error')
          return
        }
        const data = (await res.json()) as ApiKeysStatusResponse
        setServerKeys(data.keys)
        setLoadState('idle')
      } catch {
        if (myGen !== loadGenerationRef.current) return
        setLoadState('error')
      }
    })()
    return () => {
      loadGenerationRef.current += 1
    }
  }, [])

  const handleDraftChange = (id: KeyId, val: string) => {
    setDrafts((prev) => ({ ...prev, [id]: val }))
  }

  const handleRemove = (id: KeyId) => {
    setDrafts((prev) => ({ ...prev, [id]: '' }))
    toast(t('settingsPage.removeKey'), 'success')
  }

  if (loadState === 'forbidden') {
    return (
      <div className="max-w-2xl">
        <Alert variant="warning">{t('settingsPage.apiKeysForbidden')}</Alert>
      </div>
    )
  }

  return (
    <div className="max-w-2xl space-y-8">
      <p className="text-sm text-muted">{t('settingsPage.apiKeyDescription')}</p>
      <Alert variant="info">{t('settingsPage.apiKeyEnvHowTo')}</Alert>
      {loadState === 'error' ? (
        <Alert variant="error">{t('settingsPage.apiKeysStatusError')}</Alert>
      ) : null}

      {KEY_ROWS.map((row) => {
        const configured = serverKeys?.[row.id] === true
        const draft = drafts[row.id]
        const showDraft = draft.trim().length > 0
        const inputReadOnly = configured

        return (
          <div key={row.id} className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Label>{t(row.labelKey)}</Label>
              <Badge variant={configured ? 'success' : 'default'}>
                {configured ? t('settingsPage.apiKeyConfiguredServer') : t('settingsPage.notConfigured')}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative min-w-0 flex-1">
                <Input
                  type={visibleId === row.id ? 'text' : 'password'}
                  value={inputReadOnly ? '' : draft}
                  readOnly={inputReadOnly}
                  onChange={(e) => handleDraftChange(row.id, e.target.value)}
                  placeholder={
                    configured
                      ? t('settingsPage.apiKeyPlaceholderHidden')
                      : t('settingsPage.apiKeyPlaceholderNew')
                  }
                />
                {!inputReadOnly ? (
                  <button
                    type="button"
                    onClick={() => setVisibleId(visibleId === row.id ? null : row.id)}
                    className="absolute right-2 top-1/2 z-10 -translate-y-1/2 text-muted hover:text-foreground"
                  >
                    {visibleId === row.id ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                ) : null}
              </div>
              <Button
                variant="secondary"
                size="md"
                className="shrink-0"
                type="button"
                disabled
                title={t('settingsPage.apiKeyUiSaveLater')}
              >
                {showDraft && !configured ? t('settingsPage.updateKey') : t('settingsPage.addKey')}
              </Button>
              {showDraft && !configured ? (
                <Button
                  variant="ghost"
                  size="md"
                  className="shrink-0 px-2.5"
                  type="button"
                  onClick={() => handleRemove(row.id)}
                  aria-label={t('settingsPage.removeKey')}
                >
                  <Trash2 size={16} className="text-destructive" />
                </Button>
              ) : null}
            </div>
          </div>
        )
      })}
    </div>
  )
}
