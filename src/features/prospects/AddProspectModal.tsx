'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import { Button, Input, Label, TextArea } from '@/components/atoms'
import { Modal } from '@/components/molecules/Modal'
import {
  PROSPECT_SOURCES,
  TERRITORIES,
  type ProspectSource,
  type Territory,
} from '@/lib/db/schema/enums'

const formSchema = z.object({
  accountName: z.string().min(2, 'min2').max(200),
  website: z
    .string()
    .max(500)
    .optional()
    .refine(
      (v) => !v || /^https?:\/\//i.test(v),
      'mustBeUrl',
    ),
  territory: z.enum(TERRITORIES),
  source: z.enum(PROSPECT_SOURCES),
  triggerText: z.string().min(3, 'min3').max(2000),
})

type FormValues = z.infer<typeof formSchema>

interface AddProspectModalProps {
  open: boolean
  onClose: () => void
  onCreated: (prospect: { id: string }) => void
}

interface PrecheckPayload {
  duplicate?: boolean
  account?: { id: string; name: string; website: string | null } | null
}

export function AddProspectModal({ open, onClose, onCreated }: AddProspectModalProps) {
  const { t } = useTranslation()
  const [submitting, setSubmitting] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [precheck, setPrecheck] = useState<PrecheckPayload | null>(null)
  const [confirmDup, setConfirmDup] = useState(false)
  const [blocked409, setBlocked409] = useState(false)
  const [conflictAccount, setConflictAccount] = useState<PrecheckPayload['account']>(null)
  const [coaccessNote, setCoaccessNote] = useState('')
  const [coaccessBusy, setCoaccessBusy] = useState(false)
  const [coaccessDone, setCoaccessDone] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      accountName: '',
      website: '',
      territory: 'DE' as Territory,
      source: 'manual' as ProspectSource,
      triggerText: '',
    },
  })

  const accountNameW = watch('accountName')
  const websiteW = watch('website')

  useEffect(() => {
    setConfirmDup(false)
    setBlocked409(false)
    setServerError(null)
    setConflictAccount(null)
    setCoaccessDone(false)
    setCoaccessNote('')
  }, [accountNameW, websiteW])

  useEffect(() => {
    const id = window.setTimeout(() => {
      const q = new URLSearchParams()
      const n = accountNameW?.trim() ?? ''
      const w = websiteW?.trim() ?? ''
      if (n.length >= 2) q.set('accountName', n)
      if (w.length > 0) q.set('website', w)
      if (q.toString().length === 0) {
        setPrecheck(null)
        return
      }
      void fetch(`/api/prospects/intake-precheck?${q.toString()}`, { credentials: 'include' })
        .then((res) => (res.ok ? res.json() : null))
        .then((data: PrecheckPayload | null) => {
          setPrecheck(data && typeof data.duplicate === 'boolean' ? data : null)
        })
        .catch(() => setPrecheck(null))
    }, 450)
    return () => window.clearTimeout(id)
  }, [accountNameW, websiteW])

  const showDupBanner = Boolean(precheck?.duplicate && precheck.account)
  const dupGate = (showDupBanner || blocked409) && !confirmDup
  const dupAccount = conflictAccount ?? precheck?.account ?? null

  async function submitCoaccess() {
    if (!dupAccount?.id) return
    setCoaccessBusy(true)
    try {
      const res = await fetch('/api/account-coaccess-requests', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountId: dupAccount.id,
          note: coaccessNote.trim() || undefined,
        }),
      })
      if (res.ok) {
        setCoaccessDone(true)
      }
    } finally {
      setCoaccessBusy(false)
    }
  }

  const onSubmit = handleSubmit(async (values) => {
    setSubmitting(true)
    setServerError(null)
    try {
      const res = await fetch('/api/prospects', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountName: values.accountName,
          website: values.website || undefined,
          territory: values.territory,
          source: values.source,
          triggerText: values.triggerText,
          ...(confirmDup ? { acknowledgeDuplicate: true } : {}),
        }),
      })
      const data = (await res.json()) as {
        prospect?: { id: string; accountId?: string }
        error?: string
        account?: PrecheckPayload['account']
      }
      if (res.status === 409) {
        setBlocked409(true)
        if (data.account) setConflictAccount(data.account)
        setServerError('duplicate_account')
        return
      }
      if (!res.ok || !data.prospect) {
        setServerError(data.error ?? 'create_failed')
        return
      }
      onCreated(data.prospect)
      reset()
      setPrecheck(null)
      setConfirmDup(false)
      setBlocked409(false)
      setConflictAccount(null)
      setCoaccessDone(false)
      setCoaccessNote('')
      onClose()
    } catch {
      setServerError('network_error')
    } finally {
      setSubmitting(false)
    }
  })

  return (
    <Modal
      open={open}
      onClose={() => {
        reset()
        setPrecheck(null)
        setConfirmDup(false)
        setBlocked409(false)
        setConflictAccount(null)
        setCoaccessDone(false)
        setCoaccessNote('')
        onClose()
      }}
      title={t('prospects.addProspect')}
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <Label htmlFor="accountName">{t('prospects.form.accountName')}</Label>
          <Input
            id="accountName"
            {...register('accountName')}
            error={errors.accountName ? t('prospects.form.errors.required') : undefined}
            autoFocus
          />
        </div>

        <div>
          <Label htmlFor="website">{t('prospects.form.website')}</Label>
          <Input
            id="website"
            type="url"
            placeholder="https://example.com"
            {...register('website')}
            error={
              errors.website?.message === 'mustBeUrl'
                ? t('prospects.form.errors.url')
                : undefined
            }
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="territory">{t('prospects.cols.territory')}</Label>
            <select
              id="territory"
              {...register('territory')}
              className="h-10 w-full rounded-sm border border-input bg-transparent px-3 text-sm outline-none focus:outline-none"
            >
              {TERRITORIES.map((territory) => (
                <option key={territory} value={territory}>
                  {territory}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="source">{t('prospects.cols.source')}</Label>
            <select
              id="source"
              {...register('source')}
              className="h-10 w-full rounded-sm border border-input bg-transparent px-3 text-sm outline-none focus:outline-none"
            >
              {PROSPECT_SOURCES.map((source) => (
                <option key={source} value={source}>
                  {t(`prospects.sources.${source}`, { defaultValue: source })}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <Label htmlFor="triggerText">{t('prospects.form.triggerText')}</Label>
          <TextArea
            id="triggerText"
            rows={3}
            placeholder={t('prospects.form.triggerPlaceholder')}
            {...register('triggerText')}
          />
          {errors.triggerText && (
            <p className="mt-1 text-xs text-destructive">{t('prospects.form.errors.required')}</p>
          )}
        </div>

        {(showDupBanner || blocked409) && (
          <div className="space-y-2 rounded-sm border border-border bg-primary/[0.03] px-3 py-2.5 text-xs">
            <p className="text-muted">
              {blocked409 ? t('prospects.form.duplicateBlocked') : t('prospects.form.duplicateWarning')}
            </p>
            {precheck?.account && (
              <p className="font-medium text-foreground">
                {precheck.account.name}
                {precheck.account.website ? ` · ${precheck.account.website}` : ''}
              </p>
            )}
            <label className="flex cursor-pointer items-start gap-2">
              <input
                type="checkbox"
                className="mt-0.5"
                checked={confirmDup}
                onChange={(e) => setConfirmDup(e.target.checked)}
              />
              <span>{t('prospects.form.duplicateConfirm')}</span>
            </label>
            {dupAccount?.id ? (
              <div className="mt-3 space-y-2 border-t border-border pt-3">
                <p className="text-muted">{t('prospects.form.coaccessIntro')}</p>
                <TextArea
                  rows={2}
                  value={coaccessNote}
                  onChange={(e) => setCoaccessNote(e.target.value)}
                  placeholder={t('prospects.form.coaccessNotePlaceholder')}
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  loading={coaccessBusy}
                  disabled={coaccessBusy || coaccessDone}
                  onClick={() => void submitCoaccess()}
                >
                  {coaccessDone ? t('prospects.form.coaccessSent') : t('prospects.form.coaccessSubmit')}
                </Button>
              </div>
            ) : null}
          </div>
        )}

        {serverError && (
          <p className="text-xs text-destructive">
            {t(`prospects.form.errors.${serverError}`, { defaultValue: serverError })}
          </p>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              reset()
              setPrecheck(null)
              setConfirmDup(false)
              setBlocked409(false)
              onClose()
            }}
            disabled={submitting}
          >
            {t('common.cancel')}
          </Button>
          <Button type="submit" loading={submitting} disabled={submitting || dupGate}>
            {t('prospects.addProspect')}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
