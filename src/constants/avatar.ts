export type AvatarType = 'photo' | 'emoji' | 'initials' | 'icon'

export const AVATAR_EMOJIS = [
  '😀', '😊', '🥳', '😎', '🤓', '🧐', '😇', '🤗',
  '👍', '👋', '🙌', '✌️', '🤝', '💪', '🎉', '🔥',
  '⭐', '🌟', '💫', '🌈', '🌸', '🌺', '🍀', '🌻',
  '🐶', '🐱', '🦊', '🐻', '🐼', '🦁', '🐯', '🐸',
  '🚀', '✈️', '🎯', '🎨', '🎭', '🎪', '🏆', '💎',
] as const

export type AvatarEmoji = (typeof AVATAR_EMOJIS)[number]

export const AVATAR_ICON_IDS = [
  'user', 'users', 'briefcase', 'heart', 'star', 'zap',
  'shield', 'crown', 'compass', 'globe', 'sun', 'moon',
  'coffee', 'music', 'camera', 'palette',
] as const

export type AvatarIconId = (typeof AVATAR_ICON_IDS)[number]

export type AvatarBackgroundType = 'solid' | 'gradient'

type AvatarBackgroundDef = {
  id: string
  type: AvatarBackgroundType
  value: string
  /** Light foreground (icon / initials) on saturated or dark fills. */
  dark?: boolean
}

export const AVATAR_BACKGROUNDS = [
  // Light neutrals — unchanged role, easy on emoji/icons
  { id: 'light-pearl', type: 'solid' as const, value: '#fafaf9' },
  { id: 'light-stone', type: 'solid' as const, value: '#f5f5f4' },
  { id: 'light-mist', type: 'solid' as const, value: '#e7e5e4' },
  { id: 'light-cloud', type: 'solid' as const, value: '#e5e5e5' },
  { id: 'light-slate', type: 'solid' as const, value: '#f1f5f9' },
  { id: 'light-sand', type: 'solid' as const, value: '#faf8f5' },
  // Soft gradients — 2026 mesh-style fills
  { id: 'grad-pearl', type: 'gradient' as const, value: 'linear-gradient(145deg, #ffffff 0%, #f4f4f5 45%, #e4e4e7 100%)' },
  { id: 'grad-sunrise', type: 'gradient' as const, value: 'linear-gradient(145deg, #fff7ed 0%, #fdba74 48%, #fb923c 100%)' },
  { id: 'grad-sky', type: 'gradient' as const, value: 'linear-gradient(145deg, #eff6ff 0%, #93c5fd 50%, #3b82f6 100%)', dark: true },
  { id: 'grad-mint', type: 'gradient' as const, value: 'linear-gradient(145deg, #ecfdf5 0%, #6ee7b7 50%, #10b981 100%)', dark: true },
  { id: 'grad-rose', type: 'gradient' as const, value: 'linear-gradient(145deg, #fff1f2 0%, #fda4af 50%, #f43f5e 100%)', dark: true },
  { id: 'grad-lilac', type: 'gradient' as const, value: 'linear-gradient(145deg, #faf5ff 0%, #d8b4fe 50%, #a855f7 100%)', dark: true },
  { id: 'grad-dusk', type: 'gradient' as const, value: 'linear-gradient(145deg, #475569 0%, #334155 55%, #1e293b 100%)', dark: true },
  { id: 'grad-charcoal', type: 'gradient' as const, value: 'linear-gradient(145deg, #737373 0%, #525252 50%, #262626 100%)', dark: true },
  // Modern solids — icon / initials
  { id: 'solid-slate', type: 'solid' as const, value: '#64748b', dark: true },
  { id: 'solid-ink', type: 'solid' as const, value: '#1e293b', dark: true },
  { id: 'solid-teal', type: 'solid' as const, value: '#0d9488', dark: true },
  { id: 'solid-coral', type: 'solid' as const, value: '#e11d48', dark: true },
  { id: 'solid-amber', type: 'solid' as const, value: '#d97706', dark: true },
  { id: 'solid-indigo', type: 'solid' as const, value: '#4f46e5', dark: true },
] as const satisfies readonly AvatarBackgroundDef[]

export type AvatarBackgroundId = (typeof AVATAR_BACKGROUNDS)[number]['id']

/** Stored profile ids from the pre-2026 palette — resolved at read time. */
const AVATAR_BACKGROUND_LEGACY_VALUES: Record<string, string> = {
  'gradient-1': '#525252',
  'gradient-2': '#737373',
  'gradient-3': '#a3a3a3',
  'gradient-4': '#d4d4d4',
  'gradient-5': '#e5e5e5',
  'gradient-6': '#f5f5f4',
  'solid-1': '#d1d5db',
  'solid-2': '#9ca3af',
  'solid-3': '#6b7280',
  'solid-4': '#4b5563',
  'solid-5': '#d99e6a',
  'solid-6': '#78716c',
}

export function resolveAvatarBackground(bgId: string | null | undefined): string | undefined {
  if (!bgId) return undefined
  const match = AVATAR_BACKGROUNDS.find((b) => b.id === bgId)
  if (match) return match.value
  return AVATAR_BACKGROUND_LEGACY_VALUES[bgId]
}

export function isAvatarBackgroundDark(bgId: string | null | undefined): boolean {
  if (!bgId) return false
  const match = AVATAR_BACKGROUNDS.find((b) => b.id === bgId)
  return match != null && 'dark' in match && match.dark === true
}
