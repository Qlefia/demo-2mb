'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/cn'
import { formatDateTime } from '@/lib/intl/datetime'
import { studioRadiusBlock, studioTintPanel } from '@/features/studio-settings/studioBlockChrome'
import { Badge, Button, Input, Label } from '@/components/atoms'
import { toast } from '@/components/molecules/Toast'
import {
  useAcceptOfferMutation,
  useCreateClientProjectMutation,
  useProspectProjectsQuery,
} from '@/features/client-projects/api/useProspectProjectsQuery'
import type { ClientProjectDTO } from '@/lib/client-projects/schema'

function formatMoney(amount: string | null, currency: string, locale: string) {
  if (amount == null) return '—'
  const n = Number.parseFloat(amount)
  if (!Number.isFinite(n)) return amount
  try {
    return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(n)
  } catch {
    return `${amount} ${currency}`
  }
}

function ProjectRow({
  project,
  prospectId,
  expanded,
  onToggle,
}: {
  project: ClientProjectDTO
  prospectId: string
  expanded: boolean
  onToggle: () => void
}) {
  const { t, i18n } = useTranslation()
  const acceptMutation = useAcceptOfferMutation(prospectId, project.id)

  async function handleAccept(offerId: string) {
    try {
      await acceptMutation.mutateAsync(offerId)
      toast(t('clientProjects.acceptSuccess'))
    } catch (e) {
      const code = e instanceof Error ? e.message : 'accept_failed'
      if (code === 'offer_not_published') {
        toast(t('clientProjects.acceptNotPublished'), 'error')
      } else {
        toast(t('clientProjects.acceptFailed'), 'error')
      }
    }
  }

  const canAccept =
    project.status !== 'in_delivery' &&
    project.status !== 'completed' &&
    project.status !== 'offer_declined' &&
    project.status !== 'cancelled'

  return (
    <li className={cn(studioRadiusBlock, studioTintPanel, 'overflow-hidden')}>
      <button
        type="button"
        className="flex w-full items-start gap-2 px-3 py-2.5 text-left transition-colors hover:bg-foreground/[0.03] dark:hover:bg-white/[0.04]"
        onClick={onToggle}
        aria-expanded={expanded}
      >
        {expanded ? (
          <ChevronDown size={16} className="mt-0.5 shrink-0 text-muted" aria-hidden />
        ) : (
          <ChevronRight size={16} className="mt-0.5 shrink-0 text-muted" aria-hidden />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="truncate text-sm font-medium">{project.title}</span>
            <Badge size="sm" variant={project.status === 'in_delivery' ? 'success' : 'default'}>
              {t(`clientProjects.status.${project.status}`)}
            </Badge>
          </div>
          <p className="mt-0.5 text-xs text-muted">
            {formatMoney(project.estimatedValue, project.currency, i18n.language)}
            {' · '}
            {formatDateTime(project.updatedAt, i18n.language)}
          </p>
        </div>
      </button>

      {expanded ? (
        <div className="space-y-3 border-t border-border px-3 py-3">
          {project.description ? (
            <p className="text-sm text-muted">{project.description}</p>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <Link
              href={`/prospects/${prospectId}/offer?projectId=${encodeURIComponent(project.id)}`}
              className="inline-flex h-8 items-center justify-center rounded-sm bg-primary px-3 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              {t('clientProjects.createOffer')}
            </Link>
          </div>

          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
              {t('clientProjects.offersHeading')}
            </h3>
            {project.offers.length === 0 ? (
              <p className="text-sm text-muted">{t('clientProjects.offersEmpty')}</p>
            ) : (
              <ul className="space-y-2">
                {project.offers.map((offer) => (
                  <li
                    key={offer.id}
                    className="flex flex-wrap items-center gap-2 rounded-sm bg-foreground/4 px-2.5 py-2 dark:bg-white/5"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{offer.title}</p>
                      <div className="flex items-center gap-2">
                        <Badge
                          size="sm"
                          variant={offer.status === 'published' ? 'success' : 'default'}
                        >
                          {t(`proposals.status.${offer.status}`)}
                        </Badge>
                        <span className="text-xs text-muted">
                          {formatDateTime(offer.updatedAt, i18n.language)}
                        </span>
                      </div>
                    </div>
                    <Link
                      href={`/prospects/${prospectId}/offer?proposalId=${encodeURIComponent(offer.id)}&projectId=${encodeURIComponent(project.id)}`}
                      className="inline-flex h-8 items-center justify-center rounded-sm border border-border px-2.5 text-xs font-medium transition-colors hover:bg-hover"
                    >
                      {t('common.view')}
                    </Link>
                    {canAccept && offer.status === 'published' && project.acceptedOfferId !== offer.id ? (
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={acceptMutation.isPending}
                        onClick={() => void handleAccept(offer.id)}
                      >
                        {t('clientProjects.acceptOffer')}
                      </Button>
                    ) : null}
                    {project.acceptedOfferId === offer.id ? (
                      <Badge size="sm" variant="success">
                        {t('clientProjects.acceptedBadge')}
                      </Badge>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : null}
    </li>
  )
}

export function ProjectsPanel({ prospectId }: { prospectId: string }) {
  const { t } = useTranslation()
  const { data: projects = [], isLoading } = useProspectProjectsQuery(prospectId)
  const createMutation = useCreateClientProjectMutation(prospectId)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [value, setValue] = useState('')

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    const raw = value.trim().replace(',', '.')
    const num = raw === '' ? null : Number.parseFloat(raw)
    try {
      const created = await createMutation.mutateAsync({
        title: title.trim(),
        estimatedValue: num != null && Number.isFinite(num) ? num : null,
      })
      setTitle('')
      setValue('')
      setExpandedId(created.id)
      toast(t('clientProjects.created'))
    } catch {
      toast(t('clientProjects.createFailed'), 'error')
    }
  }

  if (isLoading) {
    return <p className="text-sm text-muted">{t('common.loading')}</p>
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-sm font-semibold">{t('clientProjects.title')}</h2>
        <p className="mt-1 text-sm text-muted">{t('clientProjects.intro')}</p>
      </div>

      <form
        onSubmit={(e) => void handleCreate(e)}
        className={cn(studioRadiusBlock, studioTintPanel, 'space-y-3 p-3')}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="project-title">{t('clientProjects.fieldTitle')}</Label>
            <Input
              id="project-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('clientProjects.fieldTitlePlaceholder')}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="project-value">{t('clientProjects.fieldValue')}</Label>
            <Input
              id="project-value"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              inputMode="decimal"
              placeholder="0"
            />
          </div>
        </div>
        <Button type="submit" size="sm" disabled={createMutation.isPending || !title.trim()}>
          {t('clientProjects.addProject')}
        </Button>
      </form>

      {projects.length === 0 ? (
        <p className="text-sm text-muted">{t('clientProjects.empty')}</p>
      ) : (
        <ul className="space-y-2">
          {projects.map((project) => (
            <ProjectRow
              key={project.id}
              project={project}
              prospectId={prospectId}
              expanded={expandedId === project.id}
              onToggle={() =>
                setExpandedId((current) => (current === project.id ? null : project.id))
              }
            />
          ))}
        </ul>
      )}
    </div>
  )
}
