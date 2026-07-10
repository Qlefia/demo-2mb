'use client'

import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/cn'
import { useUserStore } from '@/stores/userStore'
import { useLanguageStore, type Language } from '@/stores/languageStore'

const LANGUAGES: { value: Language; labelKey: string }[] = [
  { value: 'en', labelKey: 'nav.languageEn' },
  { value: 'de', labelKey: 'nav.languageDe' },
  { value: 'ru', labelKey: 'nav.languageRu' },
]

type SegmentedSize = 'sm' | 'md'

const SIZE: Record<SegmentedSize, { shell: string; btn: string; btnMinW: string; text: string }> = {
  sm: { shell: 'h-8', btn: 'h-6', btnMinW: 'min-w-[1.85rem]', text: 'text-[10px]' },
  md: { shell: 'h-9', btn: 'h-7', btnMinW: 'min-w-[2.25rem]', text: 'text-xs' },
}

export function LanguageSwitcher({
  className,
  size = 'sm',
}: {
  className?: string
  size?: SegmentedSize
}) {
  const { t, i18n } = useTranslation()
  const userId = useUserStore((s) => s.user.id)
  const profileLanguage = useUserStore((s) => s.user.language)
  const updateProfile = useUserStore((s) => s.updateProfile)
  const guestLanguage = useLanguageStore((s) => s.language)
  const setGuestLanguage = useLanguageStore((s) => s.setLanguage)

  const currentLanguage = userId ? profileLanguage : guestLanguage

  const handleChange = (lang: Language) => {
    i18n.changeLanguage(lang)
    if (userId) {
      updateProfile({ language: lang })
    } else {
      setGuestLanguage(lang)
    }
  }

  const s = SIZE[size]

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-sm border border-border p-0.5',
        s.shell,
        className,
      )}
      role="group"
      aria-label={t('nav.language')}
    >
      {LANGUAGES.map(({ value, labelKey }) => (
        <button
          key={value}
          type="button"
          onClick={() => handleChange(value)}
          className={cn(
            'flex shrink-0 items-center justify-center rounded-sm px-1 font-semibold uppercase tracking-tight transition-colors',
            s.btn,
            s.btnMinW,
            s.text,
            currentLanguage === value
              ? 'bg-active text-foreground'
              : 'text-muted hover:bg-hover hover:text-foreground',
          )}
          aria-pressed={currentLanguage === value}
          aria-label={t(labelKey)}
        >
          {value.toUpperCase()}
        </button>
      ))}
    </div>
  )
}
