const AVATAR_TYPES = ['photo', 'emoji', 'initials', 'icon'] as const

export type ProfileAvatarType = (typeof AVATAR_TYPES)[number]
export type ProfileLanguage = 'de' | 'en' | 'ru'

export const DEFAULT_PROFILE_LANGUAGE: ProfileLanguage = 'de'
export const DEFAULT_PROFILE_TIMEZONE = 'Europe/Berlin'

export interface SanitizedProfileMeta {
  display_name: string | null
  avatar_url: string | null
  avatar_type: ProfileAvatarType
  avatar_emoji: string | null
  avatar_icon: string | null
  avatar_bg: string | null
  language: ProfileLanguage
  timezone: string
}

function strOrNull(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

/** Supabase Auth metadata rejects oversized values — legacy data URLs must never be re-sent. */
export function sanitizeAvatarUrl(value: unknown): string | null {
  const raw = strOrNull(value)
  if (!raw) return null
  if (raw.startsWith('data:')) return null
  try {
    const parsed = new URL(raw)
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') return raw
  } catch {
    return null
  }
  return null
}

export function pickProfileLanguage(value: unknown): ProfileLanguage {
  return value === 'en' || value === 'de' || value === 'ru' ? value : DEFAULT_PROFILE_LANGUAGE
}

export function pickProfileAvatarType(value: unknown): ProfileAvatarType {
  return AVATAR_TYPES.includes(value as ProfileAvatarType)
    ? (value as ProfileAvatarType)
    : 'initials'
}

/** Read profile fields from raw auth metadata, stripping invalid avatar URLs. */
export function readProfileMetaFromAuth(meta: Record<string, unknown>): SanitizedProfileMeta {
  return {
    display_name: strOrNull(meta.display_name),
    avatar_url: sanitizeAvatarUrl(meta.avatar_url),
    avatar_type: pickProfileAvatarType(meta.avatar_type),
    avatar_emoji: strOrNull(meta.avatar_emoji),
    avatar_icon: strOrNull(meta.avatar_icon),
    avatar_bg: strOrNull(meta.avatar_bg),
    language: pickProfileLanguage(meta.language),
    timezone: strOrNull(meta.timezone) ?? DEFAULT_PROFILE_TIMEZONE,
  }
}

/** Merge patch into auth metadata — strips legacy data URLs, preserves unrelated keys. */
export function mergeProfileMetaPatch(
  current: Record<string, unknown>,
  patch: {
    displayName?: string
    avatarUrl?: string | null
    avatarType?: ProfileAvatarType
    avatarEmoji?: string | null
    avatarIcon?: string | null
    avatarBg?: string | null
    language?: ProfileLanguage
    timezone?: string
  },
): Record<string, unknown> {
  const next: Record<string, unknown> = { ...current }

  if (typeof next.avatar_url === 'string' && next.avatar_url.startsWith('data:')) {
    next.avatar_url = null
  }

  const base = readProfileMetaFromAuth(next)

  if (patch.displayName !== undefined) base.display_name = patch.displayName
  if (patch.avatarUrl !== undefined) base.avatar_url = sanitizeAvatarUrl(patch.avatarUrl)
  if (patch.avatarType !== undefined) base.avatar_type = patch.avatarType
  if (patch.avatarEmoji !== undefined) base.avatar_emoji = patch.avatarEmoji
  if (patch.avatarIcon !== undefined) base.avatar_icon = patch.avatarIcon
  if (patch.avatarBg !== undefined) base.avatar_bg = patch.avatarBg
  if (patch.language !== undefined) base.language = patch.language
  if (patch.timezone !== undefined) base.timezone = patch.timezone

  next.display_name = base.display_name
  next.avatar_url = base.avatar_url
  next.avatar_type = base.avatar_type
  next.avatar_emoji = base.avatar_emoji
  next.avatar_icon = base.avatar_icon
  next.avatar_bg = base.avatar_bg
  next.language = base.language
  next.timezone = base.timezone

  return next
}

export function profileMetaToClientUser(
  userId: string,
  email: string,
  meta: SanitizedProfileMeta,
) {
  return {
    id: userId,
    email,
    displayName: meta.display_name ?? (email.includes('@') ? email.split('@')[0] : ''),
    avatarUrl: meta.avatar_url,
    avatarType: meta.avatar_type,
    avatarEmoji: meta.avatar_emoji,
    avatarIcon: meta.avatar_icon,
    avatarBg: meta.avatar_bg,
    language: meta.language,
    timezone: meta.timezone,
  }
}
