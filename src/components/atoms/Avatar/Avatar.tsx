import type { AvatarIconId } from '@/constants/avatar'
import { AVATAR_ICON_MAP } from '@/constants/avatar-icons'
import { cn } from '@/lib/cn'

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'
type AvatarShape = 'circle' | 'square' | 'rounded'

interface AvatarProps {
  src?: string
  emoji?: string
  initials?: string
  iconId?: AvatarIconId
  size?: AvatarSize
  shape?: AvatarShape
  bgStyle?: string
  /** White icon/initials on dark or saturated avatar backgrounds. */
  onDarkBg?: boolean
  alt?: string
  className?: string
  /** Overrides default emoji scale (applied after size preset). */
  emojiClassName?: string
}

const sizeClasses: Record<AvatarSize, string> = {
  xs: 'h-6 w-6 text-xs',
  sm: 'h-8 w-8 text-sm',
  md: 'h-10 w-10 text-base',
  lg: 'h-14 w-14 text-lg',
  xl: 'h-24 w-24 text-2xl',
}

const iconSizes: Record<AvatarSize, number> = {
  xs: 12,
  sm: 14,
  md: 18,
  lg: 24,
  xl: 40,
}

/** Emoji fills most of the avatar tile — default text-* sizes are too small. */
const emojiSizeClasses: Record<AvatarSize, string> = {
  xs: 'text-base leading-none',
  sm: 'text-xl leading-none',
  md: 'text-3xl leading-none',
  lg: 'text-5xl leading-none',
  xl: 'text-7xl leading-none',
}

const shapeClasses: Record<AvatarShape, string> = {
  circle: 'rounded-full',
  square: 'rounded-sm',
  rounded: 'rounded-[25%]',
}

export function Avatar({ src, emoji, initials, iconId, size = 'md', shape = 'circle', bgStyle, onDarkBg = false, alt = '', className = '', emojiClassName }: AvatarProps) {
  const base = cn(
    'inline-flex shrink-0 items-center justify-center overflow-hidden',
    sizeClasses[size],
    shapeClasses[shape],
    bgStyle ? '' : 'bg-primary/5',
    className,
  )

  const style = bgStyle ? { background: bgStyle } : undefined

  if (src) {
    return <img src={src} alt={alt} className={cn(base, 'object-cover')} style={style} />
  }

  if (emoji) {
    return (
      <span
        data-avatar-emoji
        className={cn(base, emojiSizeClasses[size], emojiClassName)}
        style={style}
      >
        {emoji}
      </span>
    )
  }

  const fgOnBg = onDarkBg ? 'text-white' : 'text-muted'

  if (iconId) {
    const Icon = AVATAR_ICON_MAP[iconId]
    if (Icon) {
      return (
        <span className={cn(base, fgOnBg)} style={style}>
          <Icon size={iconSizes[size]} strokeWidth={1.5} />
        </span>
      )
    }
  }

  return (
    <span className={cn(base, 'font-medium', fgOnBg)} style={style}>
      {initials ?? '?'}
    </span>
  )
}
