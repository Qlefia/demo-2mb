'use client'

import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useUserStore } from '@/stores/userStore'
import { useLanguageStore, type Language } from '@/stores/languageStore'

export function LanguageSync() {
  const { i18n } = useTranslation()
  const userId = useUserStore((s) => s.user.id)
  const profileLanguage = useUserStore((s) => s.user.language)
  const guestLanguage = useLanguageStore((s) => s.language)
  const setGuestLanguage = useLanguageStore((s) => s.setLanguage)

  useEffect(() => {
    if (userId) {
      if (i18n.language !== profileLanguage) {
        i18n.changeLanguage(profileLanguage)
      }
      return
    }
    const stored = typeof window !== 'undefined' && localStorage.getItem('2mb-crm-language')
    if (!stored && (i18n.language === 'en' || i18n.language === 'de' || i18n.language === 'ru')) {
      setGuestLanguage(i18n.language as Language)
      return
    }
    if (i18n.language !== guestLanguage) {
      i18n.changeLanguage(guestLanguage)
    }
  }, [userId, profileLanguage, guestLanguage, i18n, setGuestLanguage])

  return null
}
