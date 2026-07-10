import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './locales/en.json'
import de from './locales/de.json'
import ru from './locales/ru.json'
import { migrateLegacyPersistKeys } from '@/lib/migrations/legacyPersist'

migrateLegacyPersistKeys()

const SUPPORTED = ['en', 'de', 'ru'] as const

function getStoredLanguage(): string | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem('2mb-crm-language')
    if (!raw) return null
    const parsed = JSON.parse(raw) as { state?: { language?: string } }
    const lang = parsed?.state?.language ?? null
    return lang && SUPPORTED.includes(lang as (typeof SUPPORTED)[number]) ? lang : null
  } catch {
    return null
  }
}

function getBrowserLanguage(): string {
  if (typeof navigator === 'undefined') return 'en'
  const lang = navigator.language ?? navigator.languages?.[0]
  const code = lang?.slice(0, 2).toLowerCase()
  return code && SUPPORTED.includes(code as (typeof SUPPORTED)[number]) ? code : 'en'
}

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    de: { translation: de },
    ru: { translation: ru },
  },
  lng: getStoredLanguage() ?? getBrowserLanguage(),
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
})

export default i18n
