'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react'
import { Check, MoreHorizontal, RefreshCw, X } from 'lucide-react'
import { Avatar, Badge, Button, Input, Label } from '@/components/atoms'
import { ConfirmDialog, Select } from '@/components/molecules'
import { toast } from '@/components/molecules/Toast'
import { useUserStore } from '@/stores/userStore'
import type { CrmRole, Territory } from '@/lib/auth/roles'
import type { Seat, SeatStatus } from '@/lib/team/types'
import { formatDate as formatLocaleDate } from '@/lib/intl/datetime'

const INVITABLE_ROLES = ['ops', 'sales_de', 'sales_uk', 'admin'] as const
type InvitableRole = (typeof INVITABLE_ROLES)[number]

const ROLE_BADGE_VARIANT: Record<CrmRole, 'success' | 'info' | 'default'> = {
  founder: 'success',
  ops: 'info',
  sales_de: 'default',
  sales_uk: 'default',
  admin: 'info',
}

const STATUS_BADGE_VARIANT: Record<SeatStatus, 'success' | 'warning' | 'default'> = {
  active: 'success',
  invited: 'warning',
  deactivated: 'default',
}

const ROLE_DISPLAY_ORDER: readonly CrmRole[] = ['founder', 'ops', 'sales_de', 'sales_uk', 'admin']

function getInitials(name: string): string {
  const trimmed = name.trim()
  if (!trimmed) return '?'
  return trimmed
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function formatDate(iso: string | null, lng: string | null | undefined): string {
  return formatLocaleDate(iso, lng)
}

interface SeatsResponse {
  seats: Seat[]
}

export function TeamSettings() {
  const { t } = useTranslation()
  const currentUserId = useUserStore((s) => s.user.id)

  const [seats, setSeats] = useState<Seat[] | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteDisplayName, setInviteDisplayName] = useState('')
  const [inviteRole, setInviteRole] = useState<InvitableRole>('ops')
  const [inviteTerritory, setInviteTerritory] = useState<Territory | ''>('')
  const [removeTarget, setRemoveTarget] = useState<Seat | null>(null)
  const [deactivateTarget, setDeactivateTarget] = useState<Seat | null>(null)
  const [reactivateTarget, setReactivateTarget] = useState<Seat | null>(null)
  const [pendingSeatId, setPendingSeatId] = useState<string | null>(null)

  const loadSeats = useCallback(async () => {
    setIsLoading(true)
    setLoadError(null)
    try {
      const res = await fetch('/api/team/seats', { credentials: 'include' })
      if (!res.ok) {
        setLoadError(t('team.loadFailed'))
        setSeats(null)
        return
      }
      const data = (await res.json()) as SeatsResponse
      setSeats(data.seats)
    } catch {
      setLoadError(t('team.loadFailed'))
      setSeats(null)
    } finally {
      setIsLoading(false)
    }
  }, [t])

  useEffect(() => {
    void loadSeats()
  }, [loadSeats])

  const activeSeats = useMemo(
    () => (seats ?? []).filter((s) => s.status !== 'invited'),
    [seats],
  )
  const pendingSeats = useMemo(
    () => (seats ?? []).filter((s) => s.status === 'invited'),
    [seats],
  )

  const [inviting, setInviting] = useState(false)

  const requiresTerritory = inviteRole === 'sales_de' || inviteRole === 'sales_uk'
  const inviteDisabled =
    inviting ||
    !inviteEmail.trim() ||
    !inviteDisplayName.trim() ||
    (requiresTerritory && !inviteTerritory)

  const roleOptions = INVITABLE_ROLES.map((r) => ({ value: r, label: t(`team.${r}`) }))
  const territoryOptions: { value: string; label: string }[] = [
    { value: '', label: t('team.territoryNone') },
    { value: 'DE', label: t('team.territoryDe') },
    { value: 'UK', label: t('team.territoryUk') },
  ]

  const handleInvite = async () => {
    setInviting(true)
    try {
      const body: Record<string, unknown> = {
        email: inviteEmail.trim(),
        displayName: inviteDisplayName.trim(),
        role: inviteRole,
      }
      if (inviteTerritory) body.territory = inviteTerritory

      const res = await fetch('/api/team/seats', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const payload = (await res.json().catch(() => ({}))) as { error?: string; message?: string }
        toast(payload.message ?? payload.error ?? t('team.loadFailed'), 'error')
        return
      }

      toast(t('team.inviteSent'), 'success')
      setInviteEmail('')
      setInviteDisplayName('')
      setInviteTerritory(inviteRole === 'sales_de' ? 'DE' : inviteRole === 'sales_uk' ? 'UK' : '')
      await loadSeats()
    } finally {
      setInviting(false)
    }
  }

  const handleResend = async (seat: Seat) => {
    const res = await fetch(`/api/team/seats/${seat.id}/resend-invite`, {
      method: 'POST',
      credentials: 'include',
    })
    if (!res.ok) {
      const payload = (await res.json().catch(() => ({}))) as { error?: string; message?: string }
      toast(payload.message ?? payload.error ?? t('team.loadFailed'), 'error')
      return
    }
    toast(t('team.inviteResent'), 'success')
    await loadSeats()
  }

  const handleRemove = async () => {
    if (!removeTarget) return
    const target = removeTarget
    setRemoveTarget(null)
    setPendingSeatId(target.id)
    try {
      const res = await fetch(`/api/team/seats/${target.id}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (!res.ok) {
        const payload = (await res.json().catch(() => ({}))) as { error?: string; message?: string }
        toast(payload.message ?? payload.error ?? t('team.loadFailed'), 'error')
        return
      }
      toast(t('team.inviteCancelled'), 'success')
      await loadSeats()
    } finally {
      setPendingSeatId(null)
    }
  }

  const patchSeat = async (
    seat: Seat,
    body: Record<string, unknown>,
    successKey: string,
  ): Promise<boolean> => {
    setPendingSeatId(seat.id)
    try {
      const res = await fetch(`/api/team/seats/${seat.id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const payload = (await res.json().catch(() => ({}))) as { error?: string; message?: string }
        const errKey = payload.error
        const friendly =
          errKey === 'last_founder'
            ? t('team.cannotDeactivateLastFounder')
            : errKey === 'cannot_change_own_role'
              ? t('team.cannotChangeOwnRole')
              : (payload.message ?? payload.error ?? t('team.loadFailed'))
        toast(friendly, 'error')
        return false
      }
      toast(t(successKey), 'success')
      await loadSeats()
      return true
    } finally {
      setPendingSeatId(null)
    }
  }

  const handleChangeRole = async (seat: Seat, role: CrmRole) => {
    if (role === seat.role) return
    const body: Record<string, unknown> = { role }
    if (role === 'sales_de') body.territory = 'DE'
    else if (role === 'sales_uk') body.territory = 'UK'
    else if (role === 'founder' || role === 'ops' || role === 'admin') body.territory = null
    await patchSeat(seat, body, 'team.roleChanged')
  }

  const handleChangeTerritory = async (seat: Seat, territory: Territory | null) => {
    if (seat.role === 'sales_de' && territory !== 'DE') {
      toast(t('team.loadFailed'), 'error')
      return
    }
    if (seat.role === 'sales_uk' && territory !== 'UK') {
      toast(t('team.loadFailed'), 'error')
      return
    }
    await patchSeat(seat, { territory }, 'team.territoryChanged')
  }

  const handleDeactivate = async () => {
    if (!deactivateTarget) return
    const target = deactivateTarget
    setDeactivateTarget(null)
    await patchSeat(target, { active: false }, 'team.memberDeactivated')
  }

  const handleReactivate = async () => {
    if (!reactivateTarget) return
    const target = reactivateTarget
    setReactivateTarget(null)
    await patchSeat(target, { active: true }, 'team.memberReactivated')
  }

  return (
    <div className="space-y-10">
      <header>
        <h2 className="text-lg font-semibold">{t('team.pageHeading')}</h2>
        <p className="mt-1 max-w-2xl text-sm text-muted">{t('team.pageSubtitle')}</p>
      </header>

      {pendingSeats.length > 0 && (
        <PendingInvitations
          seats={pendingSeats}
          onCancel={(seat) => setRemoveTarget(seat)}
          onResend={(seat) => void handleResend(seat)}
        />
      )}

      <InviteSection
        email={inviteEmail}
        displayName={inviteDisplayName}
        role={inviteRole}
        territory={inviteTerritory}
        roleOptions={roleOptions}
        territoryOptions={territoryOptions}
        onEmailChange={setInviteEmail}
        onDisplayNameChange={setInviteDisplayName}
        onRoleChange={(v) => {
          setInviteRole(v as InvitableRole)
          if (v === 'sales_de') setInviteTerritory('DE')
          else if (v === 'sales_uk') setInviteTerritory('UK')
          else setInviteTerritory('')
        }}
        onTerritoryChange={(v) => setInviteTerritory((v as Territory) || '')}
        onInvite={() => void handleInvite()}
        disabled={inviteDisabled}
      />

      <MembersTable
        seats={activeSeats}
        isLoading={isLoading}
        loadError={loadError}
        currentUserId={currentUserId}
        pendingSeatId={pendingSeatId}
        onRetry={() => void loadSeats()}
        onChangeRole={(seat, role) => void handleChangeRole(seat, role)}
        onChangeTerritory={(seat, territory) => void handleChangeTerritory(seat, territory)}
        onDeactivate={(seat) => setDeactivateTarget(seat)}
        onReactivate={(seat) => setReactivateTarget(seat)}
      />

      <RolePermissions />

      <ConfirmDialog
        open={!!removeTarget}
        onClose={() => setRemoveTarget(null)}
        onConfirm={() => void handleRemove()}
        title={t('team.confirmRemoveTitle')}
        message={t('team.confirmRemoveMessage', { name: removeTarget?.displayName ?? '' })}
        confirmLabel={t('team.removeMember')}
        variant="destructive"
      />
      <ConfirmDialog
        open={!!deactivateTarget}
        onClose={() => setDeactivateTarget(null)}
        onConfirm={() => void handleDeactivate()}
        title={t('team.confirmDeactivateTitle')}
        message={t('team.confirmDeactivateMessage', { name: deactivateTarget?.displayName ?? '' })}
        confirmLabel={t('team.deactivate')}
        variant="destructive"
      />
      <ConfirmDialog
        open={!!reactivateTarget}
        onClose={() => setReactivateTarget(null)}
        onConfirm={() => void handleReactivate()}
        title={t('team.confirmReactivateTitle')}
        message={t('team.confirmReactivateMessage', { name: reactivateTarget?.displayName ?? '' })}
        confirmLabel={t('team.reactivate')}
      />
    </div>
  )
}

interface InviteSectionProps {
  email: string
  displayName: string
  role: InvitableRole
  territory: Territory | ''
  roleOptions: { value: string; label: string }[]
  territoryOptions: { value: string; label: string }[]
  onEmailChange: (value: string) => void
  onDisplayNameChange: (value: string) => void
  onRoleChange: (value: string) => void
  onTerritoryChange: (value: string) => void
  onInvite: () => void
  disabled: boolean
}

function InviteSection({
  email,
  displayName,
  role,
  territory,
  roleOptions,
  territoryOptions,
  onEmailChange,
  onDisplayNameChange,
  onRoleChange,
  onTerritoryChange,
  onInvite,
  disabled,
}: InviteSectionProps) {
  const { t } = useTranslation()
  const territoryLocked = role === 'sales_de' || role === 'sales_uk'

  return (
    <section className="rounded-sm border border-border">
      <div className="border-b border-border px-4 py-4 sm:px-5">
        <h3 className="text-base font-semibold">{t('team.inviteMember')}</h3>
        <p className="mt-1 max-w-prose text-sm text-pretty text-muted">{t('team.inviteHint')}</p>
      </div>
      <div className="grid grid-cols-1 gap-4 p-4 sm:p-5 lg:grid-cols-[1fr_1fr_180px_180px_auto] lg:items-end">
        <div className="min-w-0">
          <Label htmlFor="team-invite-name" className="mb-1.5 block">
            {t('team.displayNameLabel')}
          </Label>
          <Input
            id="team-invite-name"
            type="text"
            placeholder={t('team.displayNamePlaceholder')}
            value={displayName}
            onChange={(e) => onDisplayNameChange(e.target.value)}
          />
        </div>
        <div className="min-w-0">
          <Label htmlFor="team-invite-email" className="mb-1.5 block">
            {t('team.email')}
          </Label>
          <Input
            id="team-invite-email"
            type="email"
            autoComplete="email"
            placeholder={t('team.emailPlaceholder')}
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
          />
        </div>
        <div>
          <Label className="mb-1.5 block">{t('team.role')}</Label>
          <Select value={role} onChange={onRoleChange} options={roleOptions} />
        </div>
        <div>
          <Label className="mb-1.5 block">{t('team.territory')}</Label>
          <Select
            value={territory}
            onChange={onTerritoryChange}
            options={territoryOptions}
            disabled={territoryLocked}
          />
        </div>
        <div>
          <Button type="button" className="w-full lg:w-auto" onClick={onInvite} disabled={disabled}>
            {t('team.sendInvite')}
          </Button>
        </div>
      </div>
    </section>
  )
}

interface MembersTableProps {
  seats: Seat[]
  isLoading: boolean
  loadError: string | null
  currentUserId: string
  pendingSeatId: string | null
  onRetry: () => void
  onChangeRole: (seat: Seat, role: CrmRole) => void
  onChangeTerritory: (seat: Seat, territory: Territory | null) => void
  onDeactivate: (seat: Seat) => void
  onReactivate: (seat: Seat) => void
}

function MembersTable({
  seats,
  isLoading,
  loadError,
  currentUserId,
  pendingSeatId,
  onRetry,
  onChangeRole,
  onChangeTerritory,
  onDeactivate,
  onReactivate,
}: MembersTableProps) {
  const { t, i18n } = useTranslation()

  return (
    <section>
      <h3 className="text-base font-semibold">{t('team.membersWithCount', { count: seats.length })}</h3>
      <div className="mt-4 w-full overflow-auto rounded-sm border border-border">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b border-border bg-primary/5">
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted">
                {t('team.name')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted">
                {t('team.email')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted">
                {t('team.role')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted">
                {t('team.territory')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted">
                {t('team.status')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted">
                {t('team.lastActive')}
              </th>
              <th className="w-12 px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-sm text-muted">
                  {t('team.loading')}
                </td>
              </tr>
            )}
            {!isLoading && loadError && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-sm text-muted">
                  <div className="flex flex-col items-center gap-3">
                    <span>{loadError}</span>
                    <Button type="button" variant="secondary" size="sm" onClick={onRetry}>
                      {t('team.retry')}
                    </Button>
                  </div>
                </td>
              </tr>
            )}
            {!isLoading && !loadError && seats.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-sm text-muted">
                  {t('team.noMembers')}
                </td>
              </tr>
            )}
            {!isLoading &&
              !loadError &&
              seats.map((seat) => (
                <tr key={seat.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar initials={getInitials(seat.displayName)} size="sm" />
                      <span className="font-medium">
                        {seat.displayName}
                        {seat.id === currentUserId && (
                          <span className="ml-2 text-xs font-normal text-muted">({t('team.you')})</span>
                        )}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted">{seat.email}</td>
                  <td className="px-4 py-3">
                    {seat.role && (
                      <Badge variant={ROLE_BADGE_VARIANT[seat.role]}>{t(`team.${seat.role}`)}</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {seat.territory === 'DE'
                      ? t('team.territoryDe')
                      : seat.territory === 'UK'
                        ? t('team.territoryUk')
                        : t('team.territoryNone')}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={STATUS_BADGE_VARIANT[seat.status]}>{t(`team.${seat.status}`)}</Badge>
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {seat.lastSignInAt ? formatDate(seat.lastSignInAt, i18n.language) : t('team.never')}
                  </td>
                  <td className="px-4 py-3">
                    {seat.role !== 'founder' && seat.id !== currentUserId && (
                      <SeatActions
                        seat={seat}
                        pending={pendingSeatId === seat.id}
                        onChangeRole={(role) => onChangeRole(seat, role)}
                        onChangeTerritory={(territory) => onChangeTerritory(seat, territory)}
                        onDeactivate={() => onDeactivate(seat)}
                        onReactivate={() => onReactivate(seat)}
                      />
                    )}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

interface PendingInvitationsProps {
  seats: Seat[]
  onCancel: (seat: Seat) => void
  onResend: (seat: Seat) => void
}

function PendingInvitations({ seats, onCancel, onResend }: PendingInvitationsProps) {
  const { t, i18n } = useTranslation()

  return (
    <section className="rounded-sm border border-border">
      <div className="border-b border-border px-4 py-4 sm:px-5">
        <h3 className="text-base font-semibold">
          {t('team.pendingInvitations')}
          <span className="ml-2 font-normal text-muted">({seats.length})</span>
        </h3>
      </div>
      <ul className="divide-y divide-border">
        {seats.map((seat) => (
          <li
            key={seat.id}
            className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5"
          >
            <div className="min-w-0 space-y-1">
              <p className="text-sm font-medium">{seat.email}</p>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                {seat.role && (
                  <Badge variant={ROLE_BADGE_VARIANT[seat.role]} size="sm">
                    {t(`team.${seat.role}`)}
                  </Badge>
                )}
                {seat.territory && (
                  <Badge variant="default" size="sm">
                    {seat.territory === 'DE' ? t('team.territoryDe') : t('team.territoryUk')}
                  </Badge>
                )}
                {seat.invitedAt && (
                  <span>
                    {t('team.invitedAt')} {formatDate(seat.invitedAt, i18n.language)}
                  </span>
                )}
              </div>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              <Button type="button" variant="secondary" size="sm" className="gap-1.5" onClick={() => onResend(seat)}>
                <RefreshCw size={14} aria-hidden />
                {t('team.resendInvite')}
              </Button>
              <Button type="button" variant="secondary" size="sm" className="gap-1.5" onClick={() => onCancel(seat)}>
                <X size={14} aria-hidden />
                {t('team.cancelInvite')}
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}

function RolePermissions() {
  const { t } = useTranslation()

  return (
    <section className="rounded-sm border border-border">
      <div className="border-b border-border px-4 py-4 sm:px-5">
        <h3 className="text-base font-semibold">{t('team.rolePermissions')}</h3>
      </div>
      <ul className="divide-y divide-border">
        {ROLE_DISPLAY_ORDER.map((role) => (
          <li key={role} className="flex flex-col gap-2 px-4 py-4 sm:flex-row sm:items-start sm:gap-6 sm:px-5">
            <div className="shrink-0 sm:w-32">
              <Badge variant={ROLE_BADGE_VARIANT[role]}>{t(`team.${role}`)}</Badge>
            </div>
            <p className="min-w-0 max-w-prose text-sm leading-relaxed text-muted">{t(`team.${role}Desc`)}</p>
          </li>
        ))}
      </ul>
    </section>
  )
}

interface SeatActionsProps {
  seat: Seat
  pending: boolean
  onChangeRole: (role: CrmRole) => void
  onChangeTerritory: (territory: Territory | null) => void
  onDeactivate: () => void
  onReactivate: () => void
}

const TERRITORY_CHOICES: { value: Territory | null; labelKey: string }[] = [
  { value: 'DE', labelKey: 'team.territoryDe' },
  { value: 'UK', labelKey: 'team.territoryUk' },
  { value: null, labelKey: 'team.territoryNone' },
]

function SeatActions({
  seat,
  pending,
  onChangeRole,
  onChangeTerritory,
  onDeactivate,
  onReactivate,
}: SeatActionsProps) {
  const { t } = useTranslation()
  const isDeactivated = seat.status === 'deactivated'
  // sales_de/sales_uk derive their territory from the role, so the explicit
  // territory selector is only meaningful for founder/ops/admin.
  const territoryEditable =
    seat.role === 'founder' || seat.role === 'ops' || seat.role === 'admin'

  return (
    <Menu as="div" className="relative">
      <MenuButton
        type="button"
        disabled={pending}
        className="rounded-sm p-1.5 text-muted transition-colors hover:bg-primary/5 hover:text-foreground disabled:opacity-50"
        aria-label={t('team.changeRole')}
      >
        <MoreHorizontal size={18} />
      </MenuButton>
      <MenuItems
        anchor="bottom end"
        className="z-50 w-60 rounded-sm border border-border bg-background py-1 focus:outline-none [--anchor-gap:4px]"
      >
        <div className="px-3 py-1.5 text-xs font-medium text-muted">{t('team.changeRole')}</div>
        {INVITABLE_ROLES.map((role) => (
          <MenuItem key={role}>
            <button
              type="button"
              className="flex w-full items-center justify-between px-3 py-2 text-left text-sm data-focus:bg-primary/5"
              onClick={() => onChangeRole(role)}
            >
              {t(`team.${role}`)}
              {seat.role === role && <Check size={14} className="shrink-0" aria-hidden />}
            </button>
          </MenuItem>
        ))}
        {territoryEditable && (
          <>
            <div className="my-1 border-t border-border" />
            <div className="px-3 py-1.5 text-xs font-medium text-muted">
              {t('team.changeTerritory')}
            </div>
            {TERRITORY_CHOICES.map((choice) => (
              <MenuItem key={choice.value ?? 'none'}>
                <button
                  type="button"
                  className="flex w-full items-center justify-between px-3 py-2 text-left text-sm data-focus:bg-primary/5"
                  onClick={() => onChangeTerritory(choice.value)}
                >
                  {t(choice.labelKey)}
                  {seat.territory === choice.value && (
                    <Check size={14} className="shrink-0" aria-hidden />
                  )}
                </button>
              </MenuItem>
            ))}
          </>
        )}
        <div className="my-1 border-t border-border" />
        <MenuItem>
          {isDeactivated ? (
            <button
              type="button"
              className="flex w-full px-3 py-2 text-left text-sm text-foreground data-focus:bg-primary/5"
              onClick={onReactivate}
            >
              {t('team.reactivate')}
            </button>
          ) : (
            <button
              type="button"
              className="flex w-full px-3 py-2 text-left text-sm text-destructive data-focus:bg-destructive/5"
              onClick={onDeactivate}
            >
              {t('team.deactivate')}
            </button>
          )}
        </MenuItem>
      </MenuItems>
    </Menu>
  )
}
