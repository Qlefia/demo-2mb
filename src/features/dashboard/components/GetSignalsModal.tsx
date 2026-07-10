'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { Radio, RadioGroup } from '@headlessui/react'
import { Label, Button } from '@/components/atoms'
import { Modal } from '@/components/molecules/Modal'
import { Select } from '@/components/molecules/Select'
import { cn } from '@/lib/cn'
import { studioRadiusBlock } from '@/features/studio-settings/studioBlockChrome'
import { useProspectsQuery } from '@/features/prospects/api'
import { DASHBOARD_HOME_QUERY_KEY } from '@/features/dashboard/lib/dashboardApi'
import { useQueryClient } from '@tanstack/react-query'

interface SignalScanKeys {
  apollo: boolean
  newsapi: boolean
  anthropic: boolean
}

interface SignalScanPreview {
  prospectId: string
  accountName: string
  text: string
  triggerId: string
}

interface SignalScanResponse {
  scanned: number
  newTriggers: number
  skipped: number
  previews: SignalScanPreview[]
  errors: Array<{ prospectId: string; accountName: string; message: string }>
}

async function fetchSignalKeys(): Promise<SignalScanKeys> {
  const res = await fetch('/api/signals/scan', { credentials: 'include' })
  if (!res.ok) throw new Error('keys_failed')
  const json = (await res.json()) as { keys: SignalScanKeys }
  return json.keys
}

interface GetSignalsModalProps {
  open: boolean
  onClose: () => void
  presetProspectId?: string | null
}

export function GetSignalsModal({ open, onClose, presetProspectId }: GetSignalsModalProps) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { data: prospects = [] } = useProspectsQuery()

  const [scope, setScope] = useState<'all' | 'one'>('all')
  const [prospectId, setProspectId] = useState('')
  const [scanning, setScanning] = useState(false)
  const [result, setResult] = useState<SignalScanResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  const keysQuery = useQuery({
    queryKey: ['signals', 'keys'],
    queryFn: fetchSignalKeys,
    enabled: open,
  })

  const prospectOptions = useMemo(
    () =>
      prospects
        .filter((p) => p.stage !== 'won' && p.stage !== 'lost')
        .map((p) => ({ value: p.id, label: p.account.name })),
    [prospects],
  )

  useEffect(() => {
    if (!open) return
    setResult(null)
    setError(null)
    setScanning(false)
    if (presetProspectId) {
      setScope('one')
      setProspectId(presetProspectId)
      return
    }
    setScope('all')
    if (prospectOptions.length > 0) {
      setProspectId(prospectOptions[0].value)
    }
  }, [open, presetProspectId, prospectOptions])

  const missingKeys = keysQuery.data
    ? !keysQuery.data.anthropic || (!keysQuery.data.newsapi && !keysQuery.data.apollo)
    : false

  async function handleScan() {
    setScanning(true)
    setError(null)
    setResult(null)
    try {
      const res = await fetch('/api/signals/scan', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scope,
          prospectId: scope === 'one' ? prospectId : undefined,
        }),
      })
      const json = (await res.json()) as SignalScanResponse & { error?: string }
      if (!res.ok) {
        setError(json.error ?? 'scan_failed')
        return
      }
      setResult(json)
      void queryClient.invalidateQueries({ queryKey: DASHBOARD_HOME_QUERY_KEY })
    } catch {
      setError('scan_failed')
    } finally {
      setScanning(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={() => !scanning && onClose()}
      title={t('signalsScan.title')}
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose} disabled={scanning}>
            {result ? t('common.close') : t('common.cancel')}
          </Button>
          {!result ? (
            <Button
              type="button"
              onClick={() => void handleScan()}
              disabled={scanning || missingKeys || (scope === 'one' && !prospectId)}
              loading={scanning}
            >
              {t('signalsScan.run')}
            </Button>
          ) : null}
        </>
      }
    >
      {missingKeys ? (
        <p className="mb-4 text-sm text-destructive">{t('signalsScan.errors.missingKeys')}</p>
      ) : null}

      {!result ? (
        <div className="space-y-4">
          <p className="text-sm text-muted">{t('signalsScan.description')}</p>

          <RadioGroup value={scope} onChange={setScope} className="space-y-2">
            <Label>{t('signalsScan.scopeLabel')}</Label>
            {(['all', 'one'] as const).map((value) => (
              <Radio
                key={value}
                value={value}
                className={cn(
                  studioRadiusBlock,
                  'flex cursor-pointer items-center gap-2 border border-border px-3 py-2 text-sm data-checked:border-foreground data-checked:bg-foreground/5',
                )}
              >
                {t(`signalsScan.scope.${value}`)}
              </Radio>
            ))}
          </RadioGroup>

          {scope === 'one' ? (
            <div>
              <Label>{t('signalsScan.prospectLabel')}</Label>
              <Select
                value={prospectId}
                onChange={setProspectId}
                options={prospectOptions}
                placeholder={t('meetings.fields.prospectPlaceholder')}
              />
            </div>
          ) : null}

          {error ? <p className="text-sm text-destructive">{t(`signalsScan.errors.${error}`, { defaultValue: error })}</p> : null}
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm font-medium">
            {t('signalsScan.resultSummary', {
              scanned: result.scanned,
              newTriggers: result.newTriggers,
              skipped: result.skipped,
            })}
          </p>

          {result.previews.length > 0 ? (
            <ul className="divide-y divide-border/60 rounded-sm border border-border">
              {result.previews.map((row) => (
                <li key={row.triggerId} className="px-3 py-2.5">
                  <Link
                    href={`/prospects/${row.prospectId}`}
                    className="text-sm font-medium underline-offset-4 hover:underline"
                  >
                    {row.accountName}
                  </Link>
                  <p className="mt-0.5 text-xs text-muted">{row.text}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">{t('signalsScan.noNewSignals')}</p>
          )}

          {result.errors.length > 0 ? (
            <ul className="text-xs text-muted">
              {result.errors.map((e) => (
                <li key={`${e.prospectId}-${e.message}`}>
                  {e.accountName}: {e.message}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      )}
    </Modal>
  )
}
