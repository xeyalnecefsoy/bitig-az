import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'

import {
  defaultLocale,
  isLocale,
  t as translate,
  type Locale,
} from '@bitig/i18n'

export type { Locale }

const STORAGE_KEY = 'bitig-locale'

type LocaleContextValue = {
  locale: Locale
  setLocale: (l: Locale) => Promise<void>
  t: (key: string) => string
  ready: boolean
}

const LocaleContext = createContext<LocaleContextValue | null>(null)

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((v) => {
      if (v && isLocale(v)) setLocaleState(v)
      setReady(true)
    })
  }, [])

  const setLocale = useCallback(async (l: Locale) => {
    setLocaleState(l)
    await AsyncStorage.setItem(STORAGE_KEY, l)
  }, [])

  const t = useCallback((key: string) => translate(locale, key), [locale])

  const value = useMemo(
    () => ({ locale, setLocale, t, ready }),
    [locale, setLocale, t, ready]
  )

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
}

export function useLocale() {
  const ctx = useContext(LocaleContext)
  if (!ctx) throw new Error('useLocale must be used within LocaleProvider')
  return ctx
}
