'use client'

import { Sun, Moon, Monitor } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/cn'
import { useUserStore, type ThemeMode } from '@/stores/userStore'

const MODES: { value: ThemeMode; icon: typeof Sun }[] = [
  { value: 'light', icon: Sun },
  { value: 'dark', icon: Moon },
  { value: 'system', icon: Monitor },
]

const THEME_LABEL_KEYS: Record<ThemeMode, string> = {
  light: 'branding.themeLight',
  dark: 'branding.themeDark',
  system: 'branding.themeSystem',
}

type SegmentedSize = 'sm' | 'md'

const SIZE: Record<
  SegmentedSize,
  { shell: string; btn: string; btnWidth: string; icon: number }
> = {
  sm: { shell: 'h-8', btn: 'h-6', btnWidth: 'w-7', icon: 14 },
  md: { shell: 'h-9', btn: 'h-7', btnWidth: 'w-8', icon: 16 },
}

export function ThemeToggle({ size = 'sm' }: { size?: SegmentedSize }) {
  const { t } = useTranslation()
  const themeMode = useUserStore((s) => s.themeMode)
  const setThemeMode = useUserStore((s) => s.setThemeMode)
  const s = SIZE[size]

  return (
    <div className={cn('inline-flex items-center rounded-sm border border-border p-0.5', s.shell)}>
      {MODES.map(({ value, icon: Icon }) => (
        <button
          key={value}
          onClick={() => setThemeMode(value)}
          className={cn(
            'flex items-center justify-center rounded-sm transition-colors',
            s.btn,
            s.btnWidth,
            themeMode === value
              ? 'bg-active text-foreground'
              : 'text-muted hover:bg-hover hover:text-foreground',
          )}
          aria-label={t(THEME_LABEL_KEYS[value])}
        >
          <Icon size={s.icon} />
        </button>
      ))}
    </div>
  )
}
