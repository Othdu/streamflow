import { useAppStore } from '@/store'
import { t, isRTL, setLanguage } from '@/services/i18n'
import type { Language } from '@/types'

export function useI18n() {
  const language = useAppStore(s => s.settings.language)
  setLanguage(language)

  return {
    t: (key: string, params?: Record<string, string>) => t(key, params),
    isRTL: () => isRTL(),
    language,
  }
}

export function useDirection() {
  const language = useAppStore(s => s.settings.language)
  return language === 'ar' ? 'rtl' : 'ltr'
}
