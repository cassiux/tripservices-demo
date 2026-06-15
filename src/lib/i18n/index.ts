import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import en from '@/locales/en.json'

/** All locale resources. Additional languages register here as they are added. */
export const resources = {
  en: { translation: en },
} as const

void i18n.use(initReactI18next).init({
  resources,
  lng: 'en',
  fallbackLng: 'en',
  defaultNS: 'translation',
  interpolation: {
    // React already escapes values, so i18next must not double-escape.
    escapeValue: false,
  },
  react: {
    // Resources are bundled (not loaded async), so Suspense is unnecessary.
    useSuspense: false,
  },
})

export default i18n
