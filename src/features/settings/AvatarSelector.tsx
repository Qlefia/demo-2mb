'use client'

import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Camera } from 'lucide-react'
import { cn } from '@/lib/cn'
import { pickPastelHoverTint, pickRandomPastelHoverTint } from '@/lib/ui/pastelHoverTint'
import { Avatar, Spinner } from '@/components/atoms'
import { TabBar } from '@/components/molecules/Tabs'
import {
  AVATAR_EMOJIS,
  AVATAR_ICON_IDS,
  AVATAR_BACKGROUNDS,
  resolveAvatarBackground,
  isAvatarBackgroundDark,
  type AvatarType,
  type AvatarIconId,
} from '@/constants/avatar'
import { AVATAR_ICON_MAP } from '@/constants/avatar-icons'
import type { UserProfile } from '@/stores/userStore'

interface AvatarSelectorProps {
  user: UserProfile
  onUpdate: (patch: Partial<Pick<UserProfile, 'avatarUrl' | 'avatarType' | 'avatarEmoji' | 'avatarIcon' | 'avatarBg'>>) => void | Promise<void>
  uploading: boolean
  saving?: boolean
  onPickPhoto: () => void
}

const AVATAR_TYPES: { value: AvatarType; labelKey: string }[] = [
  { value: 'photo', labelKey: 'settingsPage.avatarTypePhoto' },
  { value: 'emoji', labelKey: 'settingsPage.avatarTypeEmoji' },
  { value: 'initials', labelKey: 'settingsPage.avatarTypeInitials' },
  { value: 'icon', labelKey: 'settingsPage.avatarTypeIcon' },
]

function buildAvatarTypePatch(next: AvatarType): Partial<UserProfile> {
  const patch: Partial<UserProfile> = { avatarType: next }
  if (next !== 'emoji') patch.avatarEmoji = null
  if (next !== 'icon') patch.avatarIcon = null
  return patch
}

export function AvatarSelector({
  user,
  onUpdate,
  uploading,
  saving = false,
  onPickPhoto,
}: AvatarSelectorProps) {
  const { t } = useTranslation()

  const initials = (user.displayName || user.email || '?')
    .split(' ')
    .map((w) => w[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const bgValue = resolveAvatarBackground(user.avatarBg)
  const onDarkBg = isAvatarBackgroundDark(user.avatarBg)
  const isPhotoMode = user.avatarType === 'photo'
  const busy = uploading || saving

  const [photoHoverTint, setPhotoHoverTint] = useState<string | null>(null)

  useEffect(() => {
    setPhotoHoverTint(pickRandomPastelHoverTint())
  }, [])

  const avatarPreview = (
    <Avatar
      src={isPhotoMode ? (user.avatarUrl ?? undefined) : undefined}
      emoji={user.avatarType === 'emoji' ? (user.avatarEmoji ?? undefined) : undefined}
      initials={
        isPhotoMode
          ? !user.avatarUrl
            ? initials
            : undefined
          : user.avatarType === 'initials'
            ? initials
            : undefined
      }
      iconId={user.avatarType === 'icon' ? (user.avatarIcon as AvatarIconId) : undefined}
      size="xl"
      shape="rounded"
      bgStyle={bgValue}
      onDarkBg={onDarkBg}
      className="size-28 rounded-[25%] max-lg:size-32 [&_[data-avatar-emoji]]:max-lg:text-8xl"
    />
  )

  const photoOverlay = (
    <div className="avatar-photo-overlay absolute inset-0 flex flex-col items-center justify-center gap-1 rounded-[25%] bg-foreground/20">
      {uploading ? (
        <Spinner size={24} className="text-foreground/80" />
      ) : (
        <>
          <Camera size={20} className="text-foreground/90" strokeWidth={1.5} aria-hidden />
          <span className="text-[10px] font-medium text-foreground/90">
            {user.avatarUrl ? t('settingsPage.avatarReplace') : t('settingsPage.avatarAdd')}
          </span>
        </>
      )}
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-5">
        {isPhotoMode ? (
          <button
            type="button"
            onClick={onPickPhoto}
            disabled={busy}
            data-uploading={uploading ? 'true' : undefined}
            aria-label={t('settingsPage.avatarPhotoAction')}
            style={photoHoverTint ? { ['--avatar-hover-tint' as string]: photoHoverTint } : undefined}
            className={cn(
              'avatar-photo-trigger group relative mx-auto size-28 shrink-0 overflow-visible rounded-[25%] max-lg:size-32 sm:mx-0',
              'focus-visible:outline-none',
              !busy && 'cursor-pointer',
            )}
          >
            <span
              aria-hidden
              className="avatar-photo-bloom bg-(--avatar-hover-tint)"
            />
            <div className="relative z-10 size-full overflow-hidden rounded-[25%]">
              {avatarPreview}
              {photoOverlay}
            </div>
          </button>
        ) : (
          <div className="mx-auto size-28 shrink-0 max-lg:size-32 sm:mx-0">{avatarPreview}</div>
        )}

        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <p className="text-sm font-medium">{t('settingsPage.avatar')}</p>
            <p className="mt-1 text-xs leading-relaxed text-muted">
              {isPhotoMode ? t('settingsPage.avatarHintPhoto') : t('settingsPage.avatarHint')}
            </p>
          </div>

          <TabBar
            items={AVATAR_TYPES.map(({ value, labelKey }) => ({
              id: value,
              label: t(labelKey),
              disabled: busy || user.avatarType === value,
            }))}
            selectedId={user.avatarType}
            onChange={(id) => {
              if (user.avatarType === id) return
              void onUpdate(buildAvatarTypePatch(id as AvatarType))
            }}
            ariaLabel={t('settingsPage.avatar')}
            variant="pill"
            panelIdPrefix="avatar-type"
          />
        </div>
      </div>

      {user.avatarType === 'emoji' && (
        <div>
          <p className="mb-2 text-xs font-medium text-muted">{t('settingsPage.avatarTypeEmoji')}</p>
          <div className="flex flex-wrap gap-1">
            {AVATAR_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => void onUpdate({ avatarEmoji: emoji })}
                style={{ ['--chip-hover-tint' as string]: pickPastelHoverTint(emoji, 7) }}
                className={cn(
                  'flex h-9 w-9 items-center justify-center rounded-md text-lg transition-colors duration-150',
                  user.avatarEmoji === emoji
                    ? 'bg-active ring-1 ring-border'
                    : 'hover:bg-(--chip-hover-tint) focus-visible:bg-(--chip-hover-tint) focus-visible:outline-none',
                )}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      {user.avatarType === 'icon' && (
        <div>
          <p className="mb-2 text-xs font-medium text-muted">{t('settingsPage.avatarTypeIcon')}</p>
          <div className="flex flex-wrap gap-1">
            {AVATAR_ICON_IDS.map((id) => {
              const Icon = AVATAR_ICON_MAP[id]
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => void onUpdate({ avatarIcon: id })}
                  style={{ ['--chip-hover-tint' as string]: pickPastelHoverTint(id, 13) }}
                  className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-md transition-colors duration-150',
                    user.avatarIcon === id
                      ? 'bg-active text-foreground ring-1 ring-border'
                      : 'text-muted hover:bg-(--chip-hover-tint) hover:text-foreground focus-visible:bg-(--chip-hover-tint) focus-visible:text-foreground focus-visible:outline-none',
                  )}
                >
                  {Icon && <Icon size={18} strokeWidth={1.5} />}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {user.avatarType !== 'photo' && (
        <div>
          <p className="mb-2 text-xs font-medium text-muted">{t('settingsPage.avatarBackground')}</p>
          <div className="flex flex-wrap gap-2">
            {AVATAR_BACKGROUNDS.map((bg) => (
              <button
                key={bg.id}
                type="button"
                onClick={() => void onUpdate({ avatarBg: bg.id })}
                className={cn(
                  'h-8 w-8 rounded-md shadow-sm ring-1 ring-black/5 transition-transform hover:scale-105 dark:ring-white/10',
                  user.avatarBg === bg.id && 'ring-2 ring-foreground ring-offset-2 ring-offset-background',
                )}
                style={{ background: bg.value }}
                title={bg.id}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
